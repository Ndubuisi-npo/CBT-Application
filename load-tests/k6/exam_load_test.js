import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const DEFAULT_BASE_URL = 'https://cbt-application-ufyd.onrender.com';
const BASE_URL = (__ENV.BASE_URL || __ENV.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const STUDENT_VUS = Number(__ENV.STUDENTS_VUS || 30);
const STUDENT_ITERATIONS = Number(__ENV.STUDENT_ITERATIONS || 100); // exams per student VU
const TEACHER_VUS = Number(__ENV.TEACHERS_VUS || 30);
const SUPERADMIN_VUS = Number(__ENV.SUPERADMINS_VUS || 30);
const QUESTIONS_PER_EXAM = Number(__ENV.QUESTIONS_PER_EXAM || 100);
const TEACHER_DURATION = __ENV.TEACHER_DURATION || '5m';
const SUPERADMIN_DURATION = __ENV.SUPERADMIN_DURATION || '5m';
const HTTP_REQ_DURATION_THRESHOLD = __ENV.HTTP_REQ_DURATION_THRESHOLD || 'p(95)<2000';
const DEBUG_LOGIN = __ENV.DEBUG_LOGIN === '1';
const DEBUG_REQUESTS = __ENV.DEBUG_REQUESTS === '1';
const LOGIN_RETRIES = Number(__ENV.LOGIN_RETRIES || 2);
const LOGIN_RETRY_SLEEP_SECONDS = Number(__ENV.LOGIN_RETRY_SLEEP_SECONDS || 2);
const LOGIN_STAGGER_MAX_SECONDS = Number(__ENV.LOGIN_STAGGER_MAX_SECONDS || 30);
const AUTH_FAILURE_SLEEP_SECONDS = Number(__ENV.AUTH_FAILURE_SLEEP_SECONDS || 5);
const TENANT_HANDLE = __ENV.TENANT_HANDLE || __ENV.X_TENANT || '';
const SHARED_AUTH = __ENV.SHARED_AUTH !== '0';

const authTokens = {};
const authFailures = {};

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

if (SUPERADMIN_VUS > 0) {
  scenarios.superadmins = {
    executor: 'constant-vus',
    vus: SUPERADMIN_VUS,
    duration: SUPERADMIN_DURATION,
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
  return {
    student: {
      identifier: __ENV.STUDENT_USER || `student${roleIndex}@example.com`,
      password: __ENV.STUDENT_PASS || 'password',
    },
    teacher: {
      identifier: __ENV.TEACHER_USER || `teacher${roleIndex}@example.com`,
      password: __ENV.TEACHER_PASS || 'password',
    },
    superadmin: {
      identifier: __ENV.SUPERADMIN_USER || 'admin@example.com',
      password: __ENV.SUPERADMIN_PASS || 'password',
    },
  }[role];
}

// Helper: minimal login flow. Configure valid credentials via environment variables.
function login(roleIndex, role) {
  const creds = {
    ...credentialsFor(roleIndex, role),
  };

  const url = `${BASE_URL}/api/auth/login`;
  for (let attempt = 1; attempt <= LOGIN_RETRIES + 1; attempt++) {
    const res = http.post(url, JSON.stringify({ identifier: creds.identifier, password: creds.password }), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(TENANT_HANDLE && role !== 'superadmin' ? { 'X-Tenant': TENANT_HANDLE } : {}),
      },
      tags: { endpoint: 'login', role },
    });

    if (DEBUG_LOGIN) {
      console.log(`${role} login attempt=${attempt} status=${res.status} error=${res.error || ''} body=${res.body}`);
    }

    check(res, { 'logged in': (r) => r.status === 200 });
    if (res.status === 200) {
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
  if (!SHARED_AUTH) {
    return {};
  }

  const tokens = {};

  if (STUDENT_VUS > 0) {
    tokens.student = login(1, 'student');
  }

  if (TEACHER_VUS > 0) {
    tokens.teacher = login(1, 'teacher');
  }

  if (SUPERADMIN_VUS > 0) {
    tokens.superadmin = login(1, 'superadmin');
  }

  return { tokens };
}

function getToken(roleIndex, role, setupData = {}) {
  const sharedToken = setupData?.tokens?.[role];
  if (sharedToken) {
    return sharedToken;
  }

  if (SHARED_AUTH) {
    sleep(AUTH_FAILURE_SLEEP_SECONDS);
    return null;
  }

  if (authTokens[role]) {
    return authTokens[role];
  }

  if (authFailures[role]) {
    sleep(AUTH_FAILURE_SLEEP_SECONDS);
    return null;
  }

  if (LOGIN_STAGGER_MAX_SECONDS > 0) {
    sleep(Math.random() * LOGIN_STAGGER_MAX_SECONDS);
  }

  const token = login(roleIndex, role);
  if (token) {
    authTokens[role] = token;
  } else {
    authFailures[role] = true;
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

  const attemptsRes = getJson(
    `${BASE_URL}/api/exams/${examId}/attempts`,
    { ...authHeaders, tags: { endpoint: 'teacher.exam_attempts' } },
    'teacher attempts loaded',
  );
  if (attemptsRes.status === 200) {
    const attempts = asArray(parseJson(attemptsRes));
    if (attempts.length) {
      const attemptId = attempts[0].id || attempts[0].attempt_id || attempts[0].attemptId;
      if (attemptId) {
        postJson(
          `${BASE_URL}/api/student/exams/attempts/${attemptId}/force-submit`,
          null,
          { ...authHeaders, tags: { endpoint: 'teacher.force_submit' } },
          'teacher force submit accepted',
        );
      }
    }
  }

  sleep(1);
}

function superadminFlow(vu, setupData) {
  const token = getToken(vu, 'superadmin', setupData);
  if (!token) return;

  const authHeaders = authParams(token);

  getJson(
    `${BASE_URL}/api/super-admin/tenants`,
    { ...authHeaders, tags: { endpoint: 'superadmin.tenants' } },
    'superadmin tenants loaded',
  );
  getJson(
    `${BASE_URL}/api/super-admin/plans`,
    { ...authHeaders, tags: { endpoint: 'superadmin.plans' } },
    'superadmin plans loaded',
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
    superadminFlow(__VU, setupData);
  }
}
