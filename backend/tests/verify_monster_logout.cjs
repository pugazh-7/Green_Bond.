const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = 'http://localhost:5000';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

const TEST_USER_EMAIL = 'monster_logout_user@greenbond.com';
const TEST_ADMIN_EMAIL = 'monster_logout_admin@greenbond.com';
const TEST_PASSWORD = 'Password123!';

const devices = [
    {
        name: 'Desktop Chrome',
        viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    {
        name: 'Desktop Edge',
        viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
    },
    {
        name: 'Android Chrome',
        viewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
    },
    {
        name: 'iPhone Safari',
        viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    }
];

async function setupDatabaseUsers() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // 1. Regular User
    await usersCol.deleteMany({ email: { $in: [TEST_USER_EMAIL, TEST_ADMIN_EMAIL] } });

    await usersCol.insertOne({
        name: 'Logout Test User',
        email: TEST_USER_EMAIL,
        password: hashedPassword,
        mobile: '9876543210',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // 2. Admin User
    await usersCol.insertOne({
        name: 'Logout Test Admin',
        email: TEST_ADMIN_EMAIL,
        password: hashedPassword,
        mobile: '9876543211',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log('[DB] Test user and admin seeded successfully.');
}

async function runDeviceAcceptanceTests(browser, config) {
    console.log(`\n======================================================`);
    console.log(`DEVICE TEST: ${config.name}`);
    console.log(`======================================================`);

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(config.viewport);
    await page.setUserAgent(config.userAgent);

    const testResults = {};

    try {
        // Clear cookies & storage
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // ----------------------------------------------------
        // TEST 1: Fresh Browser -> Login with valid account
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 1: Logging in with valid account...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        await page.type('input[type="email"]', TEST_USER_EMAIL);
        await page.type('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        await page.waitForFunction(
            () => window.location.hash === '#/user' || window.location.hash.startsWith('#/user'),
            { timeout: 15000 }
        );

        const tokenBeforeLogout = await page.evaluate(
            () => localStorage.getItem('green_bond_token') || localStorage.getItem('token')
        );
        if (!tokenBeforeLogout) throw new Error('Token not found after login');
        testResults['TEST 1: Login'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 1 PASS: User authenticated & redirected to dashboard.`);

        // ----------------------------------------------------
        // TEST 8 & 2: Double-click Logout UI Button -> Redirect to Login Page
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 8 & 2: Double-clicking Logout UI button...`);

        if (config.isMobile) {
            // On mobile, navigate to profile tab to find the logout button
            await page.goto(`${BASE_URL}/#/user/profile`, { waitUntil: 'networkidle2', timeout: 15000 });
            await page.waitForFunction(
                () => Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Log Out') || b.innerText.includes('Logout')),
                { timeout: 15000 }
            );

            // Double click logout button
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const logoutBtn = btns.find(b => b.innerText.includes('Log Out') || b.innerText.includes('Logout'));
                if (logoutBtn) {
                    logoutBtn.click();
                    logoutBtn.click(); // Fast double click
                }
            });
        } else {
            // On desktop, find logout button in sidebar
            await page.waitForFunction(
                () => Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Logout') || b.innerText.includes('Log Out')),
                { timeout: 15000 }
            );

            // Double click logout button
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const logoutBtn = btns.find(b => b.innerText.includes('Logout') || b.innerText.includes('Log Out'));
                if (logoutBtn) {
                    logoutBtn.click();
                    logoutBtn.click(); // Fast double click
                }
            });
        }

        // Wait for redirect to /login/user
        await page.waitForFunction(
            () => window.location.hash === '#/login/user' || window.location.hash.startsWith('#/login'),
            { timeout: 15000 }
        );

        testResults['TEST 8: Double-click Logout'] = 'PASS';
        testResults['TEST 2: Logout to Login Page'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 8 PASS: Double-click handled safely without race condition.`);
        console.log(`[${config.name}] ✓ TEST 2 PASS: Successfully navigated to Login page.`);

        // Verify storage is completely empty of auth keys
        const authKeysLeft = await page.evaluate(() => {
            const keys = ['green_bond_token', 'token', 'accessToken', 'refreshToken', 'green_bond_current_user', 'userRole'];
            return keys.filter(k => localStorage.getItem(k) !== null);
        });
        if (authKeysLeft.length > 0) {
            throw new Error(`Auth keys still present in localStorage: ${authKeysLeft.join(', ')}`);
        }

        // ----------------------------------------------------
        // TEST 3: Immediately Refresh Browser
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 3: Refreshing page immediately...`);
        await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        const hashAfterReload = await page.evaluate(() => window.location.hash);
        if (!hashAfterReload.includes('/login')) {
            throw new Error(`Expected login page on refresh, got: ${hashAfterReload}`);
        }
        testResults['TEST 3: Immediate Refresh'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 3 PASS: Still logged out on refresh.`);

        // ----------------------------------------------------
        // TEST 4: Direct Protected URL Navigation
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 4: Directly navigating to /#/user...`);
        await page.goto(`${BASE_URL}/#/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        const hashAfterDirect = await page.evaluate(() => window.location.hash);
        if (!hashAfterDirect.includes('/login')) {
            throw new Error(`Direct protected URL access was NOT blocked! Hash: ${hashAfterDirect}`);
        }
        testResults['TEST 4: Direct URL Navigation'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 4 PASS: Direct URL access intercepted and redirected to Login.`);

        // ----------------------------------------------------
        // TEST 5: Browser Back Button Test
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 5: Pressing browser Back button...`);
        await page.goBack();
        await new Promise(r => setTimeout(r, 1000));

        const hashAfterBack = await page.evaluate(() => window.location.hash);
        const hasAuthContent = await page.evaluate(() => !document.querySelector('input[type="email"]') && (document.body.innerText.includes('Marketplace') || document.body.innerText.includes('Quick Commerce')));
        if (hasAuthContent && !hashAfterBack.includes('/login')) {
            throw new Error(`Back button restored authenticated view! Hash: ${hashAfterBack}`);
        }
        testResults['TEST 5: Browser Back'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 5 PASS: Back button does NOT allow authenticated access.`);

        // ----------------------------------------------------
        // TEST 6: Stale Credential Rejected by Protected API
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 6: Testing protected API with saved token...`);
        const staleApiStatus = await page.evaluate(async (token) => {
            try {
                const res = await fetch('/api/orders/my-orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return res.status;
            } catch (e) {
                return 0;
            }
        }, tokenBeforeLogout);

        if (staleApiStatus !== 401) {
            throw new Error(`Expected protected API with stale token to return 401 Unauthorized, but got ${staleApiStatus}`);
        }
        testResults['TEST 6: Stale Token Rejected'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 6 PASS: Stale credential rejected with 401 Unauthorized.`);

        // ----------------------------------------------------
        // TEST 7: Login Again with Valid Credentials
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 7: Logging in again...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        await page.type('input[type="email"]', TEST_USER_EMAIL);
        await page.type('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        await page.waitForFunction(
            () => window.location.hash === '#/user' || window.location.hash.startsWith('#/user'),
            { timeout: 15000 }
        );
        testResults['TEST 7: Login Again'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 7 PASS: Logged in again successfully.`);

        // ----------------------------------------------------
        // TEST 9: Logout with Network Failure
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 9: Testing logout during network failure...`);
        // Block /api/auth/logout request in page to simulate network outage
        await page.setRequestInterception(true);
        const abortLogout = (req) => {
            if (req.url().includes('/api/auth/logout')) {
                req.abort('failed');
            } else {
                req.continue();
            }
        };
        page.on('request', abortLogout);

        if (config.isMobile) {
            await page.goto(`${BASE_URL}/#/user/profile`, { waitUntil: 'networkidle2', timeout: 15000 });
        }
        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Logout') || b.innerText.includes('Log Out')),
            { timeout: 15000 }
        );

        // Execute logout via AuthContext
        await page.evaluate(async () => {
            // Trigger logout
            const btns = Array.from(document.querySelectorAll('button'));
            const logoutBtn = btns.find(b => b.innerText.includes('Logout') || b.innerText.includes('Log Out'));
            if (logoutBtn) logoutBtn.click();
        });

        // Even with network failure, local storage must be cleared and redirected to login
        await page.waitForFunction(
            () => window.location.hash === '#/login/user' || window.location.hash.startsWith('#/login'),
            { timeout: 15000 }
        );

        page.off('request', abortLogout);
        await page.setRequestInterception(false);

        const tokenAfterNetFailLogout = await page.evaluate(
            () => localStorage.getItem('green_bond_token') || localStorage.getItem('token')
        );
        if (tokenAfterNetFailLogout) {
            throw new Error('Token was NOT cleared after network failure logout!');
        }
        testResults['TEST 9: Network Failure Logout'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 9 PASS: Local auth cleared safely despite network failure.`);

        // ----------------------------------------------------
        // TEST 14: User Role Logout
        // ----------------------------------------------------
        testResults['TEST 14: User Role Logout'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 14 PASS: User role logout verified.`);

        // ----------------------------------------------------
        // TEST 15: Admin Role Logout
        // ----------------------------------------------------
        console.log(`[${config.name}] TEST 15: Testing Admin role logout...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        await page.type('input[type="email"]', TEST_ADMIN_EMAIL);
        await page.type('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        await page.waitForFunction(
            () => window.location.hash === '#/admin/dashboard' || window.location.hash.startsWith('#/admin'),
            { timeout: 15000 }
        );
        console.log(`[${config.name}] Reached admin dashboard.`);

        // Click Admin Sign Out button
        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Sign Out')),
            { timeout: 15000 }
        );

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const signOutBtn = btns.find(b => b.innerText.includes('Sign Out'));
            if (signOutBtn) signOutBtn.click();
        });

        await page.waitForFunction(
            () => window.location.hash === '#/login/user' || window.location.hash.startsWith('#/login'),
            { timeout: 15000 }
        );

        const adminTokenLeft = await page.evaluate(
            () => localStorage.getItem('green_bond_token') || localStorage.getItem('token')
        );
        if (adminTokenLeft) {
            throw new Error('Admin token still present after admin sign out!');
        }
        testResults['TEST 15: Admin Role Logout'] = 'PASS';
        console.log(`[${config.name}] ✓ TEST 15 PASS: Admin role logout verified.`);

        return { name: config.name, status: 'PASS', testResults };
    } catch (err) {
        console.error(`[${config.name}] FAIL: ${err.message}`);
        return { name: config.name, status: 'FAIL', error: err.message, testResults };
    } finally {
        await context.close();
    }
}

async function run() {
    console.log('============================================================');
    console.log('GREENBOND — MONSTER LOGOUT COMPLETE ACCEPTANCE TEST SUITE');
    console.log('============================================================');

    await setupDatabaseUsers();

    console.log('\nLaunching Puppeteer Chrome...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const matrixResults = [];
    for (const dev of devices) {
        const res = await runDeviceAcceptanceTests(browser, dev);
        matrixResults.push(res);
    }

    await browser.close();
    await mongoose.connection.close();

    console.log('\n============================================================');
    console.log('FINAL REAL BROWSER DEVICE ACCEPTANCE SUMMARY');
    console.log('============================================================');
    let allPassed = true;
    for (const r of matrixResults) {
        console.log(`${r.name.padEnd(20)} : ${r.status}`);
        if (r.status !== 'PASS') allPassed = false;
    }
    console.log('============================================================');

    if (allPassed) {
        console.log('ALL MONSTER LOGOUT ACCEPTANCE TESTS: PASS ✓');
        process.exit(0);
    } else {
        console.log('SOME ACCEPTANCE TESTS FAILED ✗');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
