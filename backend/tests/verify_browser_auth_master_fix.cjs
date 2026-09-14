const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const FRONTEND_URL = 'http://localhost:5173';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserTests() {
    console.log('\n======================================================');
    console.log('🌐 RUNNING END-TO-END BROWSER AUTOMATION TESTS');
    console.log('======================================================\n');

    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const resetCol = db.collection('passwordresets');

    const TEST_ADMIN_EMAIL = 'admin@greenbond.com';
    const TEST_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    const timestamp = Date.now();
    const TEST_USER_EMAIL = `browser_auth_${timestamp}@greenbond.com`;
    const INITIAL_PASSWORD = 'InitialPassword123!';
    const UPDATED_PASSWORD = 'UpdatedPassword456!';

    // Ensure normal test user exists in DB
    const salt = await bcrypt.genSalt(10);
    const initialHash = await bcrypt.hash(INITIAL_PASSWORD, salt);
    await usersCol.insertOne({
        name: `Browser Test User`,
        email: TEST_USER_EMAIL,
        mobile: `91${String(timestamp).slice(-8)}`,
        password: initialHash,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    // Catch console errors and logs
    page.on('pageerror', (err) => console.log('  [Browser Page Error]:', err.message));
    page.on('console', (msg) => {
        const text = msg.text();
        console.log('  [Browser Console]:', text);
    });
    page.on('response', async (res) => {
        if (res.status() >= 400) {
            let text = '';
            try { text = await res.text(); } catch {}
            console.log('  [HTTP ERROR RESPONSE]:', res.status(), res.url(), text);
        }
    });

    try {
        // -------------------------------------------------------------
        // TEST A: ADMIN LOGIN PAGE RENDERING & SECURITY CHECKS
        // -------------------------------------------------------------
        console.log('--- TEST A: Admin Login Page Verification ---');
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(`${FRONTEND_URL}/#/admin/login`, { waitUntil: 'networkidle2' });
        await delay(1000);

        const currentUrl = page.url();
        console.log(`  Current URL: ${currentUrl}`);
        if (!currentUrl.includes('/admin/login')) {
            throw new Error(`Expected /admin/login, got ${currentUrl}`);
        }

        // Verify NO public "Create Admin Account" button
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.toLowerCase().includes('create admin account') || bodyText.toLowerCase().includes('register admin')) {
            throw new Error('SECURITY VIOLATION: Public admin creation button detected on Admin Login page!');
        }
        console.log('  ✓ Verified NO public admin registration/account creation button exists.');

        async function clearAndType(selector, text) {
            await page.waitForSelector(selector, { visible: true });
            await page.click(selector);
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.type(selector, text);
            const val = await page.$eval(selector, (el) => el.value);
            console.log(`    Input ${selector} value verified: "${val}"`);
        }

        // Test rejected login with non-admin / invalid credentials
        console.log('  Testing non-admin login rejection on /admin/login...');
        await clearAndType('#admin-email', TEST_USER_EMAIL);
        await clearAndType('#admin-password', INITIAL_PASSWORD);
        await page.click('#admin-login-submit');
        await delay(1500);

        const urlAfterNonAdmin = page.url();
        if (urlAfterNonAdmin.includes('/admin/dashboard')) {
            throw new Error('SECURITY VIOLATION: Non-admin credentials accessed Admin Dashboard!');
        }
        console.log('  ✓ Normal user credentials successfully denied access to Admin Dashboard.');

        // Clean clear and type admin credentials
        console.log('  Logging in with valid ADMIN credentials...');
        await clearAndType('#admin-email', TEST_ADMIN_EMAIL);
        await clearAndType('#admin-password', TEST_ADMIN_PASSWORD);
        await page.click('#admin-login-submit');

        // Wait for redirect to /admin/dashboard
        await page.waitForFunction(() => window.location.hash.includes('/admin/dashboard'), { timeout: 10000 });
        console.log('  ✓ Admin Login succeeded! Navigated to /admin/dashboard.');

        // Verify Admin Dashboard loaded
        await delay(2000);
        const dashboardLoaded = await page.evaluate(() => {
            return document.querySelector('#logout-btn') !== null || document.body.innerText.includes('Admin');
        });
        if (!dashboardLoaded) throw new Error('Admin Dashboard failed to render elements.');
        console.log('  ✓ Admin Dashboard UI elements rendered.');

        // Test Admin Logout
        console.log('  Testing Admin Logout...');
        await page.waitForSelector('#logout-btn', { visible: true });
        await page.click('#logout-btn');
        await delay(1500);

        const urlAfterLogout = page.url();
        console.log(`  URL after Admin Logout: ${urlAfterLogout}`);
        if (!urlAfterLogout.includes('/admin/login')) {
            throw new Error(`Expected /admin/login after logout, got ${urlAfterLogout}`);
        }
        console.log('  ✓ Admin Logout cleanly cleared state and returned to /admin/login.');

        // Test direct URL navigation to /admin/dashboard while logged out
        console.log('  Testing direct access to /admin/dashboard while unauthenticated...');
        await page.goto(`${FRONTEND_URL}/#/admin/dashboard`, { waitUntil: 'networkidle2' });
        await delay(1000);
        const urlDirect = page.url();
        if (urlDirect.includes('/admin/dashboard')) {
            throw new Error('SECURITY VIOLATION: Unauthenticated user opened /admin/dashboard directly!');
        }
        console.log(`  ✓ Unauthenticated /admin/dashboard safely intercepted and redirected to: ${urlDirect}`);

        // -------------------------------------------------------------
        // TEST B: FORGOT PASSWORD FULL RECOVERY LIFECYCLE
        // -------------------------------------------------------------
        console.log('\n--- TEST B: Forgot Password & Password Recovery Flow ---');
        // 1. Open User Login
        await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
        await delay(1000);

        // Click Forgot password? link
        const forgotLink = await page.$('#forgot-password-link');
        if (!forgotLink) throw new Error('#forgot-password-link not found on /login/user');
        await forgotLink.click();
        await delay(1000);

        const forgotUrl = page.url();
        if (!forgotUrl.includes('/forgot-password')) {
            throw new Error(`Expected /forgot-password, got ${forgotUrl}`);
        }
        console.log('  ✓ Navigated to /forgot-password.');

        // Step 1: Request OTP
        await page.type('#reset-email-input', TEST_USER_EMAIL);
        await page.click('#send-reset-code-btn');
        await delay(1500);

        // Verify Step 2 rendered
        await page.waitForSelector('#reset-otp-input', { visible: true, timeout: 5000 });
        console.log('  ✓ Step 2 (Enter Verification Code) displayed.');

        // Retrieve hashed OTP from DB and update to known OTP for verification test
        const targetResetRecord = await resetCol.findOne({ email: TEST_USER_EMAIL, used: false });
        if (!targetResetRecord) throw new Error('PasswordReset document not found in DB.');
        
        const testOtp = '839201';
        const otpHash = await bcrypt.hash(testOtp, 10);
        await resetCol.updateOne({ _id: targetResetRecord._id }, { $set: { otpHash } });

        // Step 2: Verify OTP
        await page.type('#reset-otp-input', testOtp);
        await page.click('#verify-otp-btn');
        await delay(1500);

        // Verify Step 3 rendered
        await page.waitForSelector('#reset-password-submit-btn', { visible: true, timeout: 5000 });
        console.log('  ✓ Step 3 (Set New Password) displayed.');

        // Step 3: Enter New Password
        const passwordInputs = await page.$$('input[placeholder*="password"]');
        if (passwordInputs.length < 2) throw new Error('Expected 2 password inputs in Step 3');
        await passwordInputs[0].type(UPDATED_PASSWORD);
        await passwordInputs[1].type(UPDATED_PASSWORD);
        await page.click('#reset-password-submit-btn');
        await delay(2000);

        // Verify Step 4 rendered
        await page.waitForSelector('#return-to-login-btn', { visible: true, timeout: 5000 });
        console.log('  ✓ Step 4 (Password Reset Complete) displayed.');

        // Click Return to Login
        await page.click('#return-to-login-btn');
        await delay(1000);

        // Verify Login with NEW password
        console.log('  Testing Login with NEW password in browser...');
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', TEST_USER_EMAIL);
        const loginPassInput = await page.$('input[placeholder*="Password"], input[type="password"]');
        await loginPassInput.type(UPDATED_PASSWORD);
        await page.click('button[type="submit"]');
        await delay(2000);

        const postLoginUrl = page.url();
        console.log(`  URL after login with new password: ${postLoginUrl}`);
        if (!postLoginUrl.includes('/user') && !postLoginUrl.includes('/location-setup')) {
            throw new Error(`Login failed with new password, ended at ${postLoginUrl}`);
        }
        console.log('  ✓ Login with NEW password succeeded in browser!');

        // -------------------------------------------------------------
        // TEST C: RESPONSIVE MOBILE VIEWPORT TESTING
        // -------------------------------------------------------------
        console.log('\n--- TEST C: Mobile Viewport Rendering ---');
        // Clear auth session so we test unauthenticated mobile views
        await page.evaluate(() => localStorage.clear());
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');

        // Mobile Chrome (412x915)
        await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
        await page.goto(`${FRONTEND_URL}/#/admin/login`, { waitUntil: 'networkidle2' });
        await delay(1000);
        const adminLoginFormMobile = await page.$('#admin-login-form');
        if (!adminLoginFormMobile) throw new Error('Admin login form not visible on mobile');
        console.log('  ✓ Admin Login responsive layout verified on Mobile Chrome (412x915).');

        // Mobile Safari (390x844)
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.goto(`${FRONTEND_URL}/#/forgot-password`, { waitUntil: 'networkidle2' });
        await delay(1000);
        const forgotFormMobile = await page.$('#request-reset-form');
        if (!forgotFormMobile) throw new Error('Forgot password form not visible on mobile');
        console.log('  ✓ Forgot Password responsive layout verified on Mobile Safari (390x844).');

        // Cleanup
        await usersCol.deleteOne({ email: TEST_USER_EMAIL });
        await resetCol.deleteMany({ email: TEST_USER_EMAIL });

        console.log('\n======================================================');
        console.log('✅ ALL BROWSER E2E TESTS COMPLETED & PASSED (100%)');
        console.log('======================================================\n');
    } catch (err) {
        console.error('\n❌ BROWSER TEST FAILED:', err);
        process.exit(1);
    } finally {
        await browser.close();
        await mongoose.disconnect();
        process.exit(0);
    }
}

runBrowserTests();
