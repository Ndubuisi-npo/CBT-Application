Load testing with k6

Files:
- `load-tests/k6/exam_load_test.js` — k6 script that simulates students, teachers, and superadmin scenarios.

Quick start:
1. Install k6: https://k6.io/docs/getting-started/installation
2. From the repo root run (example):

```bash
BASE_URL=https://cbt-application-ufyd.onrender.com \
  STUDENTS_VUS=30 STUDENT_ITERATIONS=100 \
  TEACHERS_VUS=30 SUPERADMINS_VUS=30 \
  TENANT_HANDLE=pre \
  QUESTIONS_PER_EXAM=100 \
  k6 run load-tests/k6/exam_load_test.js
```

Notes:
- The script targets the real app API paths used by the frontend services, including `/api/auth/login`, `/api/student/exams/available`, `/api/student/exams/{examId}/start`, `/api/student/exams/attempts/{attemptId}/questions`, `/api/exams`, and `/api/super-admin/tenants`.
- `BASE_URL` defaults to the same backend as the frontend app: `https://cbt-application-ufyd.onrender.com`. You can also pass `VITE_API_BASE_URL` if you want to reuse the frontend env var name.
- Set `STUDENTS_VUS`, `TEACHERS_VUS`, or `SUPERADMINS_VUS` to `0` to disable that scenario for smoke testing. Teacher and superadmin durations can be shortened with `TEACHER_DURATION` and `SUPERADMIN_DURATION`.
- For smoke tests against a cold hosted backend, you can relax the latency threshold with `HTTP_REQ_DURATION_THRESHOLD='p(95)<5000'`.
- Set `DEBUG_LOGIN=1` during smoke tests to print the login response status and body.
- Login is shared once per role by default (`SHARED_AUTH=1`), which is best when reusing one student, teacher, and superadmin account. Set `SHARED_AUTH=0` if you create a real pool of separate users and want each VU to log in separately. `LOGIN_STAGGER_MAX_SECONDS` defaults to `30` for per-VU auth mode.
- The default mixed-load profile is 90 total VUs: 30 students, 30 teachers, and 30 superadmins.
- Tenant-scoped users such as students and teachers require `TENANT_HANDLE`; for Premier Academy use `TENANT_HANDLE=pre`.
- Supplying valid credentials via env vars helps create real authenticated sessions. See the script for `STUDENT_USER`, `STUDENT_PASS`, `TEACHER_USER`, `TEACHER_PASS`, and `SUPERADMIN_*` env var usage.
- This test is heavy: adjust VUs, iterations, and question count to match available test infrastructure.
