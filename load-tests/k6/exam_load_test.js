import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { SharedArray } from 'k6/data';

const DEFAULT_BASE_URL = 'https://cbt-application-ufyd.onrender.com';
const BASE_URL = (__ENV.BASE_URL || __ENV.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
// Load credential CSVs (place them under load-tests/k6/data/ by default)
const STUDENTS_CSV = __ENV.STUDENTS_CSV || 'data/students.csv';
const TEACHERS_CSV = __ENV.TEACHERS_CSV || 'data/teachers.csv';

function parseCsvContent(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = lines.shift().split(',').map((h) => h.trim());
  return lines.map((line) => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || '').trim();
    });
    return obj;
  });
}

const studentsData = new SharedArray('students', function () {
  try {
    const csv = open(STUDENTS_CSV);
    return parseCsvContent(csv);
  } catch (e) {
    console.error('Failed to load students CSV:', e.message);
    return [];
  }
});

const teachersData = new SharedArray('teachers', function () {
  try {
    const csv = open(TEACHERS_CSV);
    return parseCsvContent(csv);
  } catch (e) {
    console.error('Failed to load teachers CSV:', e.message);
    return [];
  }
});

const DEFAULT_STUDENT_PASS = __ENV.STUDENT_PASS || 'Cbt@2026';
const DEFAULT_TEACHER_PASS = __ENV.TEACHER_PASS || 'teach12345';

let STUDENT_VUS = Number(__ENV.STUDENTS_VUS || studentsData.length || 48);
const STUDENT_ITERATIONS = Number(__ENV.STUDENT_ITERATIONS || 100); // exams per student VU
let TEACHER_VUS = Number(__ENV.TEACHERS_VUS || teachersData.length || 50);
const SCHOOLADMIN_VUS = Number(__ENV.SCHOOLADMIN_VUS || 1); // Test school admin by default
const QUESTIONS_PER_EXAM = Number(__ENV.QUESTIONS_PER_EXAM || 100);
const TEACHER_DURATION = __ENV.TEACHER_DURATION || '5m';
const SCHOOLADMIN_DURATION = __ENV.SCHOOLADMIN_DURATION || '5m';
const HTTP_REQ_DURATION_THRESHOLD = __ENV.HTTP_REQ_DURATION_THRESHOLD || 'p(95)<15000';
const DEBUG_LOGIN = __ENV.DEBUG_LOGIN === '1';
const DEBUG_REQUESTS = __ENV.DEBUG_REQUESTS === '1';
const LOGIN_RETRIES = Number(__ENV.LOGIN_RETRIES || 2);
const LOGIN_RETRY_SLEEP_SECONDS = Number(__ENV.LOGIN_RETRY_SLEEP_SECONDS || 2);
const LOGIN_STAGGER_MAX_SECONDS = Number(__ENV.LOGIN_STAGGER_MAX_SECONDS || 30);
const AUTH_FAILURE_SLEEP_SECONDS = Number(__ENV.AUTH_FAILURE_SLEEP_SECONDS || 5);
const TENANT_HANDLE = __ENV.TENANT_HANDLE || __ENV.X_TENANT || 'pss';
const SHARED_AUTH = false;

const authTokens = {};
const authFailures = {};

const studentLoginAttempts = new Counter('student_login_attempts');
const studentLoginSuccess = new Counter('student_login_successes');
const studentLoginFailure = new Counter('student_login_failures');
const teacherLoginAttempts = new Counter('teacher_login_attempts');
const teacherLoginSuccess = new Counter('teacher_login_successes');
const teacherLoginFailure = new Counter('teacher_login_failures');
const schooladminLoginAttempts = new Counter('schooladmin_login_attempts');
const schooladminLoginSuccess = new Counter('schooladmin_login_successes');
const schooladminLoginFailure = new Counter('schooladmin_login_failures');

const scenarios = {};

if (STUDENT_VUS > 0 && STUDENT_ITERATIONS > 0) {
  scenarios.students = {
    executor: 'per-vu-iterations',
    vus: STUDENT_VUS,
    iterations: STUDENT_ITERATIONS,
    startTime: '0s',
  };
}

if (TEACHER_VUS > 0) {
  scenarios.teachers = {
    executor: 'constant-vus',
    vus: TEACHER_VUS,
    duration: TEACHER_DURATION,
    startTime: '0s',
  };
}

if (SCHOOLADMIN_VUS > 0) {
  scenarios.schooladmin = {
    executor: 'constant-vus',
    vus: SCHOOLADMIN_VUS,
    duration: SCHOOLADMIN_DURATION,
    startTime: '0s',
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_duration: [HTTP_REQ_DURATION_THRESHOLD],
  },
};

