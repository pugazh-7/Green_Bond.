import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';

async function runProductionAuthSuite() {
    console.log('===========================================================');
    console.log('GREENBOND PRODUCTION AUTHENTICATION & CORS VALIDATION SUITE');
    console.log(`Target: ${BASE_URL}`);
    console.log('===========================================================\n');

    let passed = 0;
    let failed = 0;

    const assert = (condition, desc) => {
        if (condition) {
            console.log(`[PASS] ${desc}`);
            passed++;
        } else {
            console.error(`[FAIL] ${desc}`);
            failed++;
        }
    };

    try {
        // Test 1: Health Check
        console.log('--- 1. Testing /api/health ---');
        const healthRes = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthRes.json();
        assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
        assert(healthData.database === 'connected', 'Database reports connected state');

        // Test 2: CORS Preflight OPTIONS from Vercel Origin
        console.log('\n--- 2. Testing CORS Preflight OPTIONS (Vercel Origin) ---');
        const vercelOrigin = 'https://greenbond-test.vercel.app';
        const optionsRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'OPTIONS',
            headers: {
                'Origin': vercelOrigin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
        });
        const allowOrigin = optionsRes.headers.get('access-control-allow-origin');
        const allowCreds = optionsRes.headers.get('access-control-allow-credentials');
        assert(optionsRes.status === 204 || optionsRes.status === 200, `OPTIONS returns 204/200 (received ${optionsRes.status})`);
        assert(allowOrigin === vercelOrigin, `Access-Control-Allow-Origin echoes Vercel origin (${allowOrigin})`);
        assert(allowCreds === 'true', 'Access-Control-Allow-Credentials is true');

        // Test 3: Register New User
        console.log('\n--- 3. Testing /api/auth/register-user ---');
        const timestamp = Date.now();
        const testUser = {
            name: 'Production Auth Test',
            email: `prod_auth_${timestamp}@greenbond.com`,
            mobile: `9${String(timestamp).slice(-9)}`,
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };
        const regRes = await fetch(`${BASE_URL}/api/auth/register-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': vercelOrigin
            },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        assert(regRes.status === 201, `User registration returns HTTP 201 (status: ${regRes.status})`);
        assert(regData.success === true, 'User registration returns success: true');
        assert(regData.token && typeof regData.token === 'string', 'User registration returns initial JWT');

        // Test 4: User Login with /login-user
        console.log('\n--- 4. Testing /api/auth/login-user ---');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': vercelOrigin
            },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200, 'Login returns HTTP 200');
        assert(loginData.success === true, 'Response contains success: true');
        assert(loginData.token && typeof loginData.token === 'string', 'JWT access token returned');
        assert(loginData.user && loginData.user.email === testUser.email, 'Correct user profile returned');

        const token = loginData.token;
        const setCookieHeader = loginRes.headers.get('set-cookie');
        assert(setCookieHeader && setCookieHeader.includes('refreshToken='), 'Set-Cookie includes refreshToken');

        // Test 5: Unified /api/auth/login
        console.log('\n--- 5. Testing Unified /api/auth/login ---');
        const unifiedRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': vercelOrigin
            },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });
        const unifiedData = await unifiedRes.json();
        assert(unifiedRes.status === 200, 'Unified /api/auth/login returns HTTP 200');
        assert(unifiedData.success === true, 'Unified response has success: true');
        assert(unifiedData.token && typeof unifiedData.token === 'string', 'Unified returns valid token');

        // Test 6: Validate Token with MongoDB
        console.log('\n--- 6. Testing /api/auth/validate-token ---');
        const valRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': vercelOrigin
            }
        });
        const valData = await valRes.json();
        assert(valRes.status === 200, 'Validate-token returns HTTP 200');
        assert(valData.success === true, 'Validate-token success is true');
        assert(valData.user && valData.user.email === testUser.email, 'Validated against real user in MongoDB');

        // Test 7: Validate with Stale / Malformed Token
        console.log('\n--- 7. Testing /api/auth/validate-token (Invalid Token) ---');
        const badValRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
            headers: { 'Authorization': 'Bearer fake_invalid_expired_token' }
        });
        assert(badValRes.status === 401, 'Invalid token returns HTTP 401');

        // Test 8: Refresh Token
        console.log('\n--- 8. Testing /api/auth/refresh-token ---');
        const cookieVal = setCookieHeader ? setCookieHeader.split(';')[0] : '';
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            headers: { 'Cookie': cookieVal, 'Origin': vercelOrigin }
        });
        const refreshData = await refreshRes.json();
        assert(refreshRes.status === 200, 'Refresh-token with valid cookie returns HTTP 200');
        assert(refreshData.token && typeof refreshData.token === 'string', 'Refreshed token returned');

        // Test 9: Invalid Credentials
        console.log('\n--- 9. Testing Invalid Credentials ---');
        const wrongRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: 'wrong_password_here' })
        });
        const wrongData = await wrongRes.json();
        assert(wrongRes.status === 401, 'Wrong password returns HTTP 401');
        assert(wrongData.message === 'Invalid email or password.', 'Standardized error message returned');

        // Test 10: Logout
        console.log('\n--- 10. Testing /api/auth/logout ---');
        const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': vercelOrigin
            }
        });
        assert(logoutRes.status === 200, 'Logout returns HTTP 200');
        const logoutCookie = logoutRes.headers.get('set-cookie');
        assert(logoutCookie && (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('expires=')), 'Logout expires refreshToken cookie');

        // Test 11: Token rejected after logout
        console.log('\n--- 11. Testing Token Validity After Logout ---');
        const postLogoutValRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert(postLogoutValRes.status === 401, 'Token invalidated after logout (HTTP 401 session ended in DB)');

        console.log('\n===========================================================');
        console.log(`PRODUCTION SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('===========================================================');

        process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
        console.error('Suite error:', err);
        process.exit(1);
    }
}

runProductionAuthSuite();
