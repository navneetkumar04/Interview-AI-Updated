const http = require('http');

async function main() {
  console.log('====================================================');
  console.log('       INTERVIEW.AI FINAL ACCEPTANCE TEST SUITE      ');
  console.log('====================================================\n');

  const BASE = 'http://localhost:3000/api';
  const results = [];

  function record(category, testName, status, details = '') {
    results.push({ category, testName, status, details });
    const sym = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'BLOCKED' ? '⚠️' : '⏭️';
    console.log(`${sym} [${category}] ${testName} -> ${status}${details ? ` (${details})` : ''}`);
  }

  async function api(path, method = 'GET', body = null, token = null) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // --- SECTION 1: HEALTH & CONFIGURATION ---
  try {
    const health = await api('/health');
    if (health.ok && health.data && health.data.status === 'ok') {
      record('HEALTH', 'Health Endpoint GET /api/health', 'PASS', 'Status OK, service Interview.ai');
    } else {
      record('HEALTH', 'Health Endpoint GET /api/health', 'FAIL', `Status code: ${health.status}`);
    }
  } catch (err) {
    record('HEALTH', 'Health Endpoint GET /api/health', 'FAIL', err.message);
  }

  // --- SECTION 2: AUTHENTICATION & CREDENTIALS ---
  const ts = Date.now();
  const candA = {
    email: `cand_a_${ts}@test.com`,
    password: 'Password1',
    fullName: 'Candidate Alpha',
    role: 'candidate',
  };
  const candB = {
    email: `cand_b_${ts}@test.com`,
    password: 'Password2',
    fullName: 'Candidate Beta',
    role: 'candidate',
  };
  const interviewerC = {
    email: `interv_c_${ts}@test.com`,
    password: 'Password3',
    fullName: 'Interviewer Charlie',
    role: 'interviewer',
  };

  let tokenA = null;
  let userA = null;
  let tokenB = null;
  let userB = null;
  let tokenC = null;
  let userC = null;

  try {
    // 1. Password length validation (< 6 chars)
    const shortPwd = await api('/auth/register', 'POST', {
      email: `short_${ts}@test.com`,
      password: '123',
      fullName: 'Short Pwd',
    });
    if (shortPwd.status === 400) {
      record('SECURITY', 'Reject short password (< 6 chars)', 'PASS', 'HTTP 400 Bad Request');
    } else {
      record('SECURITY', 'Reject short password (< 6 chars)', 'FAIL', `Expected 400, got ${shortPwd.status}`);
    }

    // 2. Register Candidate A
    const regA = await api('/auth/register', 'POST', candA);
    if (regA.status === 201 && regA.data?.token) {
      tokenA = regA.data.token;
      userA = regA.data.user;
      record('AUTH', 'Candidate A Registration', 'PASS', `ID: ${userA.id}`);
    } else {
      record('AUTH', 'Candidate A Registration', 'FAIL', JSON.stringify(regA.data));
    }

    // 3. Register Candidate B
    const regB = await api('/auth/register', 'POST', candB);
    if (regB.status === 201 && regB.data?.token) {
      tokenB = regB.data.token;
      userB = regB.data.user;
      record('AUTH', 'Candidate B Registration', 'PASS', `ID: ${userB.id}`);
    } else {
      record('AUTH', 'Candidate B Registration', 'FAIL', JSON.stringify(regB.data));
    }

    // 4. Register Interviewer C
    const regC = await api('/auth/register', 'POST', interviewerC);
    if (regC.status === 201 && regC.data?.token) {
      tokenC = regC.data.token;
      userC = regC.data.user;
      record('AUTH', 'Interviewer C Registration', 'PASS', `Role: ${userC.role}`);
    } else {
      record('AUTH', 'Interviewer C Registration', 'FAIL', JSON.stringify(regC.data));
    }

    // 5. Login verification
    const loginA = await api('/auth/login', 'POST', {
      email: candA.email,
      password: candA.password,
    });
    if (loginA.ok && loginA.data?.token) {
      record('AUTH', 'Candidate A Login verification', 'PASS', 'JWT received');
    } else {
      record('AUTH', 'Candidate A Login verification', 'FAIL', loginA.data?.error);
    }

    // 6. Token Tampering test
    const fakeToken = tokenA.slice(0, -6) + 'abcdef';
    const tamperRes = await api('/auth/me', 'GET', null, fakeToken);
    if (tamperRes.status === 403) {
      record('SECURITY', 'Reject tampered JWT token', 'PASS', 'HTTP 403 Forbidden');
    } else {
      record('SECURITY', 'Reject tampered JWT token', 'FAIL', `Expected 403, got ${tamperRes.status}`);
    }

    // 7. Missing token test
    const noTokenRes = await api('/auth/me', 'GET', null, null);
    if (noTokenRes.status === 401) {
      record('SECURITY', 'Reject unauthenticated request', 'PASS', 'HTTP 401 Unauthorized');
    } else {
      record('SECURITY', 'Reject unauthenticated request', 'FAIL', `Expected 401, got ${noTokenRes.status}`);
    }
  } catch (err) {
    record('AUTH', 'Auth workflow', 'FAIL', err.message);
  }

  // --- SECTION 3: ROLE-BASED ACCESS CONTROL (RBAC) ---
  try {
    // 1. Candidate accessing Admin routes
    const candAdminRes = await api('/admin/users', 'GET', null, tokenA);
    if (candAdminRes.status === 403) {
      record('SECURITY', 'Candidate blocked from Admin routes', 'PASS', 'HTTP 403 Forbidden');
    } else {
      record('SECURITY', 'Candidate blocked from Admin routes', 'FAIL', `Expected 403, got ${candAdminRes.status}`);
    }

    // 2. Interviewer accessing Admin routes
    const intervAdminRes = await api('/admin/users', 'GET', null, tokenC);
    if (intervAdminRes.status === 403) {
      record('SECURITY', 'Interviewer blocked from Admin routes', 'PASS', 'HTTP 403 Forbidden');
    } else {
      record('SECURITY', 'Interviewer blocked from Admin routes', 'FAIL', `Expected 403, got ${intervAdminRes.status}`);
    }

    // 3. Self promotion attack: attempting to set role to admin via register
    const evilReg = await api('/auth/register', 'POST', {
      email: `evil_${ts}@test.com`,
      password: 'Password12',
      fullName: 'Evil Attacker',
      role: 'admin',
    });
    if (evilReg.status === 201 && evilReg.data?.user?.role !== 'admin') {
      record('SECURITY', 'Registration privilege escalation prevented', 'PASS', `Assigned: ${evilReg.data.user.role}`);
    } else {
      record('SECURITY', 'Registration privilege escalation prevented', 'FAIL', `Role was: ${evilReg.data?.user?.role}`);
    }
  } catch (err) {
    record('SECURITY', 'RBAC tests', 'FAIL', err.message);
  }

  // --- SECTION 4: DATA INTEGRITY & CROSS-USER OWNERSHIP CHECKS ---
  let roadmapAId = null;
  try {
    // 1. Candidate A generates roadmap
    const rmRes = await api('/roadmap/generate', 'POST', { jobRole: 'Frontend Developer', targetLevel: 'Senior' }, tokenA);
    if (rmRes.ok && rmRes.data?.roadmap) {
      roadmapAId = rmRes.data.roadmap.id || rmRes.data.roadmap._id;
      record('ROADMAP', 'Generate Career Roadmap for Candidate A', 'PASS', `Roadmap ID: ${roadmapAId}`);
    } else {
      record('ROADMAP', 'Generate Career Roadmap for Candidate A', 'FAIL', rmRes.data?.error);
    }

    if (roadmapAId) {
      // 2. Candidate B tries to read Candidate A's roadmap
      const crossRead = await api(`/roadmap/${roadmapAId}`, 'GET', null, tokenB);
      if (crossRead.status === 403) {
        record('SECURITY', "Candidate B blocked from reading Candidate A's roadmap", 'PASS', 'HTTP 403 Forbidden');
      } else {
        record('SECURITY', "Candidate B blocked from reading Candidate A's roadmap", 'FAIL', `Status: ${crossRead.status}`);
      }

      // 3. Candidate B tries to toggle Candidate A's roadmap task
      const crossToggle = await api(`/roadmap/${roadmapAId}/toggle-task`, 'POST', { taskId: 'Stage 1' }, tokenB);
      if (crossToggle.status === 403) {
        record('SECURITY', "Candidate B blocked from toggling Candidate A's task", 'PASS', 'HTTP 403 Forbidden');
      } else {
        record('SECURITY', "Candidate B blocked from toggling Candidate A's task", 'FAIL', `Status: ${crossToggle.status}`);
      }

      // 4. Candidate A toggles task
      const toggleRes = await api(`/roadmap/${roadmapAId}/toggle-task`, 'POST', { taskId: 'Stage 1' }, tokenA);
      if (toggleRes.ok && toggleRes.data?.completedTasks?.includes('Stage 1')) {
        record('ROADMAP', "Candidate A toggles task 'Stage 1'", 'PASS', 'Task marked completed');
      } else {
        record('ROADMAP', "Candidate A toggles task 'Stage 1'", 'FAIL', JSON.stringify(toggleRes.data));
      }

      // 5. Candidate A fetches their roadmap by ID and verifies completedTasks persistence
      const fetchA = await api(`/roadmap/${roadmapAId}`, 'GET', null, tokenA);
      if (fetchA.ok && fetchA.data?.roadmap?.completedTasks?.includes('Stage 1')) {
        record('ROADMAP', 'Roadmap task progress persisted and retrieved', 'PASS', `Tasks: ${fetchA.data.roadmap.completedTasks.join(', ')}`);
      } else {
        record('ROADMAP', 'Roadmap task progress persisted and retrieved', 'FAIL', JSON.stringify(fetchA.data));
      }
    }
  } catch (err) {
    record('ROADMAP', 'Roadmap lifecycle and security', 'FAIL', err.message);
  }

  // --- SECTION 5: RESUME ATS & OWNERSHIP ---
  let resumeAId = null;
  try {
    const resumeText = `John Doe
Senior Software Engineer with 7 years experience in React, TypeScript, Node.js, and Distributed Systems.
Led migration of monolithic microservices to Kubernetes, improving availability to 99.99%.
Expert in PostgreSQL, Redis, Jest, and CI/CD pipelines.`;

    const resumeRes = await api('/resume/analyze', 'POST', {
      fileName: 'John_Doe_Resume.pdf',
      resumeText,
      targetRole: 'Senior Full Stack Engineer',
    }, tokenA);

    if (resumeRes.ok && resumeRes.data?.resume) {
      resumeAId = resumeRes.data.resume.id || resumeRes.data.resume._id;
      record('RESUME', 'Resume Upload & ATS Analysis for Candidate A', 'PASS', `Score: ${resumeRes.data.analysis?.score || 'N/A'}`);
    } else {
      record('RESUME', 'Resume Upload & ATS Analysis for Candidate A', 'FAIL', resumeRes.data?.error);
    }

    // Candidate A fetches my-resumes
    const listA = await api('/resume/my-resumes', 'GET', null, tokenA);
    const hasA = listA.data?.resumes?.some(r => (r.id || r._id) === resumeAId);

    // Candidate B fetches my-resumes (should NOT contain Candidate A's resume)
    const listB = await api('/resume/my-resumes', 'GET', null, tokenB);
    const hasInB = listB.data?.resumes?.some(r => (r.id || r._id) === resumeAId);

    if (hasA && !hasInB) {
      record('SECURITY', 'Candidate B cannot see Candidate A resumes', 'PASS', 'Strict candidate isolation in my-resumes');
    } else {
      record('SECURITY', 'Candidate B cannot see Candidate A resumes', 'FAIL', `hasA: ${hasA}, hasInB: ${hasInB}`);
    }
  } catch (err) {
    record('RESUME', 'Resume ATS testing', 'FAIL', err.message);
  }

  // --- SECTION 6: SCHEDULED INTERVIEWS & JITSI ROOM SECURITY ---
  let scheduledId = null;
  try {
    const schedRes = await api('/scheduled-interviews', 'POST', {
      candidateId: userA.id,
      interviewerId: userC.id,
      candidateEmail: userA.email,
      jobRole: 'Cloud Architect',
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 45,
      type: 'technical',
    }, tokenC);

    if (schedRes.ok && schedRes.data?.interview) {
      scheduledId = schedRes.data.interview.roomId;
      record('SCHEDULED', 'Schedule Interview (Interviewer C -> Candidate A)', 'PASS', `RoomId: ${scheduledId}`);
    } else {
      record('SCHEDULED', 'Schedule Interview (Interviewer C -> Candidate A)', 'FAIL', schedRes.data?.error);
    }

    if (scheduledId) {
      // 1. Candidate A joins -> Authorized
      const joinA = await api(`/scheduled-interviews/${scheduledId}/join`, 'POST', {}, tokenA);
      const meetingUrl = joinA.data?.interview?.meetingUrl || joinA.data?.meetingUrl;
      if (joinA.ok && joinA.data?.canJoin && meetingUrl?.includes('meet.jit.si')) {
        record('SCHEDULED', 'Authorized Participant (Candidate A) Join', 'PASS', `Jitsi URL: ${meetingUrl}`);
      } else {
        record('SCHEDULED', 'Authorized Participant (Candidate A) Join', 'FAIL', JSON.stringify(joinA.data));
      }

      // 2. Interviewer C joins -> Authorized
      const joinC = await api(`/scheduled-interviews/${scheduledId}/join`, 'POST', {}, tokenC);
      if (joinC.ok) {
        record('SCHEDULED', 'Authorized Interviewer (Interviewer C) Join', 'PASS', 'Access granted');
      } else {
        record('SCHEDULED', 'Authorized Interviewer (Interviewer C) Join', 'FAIL', JSON.stringify(joinC.data));
      }

      // 3. Candidate B (unrelated) joins -> Blocked!
      const joinB = await api(`/scheduled-interviews/${scheduledId}/join`, 'POST', {}, tokenB);
      if (joinB.status === 403) {
        record('SECURITY', 'Unauthorized user (Candidate B) blocked from interview room', 'PASS', 'HTTP 403 Forbidden');
      } else {
        record('SECURITY', 'Unauthorized user (Candidate B) blocked from interview room', 'FAIL', `Status: ${joinB.status}`);
      }
    }
  } catch (err) {
    record('SCHEDULED', 'Scheduled interview workflow', 'FAIL', err.message);
  }

  // --- SECTION 7: MOCK INTERVIEW & REPORT ACCESS CONTROL ---
  let reportAId = null;
  try {
    const completeRes = await api('/interviews/complete-session', 'POST', {
      jobRole: 'Backend Engineer',
      difficulty: 'Senior',
      mode: 'classic',
      interviewerPersona: 'Tech Lead',
      qaList: [
        {
          question: 'How do you handle database concurrency and race conditions?',
          answer: 'I use database transactions with optimistic locking via version columns, or row-level locking with SELECT FOR UPDATE when strict consistency is required.',
          score: 90,
          feedback: 'Solid response covering concurrency controls.'
        }
      ],
      eyeContactAverage: 88,
    }, tokenA);

    if (completeRes.ok && completeRes.data?.reportId) {
      reportAId = completeRes.data.reportId;
      record('INTERVIEW', 'Complete Mock Interview Session', 'PASS', `Report ID: ${reportAId}`);
    } else {
      record('INTERVIEW', 'Complete Mock Interview Session', 'FAIL', JSON.stringify(completeRes.data));
    }

    if (reportAId) {
      // Candidate A reads their report
      const readA = await api(`/interviews/${reportAId}/report`, 'GET', null, tokenA);
      if (readA.ok && readA.data?.report) {
        record('INTERVIEW', "Candidate A reads their own report", 'PASS', `Score: ${readA.data.report.overallScore || 'N/A'}`);
      } else {
        record('INTERVIEW', "Candidate A reads their own report", 'FAIL', JSON.stringify(readA.data));
      }

      // Candidate B attempts to read Candidate A's report -> Blocked!
      const readB = await api(`/interviews/${reportAId}/report`, 'GET', null, tokenB);
      if (readB.status === 403) {
        record('SECURITY', "Candidate B blocked from reading Candidate A's report", 'PASS', 'HTTP 403 Forbidden');
      } else {
        record('SECURITY', "Candidate B blocked from reading Candidate A's report", 'FAIL', `Status: ${readB.status}`);
      }
    }
  } catch (err) {
    record('INTERVIEW', 'Mock interview workflow', 'FAIL', err.message);
  }

  console.log('\n====================================================');
  console.log('                 SUMMARY OF RESULTS                 ');
  console.log('====================================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passes} | Failed: ${fails}`);

  if (fails > 0) {
    console.error('\nFAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(f => console.error(` - [${f.category}] ${f.testName}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('\nALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! 🎉');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