function parseJson(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

function unwrapData(data) {
  return data?.data ?? data;
}

function asArray(data) {
  const value = unwrapData(data);
  return Array.isArray(value) ? value : [];
}

function authParams(token) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (TENANT_HANDLE) {
    headers['X-Tenant'] = TENANT_HANDLE;
  }

  return { headers };
}

function getJson(url, params, checkName, okStatuses = [200]) {
  const res = http.get(url, params);
  check(res, { [checkName]: (r) => okStatuses.includes(r.status) });
  logUnexpectedResponse(checkName, res, okStatuses);
  return res;
}

function postJson(url, body, params, checkName, okStatuses = [200, 201]) {
  const res = http.post(url, body, params);
  check(res, { [checkName]: (r) => okStatuses.includes(r.status) });
  logUnexpectedResponse(checkName, res, okStatuses);
  return res;
}

function putJson(url, body, params, checkName, okStatuses = [200, 201]) {
  const res = http.put(url, body, params);
  check(res, { [checkName]: (r) => okStatuses.includes(r.status) });
  logUnexpectedResponse(checkName, res, okStatuses);
  return res;
}

function logUnexpectedResponse(checkName, res, okStatuses) {
  if (!DEBUG_REQUESTS || okStatuses.includes(res.status)) {
    return;
  }

  const body = String(res.body || '').slice(0, 500);
  console.log(`${checkName} status=${res.status} error=${res.error || ''} body=${body}`);
}

function credentialsFor(roleIndex, role) {
  if (role === 'student') {
    if (!studentsData.length) {
      return { identifier: __ENV.STUDENT_USER || `student${roleIndex}@example.com`, password: DEFAULT_STUDENT_PASS };
    }
    const idx = ((roleIndex - 1) % studentsData.length + studentsData.length) % studentsData.length;
    const s = studentsData[idx];
    const id = (s.admission_number || '').trim() || (s.email || '').trim() || `student${roleIndex}@example.com`;
    return { identifier: id, password: DEFAULT_STUDENT_PASS };
  }

  if (role === 'teacher') {
    if (!teachersData.length) {
      return { identifier: __ENV.TEACHER_USER || `teacher${roleIndex}@example.com`, password: DEFAULT_TEACHER_PASS };
    }
    const idx = ((roleIndex - 1) % teachersData.length + teachersData.length) % teachersData.length;
    const t = teachersData[idx];
    return { identifier: t.email || t.email?.trim() || (`teacher${roleIndex}@example.com`), password: DEFAULT_TEACHER_PASS };
  }

  return { identifier: __ENV.SCHOOLADMIN_USER || 'admin@premier.com', password: __ENV.SCHOOLADMIN_PASS || '12345678' };
}

// Helper: minimal login flow. Configure valid credentials via environment variables.
function login(roleIndex, role) {
  const creds = {
    ...credentialsFor(roleIndex, role),
  };

  if (role === 'student') studentLoginAttempts.add(1);
  if (role === 'teacher') teacherLoginAttempts.add(1);
  if (role === 'schooladmin') schooladminLoginAttempts.add(1);

  const url = `${BASE_URL}/api/auth/login`;
  for (let attempt = 1; attempt <= LOGIN_RETRIES + 1; attempt++) {
    const res = http.post(url, JSON.stringify({ identifier: creds.identifier, password: creds.password }), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(TENANT_HANDLE ? { 'X-Tenant': TENANT_HANDLE } : {}),
      },
      tags: { endpoint: 'login', role },
    });

    if (DEBUG_LOGIN) {
      console.log(`${role} login attempt=${attempt} status=${res.status} error=${res.error || ''} body=${res.body}`);
    }

    const checkName = `${role}_logged_in`;
    check(res, { [checkName]: (r) => r.status === 200 });
    const success = res.status === 200;
    if (role === 'student') {
      studentLoginSuccess.add(success ? 1 : 0);
      studentLoginFailure.add(success ? 0 : 1);
    }
    if (role === 'teacher') {
      teacherLoginSuccess.add(success ? 1 : 0);
      teacherLoginFailure.add(success ? 0 : 1);
    }
    if (role === 'schooladmin') {
      schooladminLoginSuccess.add(success ? 1 : 0);
      schooladminLoginFailure.add(success ? 0 : 1);
    }

    if (success) {
      const data = unwrapData(parseJson(res));
      return data?.token || data?.access_token || data?.auth_token || null;
    }

    if (res.status === 401 || res.status === 403) {
      return null;
    }

    if (attempt <= LOGIN_RETRIES) {
      sleep(LOGIN_RETRY_SLEEP_SECONDS * attempt);
    }
  }

  return null;
}

export function setup() {
  return {};
}

