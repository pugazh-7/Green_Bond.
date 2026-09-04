import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:5000';

async function runSuite() {
    console.log('====================================================');
    console.log('GREENBOND AUTHENTICATION COMPREHENSIVE VERIFICATION');
    console.log('====================================================\n');

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

        // Test 2: User Login with Valid Credentials
        console.log('\n--- 2. Testing /api/auth/login-user (Valid Credentials) ---');
        const start = Date.now();
        const validLoginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'pugazh@gmail.com', password: 'password123' })
        });
        const duration = Date.now() - start;
        const validLoginData = await validLoginRes.json();
        assert(validLoginRes.status === 200, `Login returns HTTP 200 (took ${duration}ms)`);
        assert(validLoginData.success === true, 'Response contains success: true');
        assert(validLoginData.token && typeof validLoginData.token === 'string', 'Valid JWT accessToken returned');
        assert(validLoginData.user && validLoginData.user.role === 'user', 'User role correctly normalized to "user"');

        // Check Set-Cookie header
        const rawCookie = validLoginRes.headers.get('set-cookie');
        assert(rawCookie && rawCookie.includes('refreshToken='), 'Set-Cookie header includes refreshToken');

        const token = validLoginData.token;
        const cookieHeader = rawCookie ? rawCookie.split(';')[0] : '';

        // Test 3: Validate Token with Bearer
        console.log('\n--- 3. Testing /api/auth/validate-token (Valid Bearer) ---');
        const valRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const valData = await valRes.json();
        assert(valRes.status === 200, 'Validate-token returns HTTP 200');
        assert(valData.success === true && valData.user.email === 'pugazh@gmail.com', 'Token correctly validated for user');

        // Test 4: Validate Token with Invalid Token
        console.log('\n--- 4. Testing /api/auth/validate-token (Invalid Bearer) ---');
        const invalidValRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_garbage_token_12345'
            }
        });
        assert(invalidValRes.status === 401, 'Invalid Bearer token immediately returns HTTP 401 (never hangs)');

        // Test 5: Refresh Token with Cookie
        console.log('\n--- 5. Testing /api/auth/refresh-token (With Cookie) ---');
        const refRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            method: 'GET',
            headers: {
                'Cookie': cookieHeader
            }
        });
        const refData = await refRes.json();
        assert(refRes.status === 200, 'Refresh-token with valid cookie returns HTTP 200');
        assert(refData.token && typeof refData.token === 'string', 'New rotated accessToken returned');

        // Test 6: Refresh Token without Cookie
        console.log('\n--- 6. Testing /api/auth/refresh-token (Without Cookie) ---');
        const noCookieRefRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            method: 'GET'
        });
        assert(noCookieRefRes.status === 401, 'Refresh-token without cookie immediately returns HTTP 401');

        // Test 7: Login with Wrong Password
        console.log('\n--- 7. Testing /api/auth/login-user (Wrong Password) ---');
        const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'pugazh@gmail.com', password: 'incorrect_password' })
        });
        assert(wrongPassRes.status === 401, 'Wrong password returns HTTP 401');
        const wrongPassData = await wrongPassRes.json();
        assert(wrongPassData.message === 'Invalid email or password', 'Correct safe error message returned');

        // Test 8: Login with Unknown Email
        console.log('\n--- 8. Testing /api/auth/login-user (Unknown Email) ---');
        const unknownEmailRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent_user_999@gmail.com', password: 'somepassword' })
        });
        assert(unknownEmailRes.status === 401, 'Unknown email returns HTTP 401');

        // Test 9: Login with Empty Input
        console.log('\n--- 9. Testing /api/auth/login-user (Empty Input) ---');
        const emptyInputRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' })
        });
        assert(emptyInputRes.status === 400, 'Empty email/password returns HTTP 400 validation error');

        // Test 10: Logout Endpoint
        console.log('\n--- 10. Testing /api/auth/logout ---');
        const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST'
        });
        assert(logoutRes.status === 200, 'Logout returns HTTP 200');
        const logoutCookie = logoutRes.headers.get('set-cookie');
        assert(logoutCookie && (logoutCookie.includes('refreshToken=;') || logoutCookie.includes('Max-Age=0')), 'Logout clears refreshToken cookie');

        // Test 11: Protected API Access
        console.log('\n--- 11. Testing Protected Route /api/orders/my-orders ---');
        const ordersRes = await fetch(`${BASE_URL}/api/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert(ordersRes.status === 200, 'Protected orders endpoint accessible with token (HTTP 200)');

        // Test 12: SPA Static File Serving
        console.log('\n--- 12. Testing SPA Frontend Serving ---');
        const spaRes = await fetch(`${BASE_URL}/`);
        assert(spaRes.status === 200, 'Root / serves SPA index.html (HTTP 200)');
        const spaText = await spaRes.text();
        assert(spaText.includes('id="root"'), 'SPA HTML root element present');

        console.log('\n====================================================');
        console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log('====================================================');

        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error('Test suite error:', e);
        process.exit(1);
    }
}

runSuite();
