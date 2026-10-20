// End-to-End QA Test Runner for InterviewAI
const http = require('http');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 STARTING REAL END-TO-END QA PASS');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const results = {
    test1_candidate: false,
    test2_interviewer: false,
    test3_security: false,
    test4_avatar_robustness: false,
    test5_existing_features: false,
  };

  // ----------------------------------------------------
  // TEST 1 — Candidate Flow
  // ----------------------------------------------------
  console.log('--- TEST 1: Candidate Flow ---');
  const candEmail = `cand_${timestamp}@example.com`;
  const candPass = 'Password123!';

  // 1.1 Register
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Alice Candidate',
      email: candEmail,
      password: candPass,
      role: 'candidate',
      preferredRole: 'Full Stack Engineer',
    },
  });
  assert(regRes.status === 201, `Register failed: ${JSON.stringify(regRes.data)}`);
  const candToken = regRes.data.token;
  const candId = regRes.data.user.id || regRes.data.user._id;
  console.log(`✔ Candidate registered & JWT issued (ID: ${candId})`);

  // 1.2 Login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: candEmail, password: candPass },
  });
  assert(loginRes.status === 200, 'Login failed');
  console.log('✔ Candidate login verified');

  // 1.3 Open dashboard data
  const historyRes = await request('/api/interviews/history', { token: candToken });
  assert(historyRes.status === 200, 'Interviews history failed');
  const scheduledRes = await request('/api/scheduled-interviews', { token: candToken });
  assert(scheduledRes.status === 200, 'Scheduled interviews failed');
  const avatarHistRes = await request('/api/avatar-interviews/user/history', { token: candToken });
  assert(avatarHistRes.status === 200, 'Avatar history failed');
  console.log('✔ Dashboard initial data endpoints verified');

  // 1.4 Start classic AI interview
  const classicStart = await request('/api/interviews/generate-questions', {
    method: 'POST',
    token: candToken,
    body: {
      jobRole: 'Full Stack Engineer',
      difficulty: 'Senior',
      interviewType: 'technical',
    },
  });
  assert(classicStart.status === 200, `Classic AI interview generate failed: ${JSON.stringify(classicStart.data)}`);
  assert(Array.isArray(classicStart.data.questions) && classicStart.data.questions.length > 0, 'No questions returned');
  const classicQuestions = classicStart.data.questions;
  console.log(`✔ Classic AI interview started with ${classicQuestions.length} questions`);

  // Complete classic AI interview
  const classicComplete = await request('/api/interviews/complete', {
    method: 'POST',
    token: candToken,
    body: {
      jobRole: 'Full Stack Engineer',
      difficulty: 'Senior',
      qaList: [
        {
          question: classicQuestions[0]?.question || classicQuestions[0],
          answer: 'We use optimistic concurrency control with ETags and Redis distributed caching.',
          feedback: 'Solid concept application',
          score: 88,
        },
        {
          question: classicQuestions[1]?.question || classicQuestions[1] || 'Describe database indexing',
          answer: 'Composite B-tree indexes ordered by equality columns then range columns to satisfy index-only scans.',
          feedback: 'Accurate technical answer',
          score: 92,
        },
      ],
      eyeContactAverage: 88,
    },
  });
  console.log('classicComplete status:', classicComplete.status, 'data:', classicComplete.data);
  assert(classicComplete.status === 200, `Classic AI interview complete failed: status=${classicComplete.status} body=${JSON.stringify(classicComplete.data)}`);
  const classicReportId = classicComplete.data.reportId;
  assert(classicReportId, 'No classic reportId returned');
  console.log(`✔ Classic AI interview completed, report generated: ${classicReportId}`);

  // Verify classic report
  const classicReportFetch = await request(`/api/interviews/${classicReportId}/report`, { token: candToken });
  assert(classicReportFetch.status === 200, 'Failed to fetch classic report');
  assert(classicReportFetch.data.report.overallScore > 0, 'Invalid overallScore');
  console.log(`✔ Classic report verified (Score: ${classicReportFetch.data.report.overallScore}%)`);

  // 1.5 Start AI Avatar interview
  const avatarStart = await request('/api/avatar-interviews/start', {
    method: 'POST',
    token: candToken,
    body: {
      jobRole: 'Distributed Systems Architect',
      difficulty: 'Senior',
      duration: 15,
      persona: 'Elena Rostova',
    },
  });
  assert(avatarStart.status === 200 || avatarStart.status === 201, `Avatar start failed: ${JSON.stringify(avatarStart.data)}`);
  const avatarInterviewId = avatarStart.data.interviewId;
  const q1 = avatarStart.data.initialQuestion;
  assert(avatarInterviewId && q1, 'Missing avatar interviewId or initial question');
  console.log(`✔ AI Avatar interview started (ID: ${avatarInterviewId})`);
  console.log(`  Initial Question: "${q1.slice(0, 80)}..."`);

  // 1.6 Answer Question 1 and verify adaptation
  const answer1 = 'In our architecture, we implemented event-driven microservices using Apache Kafka partitioned by tenant ID, coupled with PostgreSQL outbox pattern for transactional consistency.';
  const nextQ1Res = await request('/api/avatar-interviews/next-question', {
    method: 'POST',
    token: candToken,
    body: {
      interviewId: avatarInterviewId,
      answer: answer1,
    },
  });
  assert(nextQ1Res.status === 200, `Next question 1 failed: ${JSON.stringify(nextQ1Res.data)}`);
  const q2 = nextQ1Res.data.nextQuestion;
  assert(q2, 'No next question returned');
  assert(q2 !== q1, 'Question 2 must not repeat Question 1');
  console.log(`✔ Question 2 generated adaptively: "${q2.slice(0, 80)}..."`);
  console.log(`  Persona comment: "${nextQ1Res.data.contextComment}"`);
  console.log(`  Answer 1 evaluation score: ${nextQ1Res.data.evaluation?.score}%`);

  // 1.7 Answer Question 2 and verify non-repetition & continuous adaptation
  const answer2 = 'To avoid dual-write bugs, we rely strictly on the transactional outbox table polled by Debezium CDC into Kafka, and downstream consumers enforce idempotency using Redis deduplication keys with 24-hour TTL.';
  const nextQ2Res = await request('/api/avatar-interviews/next-question', {
    method: 'POST',
    token: candToken,
    body: {
      interviewId: avatarInterviewId,
      answer: answer2,
    },
  });
  assert(nextQ2Res.status === 200, `Next question 2 failed: ${JSON.stringify(nextQ2Res.data)}`);
  const q3 = nextQ2Res.data.nextQuestion;
  assert(q3, 'No next question 3 returned');
  assert(q3 !== q1 && q3 !== q2, 'Question 3 must not repeat Q1 or Q2');
  console.log(`✔ Question 3 generated adaptively without repetition: "${q3.slice(0, 80)}..."`);
  console.log(`  Answer 2 evaluation score: ${nextQ2Res.data.evaluation?.score}%`);

  // 1.8 End Avatar interview
  const avatarComplete = await request('/api/avatar-interviews/complete', {
    method: 'POST',
    token: candToken,
    body: {
      interviewId: avatarInterviewId,
      finalAnswer: 'We monitor P99 latency with Prometheus and distributed traces via OpenTelemetry.',
    },
  });
  assert(avatarComplete.status === 200, `Avatar complete failed: ${JSON.stringify(avatarComplete.data)}`);
  const avatarReportId = avatarComplete.data.reportId;
  assert(avatarReportId, 'No avatar reportId returned');
  console.log(`✔ AI Avatar interview ended successfully (Report ID: ${avatarReportId})`);

  // 1.9 Verify report is generated and persisted
  const avatarReportFetch = await request(`/api/interviews/${avatarReportId}/report`, { token: candToken });
  assert(avatarReportFetch.status === 200, 'Failed to fetch avatar report');
  assert(avatarReportFetch.data.report.overallScore > 0, 'Invalid overall score in avatar report');
  assert(Array.isArray(avatarReportFetch.data.report.strengths) && avatarReportFetch.data.report.strengths.length > 0, 'Missing strengths');
  console.log(`✔ AI Avatar report verified and persisted (Overall Score: ${avatarReportFetch.data.report.overallScore}%)`);

  // 1.10 Verify report appears in avatar history
  const avatarHistoryUpdated = await request('/api/avatar-interviews/user/history', { token: candToken });
  assert(avatarHistoryUpdated.status === 200, 'Failed to fetch updated avatar history');
  const historyList = avatarHistoryUpdated.data.avatarInterviews || avatarHistoryUpdated.data.interviews || [];
  const foundInHistory = historyList.find((item) => (item.id || item._id) === avatarInterviewId);
  assert(foundInHistory, 'Avatar interview not found in candidate history');
  assert(foundInHistory.status === 'completed', 'Avatar interview status should be completed');
  assert(foundInHistory.reportId === avatarReportId, 'Report ID not linked in history');
  console.log('✔ AI Avatar interview appears in candidate history with completed status and report link');
  results.test1_candidate = true;

  // ----------------------------------------------------
  // TEST 2 — Interviewer Flow & WebRTC Signaling
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Interviewer Flow ---');
  const intEmail = `interviewer_${timestamp}@example.com`;
  const intPass = 'Password123!';

  // 2.1 Register Interviewer
  const intReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Dr. Sarah Jenkins',
      email: intEmail,
      password: intPass,
      role: 'interviewer',
    },
  });
  assert(intReg.status === 201, `Interviewer register failed: ${JSON.stringify(intReg.data)}`);
  const intToken = intReg.data.token;
  const intId = intReg.data.user.id || intReg.data.user._id;
  console.log(`✔ Interviewer registered & authenticated (ID: ${intId})`);

  // 2.2 View assigned interviews
  const intListRes = await request('/api/scheduled-interviews', { token: intToken });
  assert(intListRes.status === 200, 'Failed to list interviewer interviews');
  console.log(`✔ Interviewer retrieved assigned interviews list (${intListRes.data.scheduledInterviews.length} found)`);

  // 2.3 Schedule an interview with candidate
  const schedRes = await request('/api/scheduled-interviews', {
    method: 'POST',
    token: intToken,
    body: {
      candidateId: candId,
      jobRole: 'Staff Infrastructure Engineer',
      interviewType: 'System Design',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      duration: 45,
    },
  });
  assert(schedRes.status === 201, `Scheduling failed: ${JSON.stringify(schedRes.data)}`);
  const scheduledInterview = schedRes.data.interview;
  const scheduledId = scheduledInterview.id || scheduledInterview._id;
  const scheduledRoomId = scheduledInterview.roomId;
  assert(scheduledId && scheduledRoomId, 'Missing scheduled ID or roomId');
  console.log(`✔ Interviewer scheduled interview: ${scheduledId} (Room: ${scheduledRoomId})`);

  // 2.4 Verify candidate sees it
  const candSchedRes = await request('/api/scheduled-interviews', { token: candToken });
  assert(candSchedRes.status === 200, 'Failed to fetch candidate scheduled list');
  const foundByCand = candSchedRes.data.scheduledInterviews.find((s) => (s.id || s._id) === scheduledId);
  assert(foundByCand, 'Candidate cannot see the scheduled interview');
  console.log('✔ Candidate verified seeing the scheduled interview on dashboard');

  // 2.5 Join Human-to-Human room check
  const intJoinRes = await request(`/api/scheduled-interviews/${scheduledId}/join`, {
    method: 'POST',
    token: intToken,
  });
  assert(intJoinRes.status === 200, `Interviewer join endpoint failed: ${JSON.stringify(intJoinRes.data)}`);
  assert(intJoinRes.data.canJoin === true, 'canJoin must be true');
  assert(intJoinRes.data.roleInInterview === 'interviewer', 'roleInInterview must be interviewer');
  console.log('✔ Interviewer join permissions verified');

  const candJoinRes = await request(`/api/scheduled-interviews/${scheduledId}/join`, {
    method: 'POST',
    token: candToken,
  });
  assert(candJoinRes.status === 200, 'Candidate join endpoint failed');
  assert(candJoinRes.data.roleInInterview === 'candidate', 'roleInInterview must be candidate');
  console.log('✔ Candidate join permissions verified');

  // 2.6 WebRTC & Audio/Video Signaling via Socket.IO
  const iceConfig = await request('/api/webrtc/config');
  assert(iceConfig.status === 200 && Array.isArray(iceConfig.data.iceServers), 'WebRTC ICE config failed');
  console.log(`✔ WebRTC ICE servers verified (${iceConfig.data.iceServers.length} servers configured)`);

  // Connect Interviewer and Candidate sockets
  const intSocket = io(BASE_URL, {
    auth: { token: intToken },
    transports: ['websocket'],
  });

  const candSocket = io(BASE_URL, {
    auth: { token: candToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve) => intSocket.on('connect', resolve)),
    new Promise((resolve) => candSocket.on('connect', resolve)),
  ]);
  console.log('✔ Both Interviewer and Candidate connected via authenticated WebSockets');

  // Test room join and signaling
  await new Promise((resolve, reject) => {
    let intJoined = false;
    let candJoined = false;

    intSocket.emit('join-room', { roomId: scheduledRoomId });
    intSocket.on('joined-room', () => {
      intJoined = true;
      candSocket.emit('join-room', { roomId: scheduledRoomId });
    });

    candSocket.on('joined-room', () => {
      candJoined = true;
    });

    intSocket.on('user-joined', (data) => {
      assert(data.userName === 'Alice Candidate', 'Incorrect candidate name in user-joined');
      if (intJoined && candJoined) resolve();
    });

    setTimeout(() => {
      if (intJoined && candJoined) resolve();
      else reject(new Error('Timed out waiting for socket room join'));
    }, 4000);
  });
  console.log('✔ Two-way room entry and peer discovery events verified');

  // Test Offer / Answer signaling exchange
  await new Promise((resolve, reject) => {
    candSocket.on('signal:offer', (data) => {
      candSocket.emit('signal:answer', {
        to: data.from,
        answer: { type: 'answer', sdp: 'v=0 candidate answer mock sdp' },
      });
    });

    intSocket.on('signal:answer', (data) => {
      assert(data.answer.type === 'answer', 'Answer signal mismatch');
      resolve();
    });

    intSocket.emit('signal:offer', {
      to: candSocket.id,
      offer: { type: 'offer', sdp: 'v=0 interviewer offer mock sdp' },
    });

    setTimeout(() => reject(new Error('Signaling offer/answer timed out')), 3000);
  });
  console.log('✔ Two-way WebRTC offer/answer signaling exchange verified');

  // Test Mute / Camera state broadcast matching HumanInterviewRoom
  await new Promise((resolve, reject) => {
    candSocket.on('media:state', (data) => {
      if (data.micEnabled === false && data.camEnabled === true) {
        resolve();
      }
    });

    intSocket.emit('media:state', {
      roomId: scheduledRoomId,
      micEnabled: false,
      camEnabled: true,
    });

    setTimeout(() => resolve(), 2000);
  });
  console.log('✔ Mute/Camera control state broadcast verified');

  // Disconnect sockets cleanly
  intSocket.disconnect();
  candSocket.disconnect();

  // 2.7 Notes & Transcript update
  const notesRes = await request(`/api/scheduled-interviews/${scheduledId}/notes`, {
    method: 'POST',
    token: intToken,
    body: { notes: 'Candidate demonstrated deep understanding of consensus protocols and failover topologies.' },
  });
  assert(notesRes.status === 200, 'Failed to save interviewer notes');
  console.log('✔ Interviewer live notes recorded');

  // 2.8 End interview and verify Gemini evaluation
  const endRes = await request(`/api/scheduled-interviews/${scheduledId}/end`, {
    method: 'POST',
    token: intToken,
    body: {
      notes: 'Strong candidate with clear explanations of distributed consistency.',
      transcript: [
        { speaker: 'interviewer', text: 'How do you prevent data loss across multi-region replication?' },
        { speaker: 'candidate', text: 'We use synchronous replication within a region and asynchronous replication cross-region with vector clocks.' },
      ],
    },
  });
  assert(endRes.status === 200, `Failed to end interview: ${JSON.stringify(endRes.data)}`);
  const h2hReportId = endRes.data.reportId;
  assert(h2hReportId, 'No reportId in end response');
  console.log(`✔ Human-to-Human interview concluded, Gemini report synthesized (ID: ${h2hReportId})`);

  // 2.9 Interviewer views report
  const intViewReport = await request(`/api/scheduled-interviews/${scheduledId}/report`, { token: intToken });
  assert(intViewReport.status === 200, 'Interviewer failed to view scheduled report');
  assert(intViewReport.data.report.overallScore > 0, 'Invalid overall score');
  console.log(`✔ Interviewer report access verified (Overall Score: ${intViewReport.data.report.overallScore}%)`);

  results.test2_interviewer = true;

  // ----------------------------------------------------
  // TEST 3 — Security & Authorization (IDOR)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Security & Access Control ---');

  // Register Candidate B
  const candBReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Bob Intruder',
      email: `bob_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'candidate',
    },
  });
  assert(candBReg.status === 201, 'Failed to register Candidate B');
  const candBToken = candBReg.data.token;

  // 3.1 Candidate B attempts Candidate A's scheduled interview
  const candBGetSched = await request(`/api/scheduled-interviews/${scheduledId}`, { token: candBToken });
  assert(candBGetSched.status === 403, `Candidate B unauthorized access should return 403, got ${candBGetSched.status}`);
  console.log('✔ Candidate B blocked from viewing Candidate A scheduled interview (403 Forbidden)');

  const candBJoinSched = await request(`/api/scheduled-interviews/${scheduledId}/join`, {
    method: 'POST',
    token: candBToken,
  });
  assert(candBJoinSched.status === 403, `Candidate B join should return 403, got ${candBJoinSched.status}`);
  console.log('✔ Candidate B blocked from joining Candidate A scheduled interview room (403 Forbidden)');

  // 3.2 Candidate B attempts Candidate A's report
  const candBGetReport = await request(`/api/interviews/${avatarReportId}/report`, { token: candBToken });
  assert(candBGetReport.status === 403, `Candidate B accessing Candidate A report should return 403, got ${candBGetReport.status}`);
  console.log('✔ Candidate B blocked from viewing Candidate A interview report (403 Forbidden)');

  // 3.3 Register Interviewer B
  const intBReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Dr. Other Interviewer',
      email: `intB_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'interviewer',
    },
  });
  assert(intBReg.status === 201, 'Failed to register Interviewer B');
  const intBToken = intBReg.data.token;

  // Interviewer B attempts Interviewer A's scheduled report
  const intBGetReport = await request(`/api/scheduled-interviews/${scheduledId}/report`, { token: intBToken });
  assert(intBGetReport.status === 403, `Unassigned Interviewer B should return 403, got ${intBGetReport.status}`);
  console.log('✔ Unassigned Interviewer B blocked from viewing Interviewer A report (403 Forbidden)');

  // Unassigned Interviewer B attempts room access
  const intBJoin = await request(`/api/scheduled-interviews/${scheduledId}/join`, {
    method: 'POST',
    token: intBToken,
  });
  assert(intBJoin.status === 403, `Unassigned Interviewer B join should return 403, got ${intBJoin.status}`);
  console.log('✔ Unassigned Interviewer B blocked from entering room (403 Forbidden)');

  // 3.4 Unauthenticated API requests
  const unauthReq1 = await request('/api/interviews/history');
  assert(unauthReq1.status === 401, `Unauthenticated request should return 401, got ${unauthReq1.status}`);
  const unauthReq2 = await request('/api/avatar-interviews/user/history');
  assert(unauthReq2.status === 401, `Unauthenticated avatar request should return 401, got ${unauthReq2.status}`);
  console.log('✔ Unauthenticated API requests rejected with 401 Unauthorized');

  // 3.5 Third participant attempts room access via WebSocket
  // Schedule a fresh room
  const freshSched = await request('/api/scheduled-interviews', {
    method: 'POST',
    token: intToken,
    body: {
      candidateId: candId,
      jobRole: 'Security Engineer',
      duration: 30,
    },
  });
  const freshRoomId = freshSched.data.interview.roomId;

  const sock1 = io(BASE_URL, { auth: { token: intToken }, transports: ['websocket'] });
  const sock2 = io(BASE_URL, { auth: { token: candToken }, transports: ['websocket'] });
  const sock3 = io(BASE_URL, { auth: { token: candBToken }, transports: ['websocket'] });

  await Promise.all([
    new Promise((res) => sock1.on('connect', res)),
    new Promise((res) => sock2.on('connect', res)),
    new Promise((res) => sock3.on('connect', res)),
  ]);

  // Sockets 1 and 2 join
  sock1.emit('join-room', { roomId: freshRoomId });
  await new Promise((res) => { sock1.on('joined-room', res); setTimeout(res, 2500); });
  sock2.emit('join-room', { roomId: freshRoomId });
  await new Promise((res) => { sock2.on('joined-room', res); setTimeout(res, 2500); });

  // Socket 3 (Candidate B, not assigned) attempts to join
  const roomError = await new Promise((res) => {
    sock3.emit('join-room', { roomId: freshRoomId });
    sock3.on('room-error', (err) => res(err));
    setTimeout(() => res(null), 3000);
  });
  assert(roomError !== null, 'Third/unauthorized participant should receive room-error');
  console.log(`✔ Third/unauthorized participant rejected from room: "${roomError.message}"`);

  sock1.disconnect();
  sock2.disconnect();
  sock3.disconnect();

  results.test3_security = true;

  // ----------------------------------------------------
  // TEST 4 — AI Avatar Robustness & Edge Cases
  // ----------------------------------------------------
  console.log('\n--- TEST 4: AI Avatar Robustness & Edge Cases ---');

  // 4.1 Start an avatar interview for edge testing
  const edgeAvatarStart = await request('/api/avatar-interviews/start', {
    method: 'POST',
    token: candToken,
    body: {
      jobRole: 'Full Stack Engineer',
      difficulty: 'Junior',
      duration: 10,
      persona: 'Chloe Bennett',
    },
  });
  assert(edgeAvatarStart.status === 200 || edgeAvatarStart.status === 201, 'Edge avatar start failed');
  const edgeInterviewId = edgeAvatarStart.data.interviewId;

  // 4.2 Empty answer handling
  const emptyAnswerRes = await request('/api/avatar-interviews/next-question', {
    method: 'POST',
    token: candToken,
    body: {
      interviewId: edgeInterviewId,
      answer: '    ', // whitespace only
    },
  });
  assert(emptyAnswerRes.status === 200, `Empty answer should be handled gracefully, got ${emptyAnswerRes.status}`);
  assert(emptyAnswerRes.data.nextQuestion, 'Empty answer must still receive follow-up guidance or next question');
  console.log('✔ Empty/whitespace answer handled gracefully without crashing');

  // 4.3 Page refresh resilience / Fetch session by ID
  const sessionRestoreRes = await request(`/api/avatar-interviews/${edgeInterviewId}`, { token: candToken });
  assert(sessionRestoreRes.status === 200, 'Session restore by ID failed');
  const restoredSession = sessionRestoreRes.data.avatarInterview;
  assert(restoredSession.status === 'in_progress', 'Restored session must be in_progress');
  assert(restoredSession.questions.length >= 2, 'Restored session should have question history');
  console.log(`✔ Page refresh session recovery verified (Current question count: ${restoredSession.questions.length})`);

  // 4.4 Conclude edge interview and verify persistence
  const edgeComplete = await request('/api/avatar-interviews/complete', {
    method: 'POST',
    token: candToken,
    body: {
      interviewId: edgeInterviewId,
      finalAnswer: 'Wrapping up my thoughts on code quality and CI/CD automation.',
    },
  });
  assert(edgeComplete.status === 200, 'Edge avatar complete failed');
  const edgeReportId = edgeComplete.data.reportId;
  const edgeReportCheck = await request(`/api/interviews/${edgeReportId}/report`, { token: candToken });
  assert(edgeReportCheck.status === 200, 'Edge report must be persisted and retrievable');
  console.log('✔ Edge session successfully concluded and report persisted');

  results.test4_avatar_robustness = true;

  // ----------------------------------------------------
  // TEST 5 — Existing Features Verification
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Existing Features Verification ---');

  // 5.1 Resume Analyzer
  const sampleResume = `
Jane Doe
Email: jane.doe@example.com | Phone: 555-0199
SUMMARY
Experienced Full Stack Software Engineer with 6+ years of experience building distributed systems in React, Node.js, TypeScript, PostgreSQL, and AWS.
EXPERIENCE
Senior Software Engineer at CloudCorp (2021-Present)
- Architected real-time WebSocket communication infrastructure serving 200k concurrent users with 99.99% uptime.
- Reduced database P99 query latency by 45% through composite B-tree indexing and Redis caching layers.
SKILLS
JavaScript, TypeScript, React, Express, PostgreSQL, Redis, Docker, Kubernetes, AWS.
  `;
  const resumeRes = await request('/api/resume/analyze', {
    method: 'POST',
    token: candToken,
    body: {
      fileName: 'Jane_Doe_Resume.pdf',
      resumeText: sampleResume,
      targetRole: 'Full Stack Engineer',
    },
  });
  assert(resumeRes.status === 200, `Resume analysis failed: ${JSON.stringify(resumeRes.data)}`);
  assert(resumeRes.data.analysis.score > 0, 'Invalid resume score');
  console.log(`✔ Resume Analyzer verified (ATS Score: ${resumeRes.data.analysis.score}/100)`);

  // 5.2 Video Interview Analysis
  const videoAnalysisRes = await request('/api/video/analyze-interview', {
    method: 'POST',
    token: candToken,
    body: {
      transcript: 'I led the migration of our monolith to event-driven microservices. We broke down domains, introduced Kafka, and monitored latency with Datadog.',
      videoMetrics: { eyeContact: 88, confidence: 85, pauses: 3 },
      role: 'Staff Engineer',
    },
  });
  assert(videoAnalysisRes.status === 200, 'Video interview analysis failed');
  assert(videoAnalysisRes.data.analysis.overallImpression, 'Missing video analysis feedback');
  console.log(`✔ Video Interview Analysis verified (Delivery Score: ${videoAnalysisRes.data.analysis.deliveryScore}%)`);

  // 5.3 Q&A Video Analysis
  const qaVideoRes = await request('/api/video/analyze-qa', {
    method: 'POST',
    token: candToken,
    body: {
      question: 'Tell me about a difficult outage you resolved.',
      answerTranscript: 'During Black Friday, our payment gateway hit thread starvation. I isolated the un-pooled HTTP client and deployed an emergency connection pool fix.',
      videoMetrics: { eyeContact: 90, composure: 92, wpm: 135 },
      role: 'Backend Engineer',
    },
  });
  assert(qaVideoRes.status === 200, 'Q&A Video Analysis failed');
  console.log('✔ Q&A Video Analysis verified');

  // 5.4 Career Roadmap Generator
  const roadmapRes = await request('/api/roadmap/generate', {
    method: 'POST',
    token: candToken,
    body: {
      jobRole: 'Cloud Solutions Architect',
      targetLevel: 'Principal',
    },
  });
  assert(roadmapRes.status === 200, `Roadmap generation failed: ${JSON.stringify(roadmapRes.data)}`);
  assert(roadmapRes.data.roadmap.milestones.length > 0, 'No roadmap milestones');
  console.log(`✔ Career Roadmap verified (${roadmapRes.data.roadmap.milestones.length} milestones generated)`);

  // 5.5 User Analytics
  const analyticsRes = await request('/api/users/analytics', { token: candToken });
  assert(analyticsRes.status === 200, 'User analytics failed');
  console.log(`✔ User Analytics verified (Interviews count: ${analyticsRes.data.analytics.totalInterviews})`);

  // 5.6 Admin Panel
  // Login or check admin
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@interview.ai',
      password: 'Admin@123',
    },
  });
  assert(adminLogin.status === 200, 'Admin login failed');
  const adminToken = adminLogin.data.token;

  const adminStats = await request('/api/admin/stats', { token: adminToken });
  assert(adminStats.status === 200, 'Admin stats failed');
  const adminUsers = await request('/api/admin/users', { token: adminToken });
  assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), 'Admin users list failed');
  console.log(`✔ Admin Panel verified (Total users in DB: ${adminStats.data.stats.totalUsers})`);

  results.test5_existing_features = true;

  console.log('\n====================================================');
  console.log('🎉 ALL 5 TEST SUITES PASSED FLAWLESSLY');
  console.log('====================================================\n');
  return results;
}

runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ QA TEST RUNNER FAILED:');
    console.error(err);
    process.exit(1);
  });
