const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond';

const assert = (condition, msg) => {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${msg}`);
        throw new Error(msg);
    }
    console.log(`  ✓ ${msg}`);
};

async function runTests() {
    console.log('\n======================================================');
    console.log('🚀 RUNNING GREENBOND MASTER AUTH FIX VERIFICATION');
    console.log('======================================================\n');

    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const resetCol = db.collection('passwordresets');

    const TEST_ADMIN_EMAIL = 'admin@greenbond.com';
    const TEST_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    const TEST_USER_EMAIL = 'master_auth_user@greenbond.com';
    const OLD_PASSWORD = 'OldPassword123!';
    const NEW_PASSWORD = 'NewPassword456!';

    try {
        // -----------------------------------------------------------
        // PART 1: SETUP TEST USER
        // -----------------------------------------------------------
        console.log('--- TEST 1: Provision Normal User for Recovery Test ---');
        await usersCol.deleteOne({ email: TEST_USER_EMAIL });
        const userSalt = await bcrypt.genSalt(10);
        const userHashedPassword = await bcrypt.hash(OLD_PASSWORD, userSalt);
        await usersCol.insertOne({
            name: 'Master Auth Test User',
            email: TEST_USER_EMAIL,
            mobile: '9876543210',
            password: userHashedPassword,
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('  ✓ Normal test user created in MongoDB.');

        // -----------------------------------------------------------
        // PART 2: TEST FORGOT PASSWORD - REQUEST OTP
        // -----------------------------------------------------------
        console.log('\n--- TEST 2: Request Password Recovery OTP ---');
        const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL })
        });
        const forgotData = await forgotRes.json();
        assert(forgotRes.status === 200, 'Forgot password request returned HTTP 200');
        assert(forgotData.success === true, 'Forgot password response returned success: true');

        // Verify record in MongoDB
        const resetRecord = await resetCol.findOne({ email: TEST_USER_EMAIL, used: false });
        assert(Boolean(resetRecord), 'PasswordReset document created in MongoDB');
        assert(Boolean(resetRecord.otpHash), 'OTP is hashed with bcrypt in MongoDB (not stored plaintext)');
        assert(resetRecord.expiresAt > new Date(), 'OTP expiration timestamp is in the future');

        // -----------------------------------------------------------
        // PART 3: TEST OTP VERIFICATION FAILURES
        // -----------------------------------------------------------
        console.log('\n--- TEST 3: Verify OTP Failure Handling ---');
        // Invalid 6-digit code
        const wrongOtpRes = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL, otp: '000000' })
        });
        const wrongOtpData = await wrongOtpRes.json();
        assert(wrongOtpRes.status === 400, 'Wrong OTP rejected with HTTP 400');
        assert(wrongOtpData.success === false, 'Wrong OTP returned success: false');

        // Check attempts incremented
        const updatedRecord = await resetCol.findOne({ _id: resetRecord._id });
        assert(updatedRecord.attempts === 1, 'Failed attempt count incremented to 1');

        // -----------------------------------------------------------
        // PART 4: TEST SUCCESSFUL OTP VERIFICATION
        // -----------------------------------------------------------
        console.log('\n--- TEST 4: Successful OTP Verification & Reset Token Issuance ---');
        // Generate known valid OTP and update hash in DB for deterministic verification
        const validOtp = '742915';
        const salt = await bcrypt.genSalt(10);
        const validOtpHash = await bcrypt.hash(validOtp, salt);
        await resetCol.updateOne({ _id: resetRecord._id }, { $set: { otpHash: validOtpHash } });

        const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL, otp: validOtp })
        });
        const verifyData = await verifyRes.json();
        assert(verifyRes.status === 200, 'Valid OTP accepted with HTTP 200');
        assert(Boolean(verifyData.resetToken), 'Server issued single-use resetToken');
        const resetToken = verifyData.resetToken;

        // Verify token hash is stored in DB
        const verifiedRecord = await resetCol.findOne({ _id: resetRecord._id });
        assert(verifiedRecord.verified === true, 'PasswordReset marked as verified: true');
        assert(Boolean(verifiedRecord.resetTokenHash), 'SHA-256 hash of resetToken stored server-side');

        // -----------------------------------------------------------
        // PART 5: TEST RESET PASSWORD VALIDATION & EXECUTION
        // -----------------------------------------------------------
        console.log('\n--- TEST 5: Password Reset Form Validations & Execution ---');
        // Mismatched passwords
        const mismatchRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER_EMAIL,
                resetToken,
                newPassword: NEW_PASSWORD,
                confirmPassword: 'DifferentPassword!'
            })
        });
        assert(mismatchRes.status === 400, 'Password mismatch rejected with HTTP 400');

        // Weak password (<6 chars)
        const weakRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER_EMAIL,
                resetToken,
                newPassword: '123',
                confirmPassword: '123'
            })
        });
        assert(weakRes.status === 400, 'Weak password (< 6 chars) rejected with HTTP 400');

        // Valid password reset
        const resetSubmitRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER_EMAIL,
                resetToken,
                newPassword: NEW_PASSWORD,
                confirmPassword: NEW_PASSWORD
            })
        });
        const resetSubmitData = await resetSubmitRes.json();
        assert(resetSubmitRes.status === 200, 'Password reset successful with HTTP 200');
        assert(resetSubmitData.success === true, 'Password reset success message returned');

        // Verify single-use token invalidation
        const replayRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER_EMAIL,
                resetToken,
                newPassword: 'AnotherPassword123!',
                confirmPassword: 'AnotherPassword123!'
            })
        });
        assert(replayRes.status === 400, 'Replay of single-use resetToken strictly rejected with HTTP 400');

        // Verify user in MongoDB
        const updatedUser = await usersCol.findOne({ email: TEST_USER_EMAIL });
        const isNewPassMatch = await bcrypt.compare(NEW_PASSWORD, updatedUser.password);
        assert(isNewPassMatch === true, 'New password hash verified in MongoDB');
        assert(updatedUser.role === 'user', 'User role strictly preserved as user (no escalation)');
        assert(Boolean(updatedUser.lastLogoutAt), 'lastLogoutAt timestamp updated to invalidate old sessions');

        // -----------------------------------------------------------
        // PART 6: TEST LOGIN AFTER RESET
        // -----------------------------------------------------------
        console.log('\n--- TEST 6: Login After Password Reset ---');
        // Old password must FAIL
        const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL, password: OLD_PASSWORD })
        });
        assert(oldLoginRes.status === 401, 'Login with OLD password strictly rejected with HTTP 401');

        // New password must SUCCEED
        const newLoginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL, password: NEW_PASSWORD })
        });
        const newLoginData = await newLoginRes.json();
        assert(newLoginRes.status === 200, 'Login with NEW password succeeded with HTTP 200');
        assert(Boolean(newLoginData.token), 'Valid JWT token issued for new password login');
        assert(newLoginData.user.role === 'user', 'Authenticated role verified as user');

        // -----------------------------------------------------------
        // PART 7: ADMIN LOGIN & ROLE ISOLATION
        // -----------------------------------------------------------
        console.log('\n--- TEST 7: Admin Login & Role Isolation ---');
        // 1. Normal user credentials attempting /api/auth/login-admin MUST BE FORBIDDEN (403)
        const userAsAdminRes = await fetch(`${BASE_URL}/api/auth/login-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER_EMAIL, password: NEW_PASSWORD })
        });
        const userAsAdminData = await userAsAdminRes.json();
        assert(userAsAdminRes.status === 403, 'Normal USER credentials to /login-admin rejected with HTTP 403 Forbidden');
        assert(userAsAdminData.message.includes('Administrator privileges required'), 'Error message states Administrator privileges required');

        // 2. Real admin account login to /api/auth/login-admin MUST SUCCEED (200)
        const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD })
        });
        const adminLoginData = await adminLoginRes.json();
        assert(adminLoginRes.status === 200, 'Real ADMIN login succeeded with HTTP 200');
        assert(adminLoginData.user.role === 'admin', 'Admin response confirms role === "admin"');
        const adminToken = adminLoginData.token;
        assert(Boolean(adminToken), 'Admin JWT access token returned');

        // 3. User token attempting admin stats API MUST BE FORBIDDEN (403)
        const userToken = newLoginData.token;
        const userAccessAdminRes = await fetch(`${BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert(userAccessAdminRes.status === 403, 'Normal USER token to /api/admin/stats rejected with HTTP 403');

        // 4. Admin token attempting admin stats API MUST SUCCEED (200)
        const adminAccessAdminRes = await fetch(`${BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminStatsData = await adminAccessAdminRes.json();
        assert(adminAccessAdminRes.status === 200, 'ADMIN token to /api/admin/stats succeeded with HTTP 200');
        assert(adminStatsData.totalUsers !== undefined, 'Admin stats overview retrieved with totalUsers');

        // Cleanup
        await usersCol.deleteOne({ email: TEST_USER_EMAIL });
        await resetCol.deleteMany({ email: TEST_USER_EMAIL });

        console.log('\n======================================================');
        console.log('✅ ALL BACKEND AUTH & RECOVERY TESTS PASSED (100%)');
        console.log('======================================================\n');
    } catch (err) {
        console.error('\n❌ TEST RUN FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTests();
