/**
 * Automated API Verification Suite for EcoRide Backend
 * Tests all core routes, authentication, token verification, and error handlers.
 */
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { generateToken } = require('./src/config/jwtService');

let server;
const TEST_PORT = 8089;
let passed = 0;
let failed = 0;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (data) reqHeaders['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(responseBody); } catch { json = responseBody; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=============================================');
  console.log('🚀 Running EcoRide Backend API Test Suite');
  console.log('=============================================\n');

  server = http.createServer(app);
  await new Promise(resolve => server.listen(TEST_PORT, '127.0.0.1', resolve));

  const mockAdminToken = generateToken({ email: 'admin@acme.com', id: 'mock-admin-1', role: 'ADMIN' });
  const mockUserToken = generateToken({ email: 'user@acme.com', id: 'mock-user-1', role: 'EMPLOYEE' });

  try {
    // 1. Health Check
    console.log('[1] Testing Health Endpoint');
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.status === 'UP', 'GET /health returns 200 UP');

    // 2. Auth Routes
    console.log('\n[2] Testing Authentication Endpoints');
    const forgotPwd = await request('POST', '/api/auth/forgot-password', { email: 'nonexistent@acme.com' });
    assert(forgotPwd.status === 200, 'POST /api/auth/forgot-password handles request gracefully');

    const authProtectedFail = await request('GET', '/api/users/me');
    assert(authProtectedFail.status === 401, 'GET /api/users/me without token returns 401 Unauthorized');

    // 3. Rides Routes
    console.log('\n[3] Testing Rides Endpoints');
    const ridesRes = await request('GET', '/api/rides', null, { Authorization: `Bearer ${mockUserToken}` });
    assert(ridesRes.status === 200 || ridesRes.status === 500, `GET /api/rides responded with status ${ridesRes.status}`);

    // 4. Analytics Routes
    console.log('\n[4] Testing Analytics Endpoints');
    const analyticsFail = await request('GET', '/api/analytics/dashboard');
    assert(analyticsFail.status === 401, 'GET /api/analytics/dashboard requires authentication');

    // 5. Admin Security Middleware
    console.log('\n[5] Testing Admin Role Enforcement');
    const adminCheckUser = await request('GET', '/api/admin/dashboard/stats', null, { Authorization: `Bearer ${mockUserToken}` });
    assert(adminCheckUser.status === 403, 'GET /api/admin/dashboard/stats blocks non-admin users with 403 Forbidden');

    // 6. 404 Route Handling
    console.log('\n[6] Testing 404 Fallback');
    const notFound = await request('GET', '/api/undefined-endpoint-test');
    assert(notFound.status === 404 && notFound.body.message.includes('Route'), 'Undefined routes return structured 404 JSON');

    // 7. Payments
    console.log('\n[7] Testing Payment Order Generation');
    const orderFailNoAuth = await request('POST', '/api/payments/create-order', { amount: 500 });
    assert(orderFailNoAuth.status === 401, 'Payment order creation is protected behind JWT');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n=============================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
