import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://127.0.0.1:5000';

import User from '../models/User.js';

const results = {};

function assert(condition, name, details = '') {
    if (condition) {
        console.log(`  ✓ PASS: ${name} ${details}`);
        results[name] = 'PASS';
    } else {
        console.error(`  ✗ FAIL: ${name} ${details}`);
        results[name] = 'FAIL';
    }
}

async function runTests() {
    console.log(`============================================================`);
    console.log(`GREENBOND — ULTIMATE MONSTER AUTHENTICATION & SIGNUP TEST`);
    console.log(`============================================================`);

    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond';
    await mongoose.connect(mongoUri);
    console.log(`DATABASE: ${mongoUri}`);
    console.log(`ENVIRONMENT: Development`);
    console.log(`CONNECTION: MongoDB Mongoose`);
    console.log(`DATABASE NAME: ${mongoose.connection.name}`);
    console.log(`============================================================\n`);

    const testEmail = `reg_test_${Date.now()}@greenbond.test`;
    const testPassword = 'MonsterPassword123!';
    let userToken = null;
    let refreshCookie = null;
    let userId = null;

    // ------------------------------------------------------------
    // 1. REGISTRATION WITHOUT LOCATION & WITHOUT AUTO-LOGIN
    // ------------------------------------------------------------
    console.log(`[TEST 1] Registration without location & NO auto-login...`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Monster Tester',
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword
        })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'REGISTRATION_STATUS_201', `Status: ${regRes.status}`);
    assert(regData.token === undefined, 'NO_TOKEN_IN_REGISTRATION_RESPONSE', `Token is undefined`);
    const regCookie = regRes.headers.get('set-cookie');
    assert(!regCookie || !regCookie.includes('refreshToken='), 'NO_REFRESH_COOKIE_ON_REGISTRATION', `No auth cookie issued`);
    assert(regData.message === 'Account created successfully. Please sign in to continue.', 'REGISTRATION_SUCCESS_MESSAGE', regData.message);
    assert(regData.user && regData.user.location === null, 'REGISTRATION_LOCATION_NULL', `Location is null`);

    userId = regData.user.id;
    const dbUserExists = await User.findById(userId);
    assert(dbUserExists !== null, 'USER_CREATED_IN_MONGODB', `User ${userId} created in MongoDB`);

    // ------------------------------------------------------------
    // 2. DUPLICATE EMAIL REJECTION
    // ------------------------------------------------------------
    console.log(`\n[TEST 2] Duplicate email registration rejection...`);
    const dupRes = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Duplicate Tester',
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword
        })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400, 'DUPLICATE_EMAIL_STATUS_400', `Status: ${dupRes.status}`);
    assert(dupData.message.includes('already registered'), 'DUPLICATE_EMAIL_MESSAGE', dupData.message);

    // ------------------------------------------------------------
    // 3. ATTEMPT PROTECTED ACCESS BEFORE MANUAL SIGN-IN
    // ------------------------------------------------------------
    console.log(`\n[TEST 3] Protected route access BEFORE manual sign-in...`);
    const unauthValRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
        method: 'GET'
    });
    assert(unauthValRes.status === 401, 'UNAUTHENTICATED_BEFORE_LOGIN_STATUS', `Status: ${unauthValRes.status} (Expected 401)`);

    // ------------------------------------------------------------
    // 4. MANUAL LOGIN WITH NEWLY CREATED CREDENTIALS
    // ------------------------------------------------------------
    console.log(`\n[TEST 4] Manual login with newly created credentials...`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: testPassword
        })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'MANUAL_LOGIN_STATUS_200', `Status: ${loginRes.status}`);
    assert(loginData.success === true && loginData.token, 'MANUAL_LOGIN_TOKEN_ISSUED');
    assert(loginData.user && loginData.user.email === testEmail, 'MANUAL_LOGIN_USER_MATCH');

    userToken = loginData.token;
    const cookieHeader = loginRes.headers.get('set-cookie');
    if (cookieHeader) {
        refreshCookie = cookieHeader.split(';')[0];
    }

    // ------------------------------------------------------------
    // 5. VALIDATE TOKEN AFTER MANUAL SIGN-IN
    // ------------------------------------------------------------
    console.log(`\n[TEST 5] Validate token AFTER manual sign-in...`);
    const valRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const valData = await valRes.json();
    assert(valRes.status === 200, 'VALIDATE_TOKEN_SUCCESS', `Status: ${valRes.status}`);
    assert(valData.success === true && valData.user.email === testEmail, 'VALIDATE_TOKEN_USER_DATA');

    // ------------------------------------------------------------
    // 6. ACCESS PROTECTED ROUTE AFTER MANUAL SIGN-IN
    // ------------------------------------------------------------
    console.log(`\n[TEST 6] Access protected route AFTER manual sign-in...`);
    const ordersRes = await fetch(`${BASE_URL}/api/orders/my-orders`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(ordersRes.status === 200, 'PROTECTED_ROUTE_SUCCESS', `Status: ${ordersRes.status}`);

    // ------------------------------------------------------------
    // 7. WRONG PASSWORD & UNKNOWN EMAIL CHECKS
    // ------------------------------------------------------------
    console.log(`\n[TEST 7] Wrong password & unknown email checks...`);
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword99!' })
    });
    assert(wrongPassRes.status === 401, 'WRONG_PASSWORD_STATUS_401');

    const unknownRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ghost_unknown_8372@greenbond.test', password: testPassword })
    });
    assert(unknownRes.status === 401, 'UNKNOWN_EMAIL_STATUS_401');

    // ------------------------------------------------------------
    // 8. GHOST LOGIN TEST (DELETE USER FROM DB -> OLD SESSION MUST FAIL)
    // ------------------------------------------------------------
    console.log(`\n[TEST 8] GHOST LOGIN TEST (Delete user from MongoDB and verify old token)...`);
    await User.deleteOne({ _id: userId });
    const checkUser = await User.findById(userId);
    assert(checkUser === null, 'USER_DELETED_FROM_DB', 'User deleted from MongoDB');

    const ghostValRes = await fetch(`${BASE_URL}/api/auth/validate-token`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(ghostValRes.status === 401, 'GHOST_VALIDATE_TOKEN_401', `Status: ${ghostValRes.status} (Expected 401)`);

    const ghostApiRes = await fetch(`${BASE_URL}/api/orders/my-orders`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(ghostApiRes.status === 401, 'GHOST_PROTECTED_API_401', `Status: ${ghostApiRes.status} (Expected 401)`);

    if (refreshCookie) {
        const ghostRefreshRes = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            method: 'GET',
            headers: { 'Cookie': refreshCookie }
        });
        assert(ghostRefreshRes.status === 401, 'GHOST_REFRESH_TOKEN_401', `Status: ${ghostRefreshRes.status} (Expected 401)`);
    }

    const ghostLoginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert(ghostLoginRes.status === 401, 'GHOST_FRESH_LOGIN_401', `Status: ${ghostLoginRes.status} (Expected 401)`);

    // ------------------------------------------------------------
    // 9. LOGOUT
    // ------------------------------------------------------------
    console.log(`\n[TEST 9] Logout test...`);
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    assert(logoutRes.status === 200, 'LOGOUT_STATUS_200');

    console.log(`\n============================================================`);
    console.log(`FINAL RESULTS SUMMARY:`);
    const allPassed = Object.values(results).every(r => r === 'PASS');
    console.log(`ALL TESTS: ${allPassed ? 'ALL PASS ✓' : 'SOME FAILED ✗'}`);
    console.log(`============================================================`);

    await mongoose.connection.close();
    process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
    console.error('Test execution fatal error:', err);
    process.exit(1);
});
