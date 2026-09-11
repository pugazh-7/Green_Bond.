import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:5000';

async function runTestMatrix() {
    console.log('====================================================');
    console.log('GREENBOND RULE 13: LOCATION OPTIONAL TEST MATRIX');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    const assert = (cond, msg) => {
        if (cond) {
            console.log(`[PASS] ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failed++;
        }
    };

    const timestamp = Date.now();
    const testEmail1 = `user_no_loc_${timestamp}@example.com`;
    const testEmail2 = `user_with_loc_${timestamp}@example.com`;
    const testPassword = 'securePassword123';

    // TEST 1: Register with: Name, Email, Password, Confirm Password
    console.log('--- TEST 1: Register with Name, Email, Password, Confirm Password ---');
    const res1 = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'No Location User',
            email: testEmail1,
            password: testPassword,
            confirmPassword: testPassword
        })
    });
    const data1 = await res1.json();
    assert(res1.status === 201, 'HTTP status is 201 Created');
    assert(data1.success === true, 'Response indicates success: true');
    assert(data1.token && typeof data1.token === 'string', 'Valid JWT token returned');
    assert(data1.user && data1.user.email === testEmail1, 'User email returned correctly');
    assert(data1.user.location === null, 'Location is cleanly null');

    // TEST 2: Register with: Name, Email, Password, Confirm Password, Location
    console.log('\n--- TEST 2: Register with Name, Email, Password, Confirm Password, Location ---');
    const res2 = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'With Location User',
            email: testEmail2,
            password: testPassword,
            confirmPassword: testPassword,
            location: {
                lat: 12.2253,
                lng: 79.0747,
                address: 'Thiruvannamalai Town, Tamil Nadu'
            }
        })
    });
    const data2 = await res2.json();
    assert(res2.status === 201, 'HTTP status is 201 Created');
    assert(data2.user && data2.user.location && data2.user.location.lat === 12.2253, 'Location stored accurately');

    // TEST 3: Register with existing email
    console.log('\n--- TEST 3: Register with existing email ---');
    const res3 = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Duplicate Email User',
            email: testEmail1,
            password: testPassword,
            confirmPassword: testPassword
        })
    });
    const data3 = await res3.json();
    assert(res3.status === 400, 'HTTP status is 400 Bad Request');
    assert(data3.message === 'This email is already registered. Please login.', `Returned expected message: "${data3.message}"`);

    // TEST 4: Register with invalid email
    console.log('\n--- TEST 4: Register with invalid email ---');
    const res4 = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Invalid Email User',
            email: 'not-an-email',
            password: testPassword,
            confirmPassword: testPassword
        })
    });
    const data4 = await res4.json();
    assert(res4.status === 400, 'HTTP status is 400 Bad Request');
    assert(data4.message === 'Please enter a valid email address.', `Returned expected message: "${data4.message}"`);

    // TEST 5: Register with weak password (< 6 chars)
    console.log('\n--- TEST 5: Register with weak password ---');
    const res5 = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Weak Pass User',
            email: `weak_${timestamp}@example.com`,
            password: '123',
            confirmPassword: '123'
        })
    });
    const data5 = await res5.json();
    assert(res5.status === 400, 'HTTP status is 400 Bad Request');
    assert(data5.message === 'Password must be at least 6 characters long.', `Returned expected message: "${data5.message}"`);

    // TEST 6: Register without location (Account created successfully)
    console.log('\n--- TEST 6: Register without location ---');
    assert(res1.status === 201 && data1.user.location === null, 'Account created successfully without location');

    // TEST 7: Login newly created user without location
    console.log('\n--- TEST 7: Login newly created user without location ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail1,
            password: testPassword
        })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login returns HTTP 200');
    assert(loginData.success === true, 'Login response success: true');
    assert(loginData.token && typeof loginData.token === 'string', 'Token returned for location-less user');

    // TEST 8: Session remains valid after login
    console.log('\n--- TEST 8: Validate session for location-less user ---');
    const valRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const valData = await valRes.json();
    assert(valRes.status === 200, 'Validate-token returns HTTP 200');
    assert(valData.user && valData.user.email === testEmail1, 'Token validated correctly');

    // TEST 9: Add location AFTER registration
    console.log('\n--- TEST 9: Add location AFTER registration ---');
    const addLocRes = await fetch(`${BASE_URL}/api/auth/user/address`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
            label: 'HOME',
            name: 'No Location User',
            address: '42 Gandhi Nagar',
            city: 'Thiruvannamalai',
            state: 'Tamil Nadu',
            pin: '606601',
            lat: 12.2253,
            lng: 79.0747
        })
    });
    assert(addLocRes.status === 200 || addLocRes.status === 201, `Address added successfully (HTTP ${addLocRes.status})`);

    // TEST 10: Clear location if supported (Account still valid)
    console.log('\n--- TEST 10: Account still works without location ---');
    const userProfileRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    assert(userProfileRes.status === 200, 'Account session remains active and valid');

    // TEST 11: Browse Shopping without location
    console.log('\n--- TEST 11: Browse Shopping without location ---');
    const shoppingRes = await fetch(`${BASE_URL}/api/marketplace/shopping-meta`);
    assert(shoppingRes.status === 200, 'Shopping meta API returned HTTP 200 without location');

    // TEST 12: Browse Quick without location
    console.log('\n--- TEST 12: Browse Quick without location ---');
    const quickRes = await fetch(`${BASE_URL}/api/marketplace/quick-meta`);
    assert(quickRes.status === 200, 'Quick meta API returned HTTP 200 without location');

    // TEST 13: Browse Fresh without location
    console.log('\n--- TEST 13: Browse Fresh without location ---');
    const freshRes = await fetch(`${BASE_URL}/api/marketplace/fresh`);
    assert(freshRes.status === 200, 'Fresh marketplace API returned HTTP 200 without location');

    // TEST 14: Checkout without location (Coordinates required guard)
    console.log('\n--- TEST 14: Checkout without location ---');
    const checkoutRes = await fetch(`${BASE_URL}/api/orders/check-serviceability`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({}) // no coordinates
    });
    const checkoutData = await checkoutRes.json();
    assert(checkoutRes.status === 400, 'Checkout serviceability without coords returns HTTP 400');
    assert(checkoutData.message === 'Coordinates are required', `Clear prompt returned: "${checkoutData.message}"`);

    console.log('\n====================================================');
    console.log(`TEST MATRIX SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTestMatrix().catch((err) => {
    console.error('Error running test matrix:', err);
    process.exit(1);
});