function getToken(roleIndex, role, setupData = {}) {
  const sharedToken = setupData?.tokens?.[role];
  if (sharedToken) {
    return sharedToken;
  }

  const tokenKey = `${role}:${roleIndex}`;
  if (authTokens[tokenKey]) {
    return authTokens[tokenKey];
  }

  if (authFailures[tokenKey]) {
    sleep(AUTH_FAILURE_SLEEP_SECONDS);
    return null;
  }

  if (LOGIN_STAGGER_MAX_SECONDS > 0) {
    sleep(Math.random() * LOGIN_STAGGER_MAX_SECONDS);
  }

  const token = login(roleIndex, role);
  if (token) {
    authTokens[tokenKey] = token;
  } else {
    authFailures[tokenKey] = true;
    sleep(AUTH_FAILURE_SLEEP_SECONDS);
  }

  return token;
}

function studentFlow(vu, setupData) {
  const token = getToken(vu, 'student', setupData);
  if (!token) return;

  const authHeaders = authParams(token);

  const available = getJson(
    `${BASE_URL}/api/student/exams/available`,
    { ...authHeaders, tags: { endpoint: 'student.available_exams' } },
    'student available exams loaded',
  );
  let examId = 1;
  if (available.status === 200) {
    const exams = asArray(parseJson(available));
    if (exams.length) {
      examId = exams[__ITER % exams.length].id || exams[0].id || 1;
    }
  }

  const startRes = postJson(
    `${BASE_URL}/api/student/exams/${examId}/start`,
    null,
    { ...authHeaders, tags: { endpoint: 'student.start_exam' } },
    'student exam started',
  );
  if (startRes.status !== 200 && startRes.status !== 201) {
    return;
  }

  const attemptRes = getJson(
    `${BASE_URL}/api/student/exams/${examId}/attempt`,
    { ...authHeaders, tags: { endpoint: 'student.current_attempt' } },
    'student attempt loaded',
  );
  if (attemptRes.status !== 200) {
    return;
  }

  let attemptId = null;
  const attempt = unwrapData(parseJson(attemptRes));
  attemptId = attempt?.id || attempt?.attempt_id || attempt?.attemptId || null;
  if (!attemptId) {
    return;
  }

  const questionsRes = getJson(
    `${BASE_URL}/api/student/exams/attempts/${attemptId}/questions`,
    { ...authHeaders, tags: { endpoint: 'student.questions' } },
    'student questions loaded',
  );
  let questionIds = [];
  if (questionsRes.status === 200) {
    const questions = asArray(parseJson(questionsRes));
    questionIds = questions.map((q) => q.id || q.question_id || q.questionId).filter(Boolean);
  }

  if (!questionIds.length) {
    for (let q = 1; q <= Math.min(QUESTIONS_PER_EXAM, 100); q++) {
      questionIds.push(q);
    }
  }

  for (let i = 0; i < Math.min(questionIds.length, QUESTIONS_PER_EXAM); i++) {
    const questionId = questionIds[i];
    const payload = JSON.stringify({ answer: 'A' });
    putJson(
      `${BASE_URL}/api/student/exams/attempts/${attemptId}/answers/${questionId}`,
      payload,
      { ...authHeaders, tags: { endpoint: 'student.save_answer' } },
      'student answer saved',
    );
    sleep(0.01);
  }

  postJson(
    `${BASE_URL}/api/student/exams/attempts/${attemptId}/submit`,
    null,
    { ...authHeaders, tags: { endpoint: 'student.submit_attempt' } },
    'student exam submitted',
  );
  sleep(0.5);
}

function teacherFlow(vu, setupData) {
  const token = getToken(vu, 'teacher', setupData);
  if (!token) return;

  const authHeaders = authParams(token);

  const listRes = getJson(
    `${BASE_URL}/api/exams`,
    { ...authHeaders, tags: { endpoint: 'teacher.exams' } },
    'teacher exams loaded',
  );
  let examId = (vu % 100) + 1;
  if (listRes.status === 200) {
    const exams = asArray(parseJson(listRes));
    if (exams.length) examId = exams[vu % exams.length].id || examId;
  }

  // Teacher attempts loading removed - not testing this endpoint

  sleep(1);
}

function schooladminFlow(vu, setupData) {
  const token = getToken(vu, 'schooladmin', setupData);
  if (!token) return;

  const authHeaders = authParams(token);

  // Replace these schooladmin API requests with the actual school admin workload you want to test.
  getJson(
    `${BASE_URL}/api/school-admin/dashboard`,
    { ...authHeaders, tags: { endpoint: 'schooladmin.dashboard' } },
    'schooladmin dashboard loaded',
  );
  getJson(
    `${BASE_URL}/api/school-admin/settings`,
    { ...authHeaders, tags: { endpoint: 'schooladmin.settings' } },
    'schooladmin settings loaded',
  );
  sleep(1);
}

export default function (setupData) {
  const scenario = exec.scenario.name;
  if (scenario === 'students') {
    studentFlow(__VU, setupData);
  } else if (scenario === 'teachers') {
    teacherFlow(__VU, setupData);
  } else {
    schooladminFlow(__VU, setupData);
  }
}
