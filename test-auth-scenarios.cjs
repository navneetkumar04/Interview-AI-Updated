// Test runner for Auth Security and Production Authentication without Demo Logins
const http = require('http');
const fs = require('fs');
const path = require('path');

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
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('🔒 VERIFYING PRODUCTION AUTHENTICATION & ZERO-DEMO UI');
  console.log('====================================================\n');

  const ts = Date.now();

  // 1. Unauthenticated root serves HTML (not leaking private data)
  console.log('Check 1: Unauthenticated access to / and protected API endpoints');
  const rootRes = await request('/');
  assert(rootRes.status === 200, 'Root must return 200');
  assert(typeof rootRes.data === 'string' && rootRes.data.includes('<div id="root">'), 'Root serves clean HTML template');

  const unauthHistory = await request('/api/interviews/history');
  assert(unauthHistory.status === 401, `Expected 401 on /api/interviews/history, got ${unauthHistory.status}`);

  const unauthAdmin = await request('/api/admin/stats');
  assert(unauthAdmin.status === 401, `Expected 401 on /api/admin/stats, got ${unauthAdmin.status}`);
  console.log('✔ Private APIs correctly reject unauthenticated requests with 401');

  // 2. Verify Demo Login endpoint is eliminated (returns 404)
  console.log('\nCheck 2: Verify demo-login endpoint does not exist');
  const demoEndpointRes = await request('/api/auth/demo-login', {
    method: 'POST',
    body: { role: 'candidate' },
  });
  assert(demoEndpointRes.status === 404, `Expected 404 for /api/auth/demo-login, got ${demoEndpointRes.status}`);
  console.log('✔ /api/auth/demo-login endpoint is completely removed (404 Not Found)');

  // 3. Normal Candidate Login with Email & Password
  console.log('\nCheck 3: Candidate Login via Email & Password');
  const candLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'candidate@interview.ai', password: 'Admin@123' },
  });
  assert(candLogin.status === 200, `Candidate login failed: ${JSON.stringify(candLogin.data)}`);
  assert(candLogin.data.user.role === 'candidate', 'User role must be candidate');
  assert(typeof candLogin.data.token === 'string', 'Candidate login must return JWT token');
  console.log(`✔ Candidate authenticated with email+password, role: ${candLogin.data.user.role}`);

  // 4. Normal Interviewer Login with Email & Password
  console.log('\nCheck 4: Interviewer Login via Email & Password');
  const intLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'interviewer@interview.ai', password: 'Admin@123' },
  });
  assert(intLogin.status === 200, `Interviewer login failed: ${JSON.stringify(intLogin.data)}`);
  assert(intLogin.data.user.role === 'interviewer', 'User role must be interviewer');
  assert(typeof intLogin.data.token === 'string', 'Interviewer login must return JWT token');
  console.log(`✔ Interviewer authenticated with email+password, role: ${intLogin.data.user.role}`);

  // 5. Normal Admin Login with Email & Password
  console.log('\nCheck 5: Admin Login via Email & Password');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@interview.ai', password: 'Admin@123' },
  });
  assert(adminLogin.status === 200, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  assert(adminLogin.data.user.role === 'admin', 'User role must be admin');
  assert(typeof adminLogin.data.token === 'string', 'Admin login must return JWT token');
  console.log(`✔ Admin authenticated with email+password, role: ${adminLogin.data.user.role}`);

  // 6. User enters wrong password
  console.log('\nCheck 6: User enters wrong password');
  const wrongPass = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@interview.ai', password: 'Wrong@1' },
  });
  assert(wrongPass.status === 401, `Expected 401 on wrong password, got ${wrongPass.status}`);
  assert(!wrongPass.data.token, 'Must not return token on failed login');
  console.log('✔ Wrong password rejected with 401 and descriptive message');

  // 7. New User Registration and Login
  console.log('\nCheck 7: User creates account and logs in');
  const newEmail = `engineer_${ts}@example.com`;
  const newPass = 'Secret99';
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Taylor Morgan',
      email: newEmail,
      password: newPass,
      role: 'candidate',
      preferredRole: 'Frontend Architect',
    },
  });
  assert(regRes.status === 201, `Registration failed: ${JSON.stringify(regRes.data)}`);
  assert(regRes.data.user.role === 'candidate', 'Registered user role must be candidate');
  console.log('✔ New user registered successfully');

  const newLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: newEmail, password: newPass },
  });
  assert(newLoginRes.status === 200, 'Login with new credentials failed');
  assert(newLoginRes.data.user.email === newEmail, 'Returned user email must match');
  assert(newLoginRes.data.user.role === 'candidate', 'Returned user role must be candidate');
  console.log('✔ Logged in with new credentials, role confirmed');

  // 8. Security Check: Normal registration cannot elevate to Admin
  console.log('\nCheck 8: Security - Registration cannot elevate to Admin');
  const hackerEmail = `bad_actor_${ts}@example.com`;
  const hackerReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Bad Actor',
      email: hackerEmail,
      password: 'Secret88',
      role: 'admin',
    },
  });
  assert(hackerReg.status === 201, 'Registration should succeed with safe role');
  assert(hackerReg.data.user.role !== 'admin', 'SECURITY BREACH: Admin role assigned from payload!');
  assert(hackerReg.data.user.role === 'candidate', `Server assigned safe default role: ${hackerReg.data.user.role}`);
  console.log('✔ Privilege escalation prevented: Server assigned safe candidate role');

  // 9. Role-based authorization
  console.log('\nCheck 9: Role-based Authorization');
  const candToken = newLoginRes.data.token;
  const candAdminAccess = await request('/api/admin/stats', { token: candToken });
  assert(candAdminAccess.status === 403, `Expected 403 Forbidden for candidate on /api/admin/stats, got ${candAdminAccess.status}`);
  console.log('✔ Candidate token is strictly forbidden (403) from accessing admin endpoints');

  const adminToken = adminLogin.data.token;
  const adminAccess = await request('/api/admin/stats', { token: adminToken });
  assert(adminAccess.status === 200, `Admin failed to access /api/admin/stats: ${adminAccess.status}`);
  console.log('✔ Admin token successfully authorized (200) on admin endpoints');

  // 10. Session Restoration
  console.log('\nCheck 10: Refresh / session restoration verification');
  const meRes = await request('/api/auth/me', { token: candToken });
  assert(meRes.status === 200, 'Token restore failed');
  assert(meRes.data.user.email === newEmail, 'User restored correctly from token');
  console.log('✔ Valid JWT successfully restores session on page load');

  // 11. Codebase Scan: Verify no demo buttons or demo credentials in client source
  console.log('\nCheck 11: Frontend UI Source Audit for Demo Buttons & Credentials');
  const landingCode = fs.readFileSync(path.join(__dirname, 'src/components/LandingPage.tsx'), 'utf8');
  const authModalCode = fs.readFileSync(path.join(__dirname, 'src/components/AuthModal.tsx'), 'utf8');

  assert(!landingCode.includes('Candidate Demo'), 'LandingPage must not have Candidate Demo');
  assert(!landingCode.includes('Interviewer Demo'), 'LandingPage must not have Interviewer Demo');
  assert(!landingCode.includes('Admin Demo'), 'LandingPage must not have Admin Demo');
  assert(!landingCode.includes('Quick Demo Login'), 'LandingPage must not have Quick Demo Login');
  assert(!landingCode.includes('demo-login'), 'LandingPage must not have demo-login');

  assert(!authModalCode.includes('btn-demo-candidate'), 'AuthModal must not have btn-demo-candidate');
  assert(!authModalCode.includes('btn-demo-interviewer'), 'AuthModal must not have btn-demo-interviewer');
  assert(!authModalCode.includes('btn-demo-admin'), 'AuthModal must not have btn-demo-admin');
  assert(!authModalCode.includes('1-Click Demo Logins'), 'AuthModal must not have 1-Click Demo Logins');
  console.log('✔ All demo login buttons, demo accounts bar, and demo credentials completely absent from UI');

  // 12. Password Validation (Sign In)
  console.log('\nCheck 12: Sign In 6-10 characters password validation');
  const emptyPassRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@interview.ai', password: '' },
  });
  assert(emptyPassRes.status === 400, `Expected 400, got ${emptyPassRes.status}`);
  assert(emptyPassRes.data.error === 'Password is required.', `Expected "Password is required.", got: ${emptyPassRes.data.error}`);

  const shortPassRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@interview.ai', password: '123' },
  });
  assert(shortPassRes.status === 400, `Expected 400, got ${shortPassRes.status}`);
  assert(shortPassRes.data.error === 'Password must be at least 6 characters.', `Expected "Password must be at least 6 characters.", got: ${shortPassRes.data.error}`);

  const longPassRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@interview.ai', password: '12345678901' },
  });
  assert(longPassRes.status === 400, `Expected 400, got ${longPassRes.status}`);
  assert(longPassRes.data.error === 'Password must be 10 characters or fewer.', `Expected "Password must be 10 characters or fewer.", got: ${longPassRes.data.error}`);
  console.log('✔ Sign in password validations (<6, >10, empty) verified');

  // 13. Password Validation (Sign Up)
  console.log('\nCheck 13: Sign Up 6-10 characters password validation');
  const regShortRes = await request('/api/auth/register', {
    method: 'POST',
    body: { fullName: 'Short Test', email: `short_${ts}@test.com`, password: 'abc' },
  });
  assert(regShortRes.status === 400, `Expected 400, got ${regShortRes.status}`);
  assert(regShortRes.data.error === 'Password must be at least 6 characters.', `Expected "Password must be at least 6 characters.", got: ${regShortRes.data.error}`);

  const regLongRes = await request('/api/auth/register', {
    method: 'POST',
    body: { fullName: 'Long Test', email: `long_${ts}@test.com`, password: '12345678901' },
  });
  assert(regLongRes.status === 400, `Expected 400, got ${regLongRes.status}`);
  assert(regLongRes.data.error === 'Password must be 10 characters or fewer.', `Expected "Password must be 10 characters or fewer.", got: ${regLongRes.data.error}`);

  const regMismatchRes = await request('/api/auth/register', {
    method: 'POST',
    body: { fullName: 'Mismatch Test', email: `mismatch_${ts}@test.com`, password: 'Valid1', confirmPassword: 'Valid2' },
  });
  assert(regMismatchRes.status === 400, `Expected 400, got ${regMismatchRes.status}`);
  assert(regMismatchRes.data.error === 'Passwords do not match. Please re-enter.', `Expected "Passwords do not match. Please re-enter.", got: ${regMismatchRes.data.error}`);

  const regValidRes = await request('/api/auth/register', {
    method: 'POST',
    body: { fullName: 'Valid Test', email: `valid_${ts}@test.com`, password: 'Valid1', confirmPassword: 'Valid1' },
  });
  assert(regValidRes.status === 201, `Expected 201, got ${regValidRes.status}`);
  console.log('✔ Sign up password validations (<6, >10, mismatch, valid) verified');

  console.log('\n====================================================');
  console.log('🎉 ALL SECURITY, AUTHENTICATION & CLEAN UI CHECKS PASSED');
  console.log('====================================================\n');
}

runAuthTests().catch((err) => {
  console.error('Fatal error during auth test run:', err);
  process.exit(1);
});
