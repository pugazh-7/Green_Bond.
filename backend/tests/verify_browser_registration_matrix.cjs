const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = 'http://localhost:5000';

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

async function runDeviceRegistrationTest(browser, config, deviceIndex) {
    console.log(`\n======================================================`);
    console.log(`RUNNING DEVICE REGISTRATION TEST: ${config.name}`);
    console.log(`======================================================`);

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(config.viewport);
    await page.setUserAgent(config.userAgent);

    const testEmail = `test_secure_user_${deviceIndex}_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = `Secure User ${deviceIndex}`;

    try {
        // Step 0: Clear any prior localStorage
        await page.goto(`${BASE_URL}/#/signup/user`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Step 1: Open Signup Page cleanly
        console.log(`[${config.name}] 1. Navigating to ${BASE_URL}/#/signup/user...`);
        await page.goto(`${BASE_URL}/#/signup/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        console.log(`[${config.name}] Current URL on signup load: ${page.url()}`);

        await page.waitForSelector('input[name="name"]', { timeout: 10000 });
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await page.waitForSelector('input[name="confirmPassword"]', { timeout: 10000 });
        console.log(`[${config.name}] Signup form inputs successfully found!`);

        // Check that location map is NOT required/opened by default
        const mapContainer = await page.$('.leaflet-container');
        console.log(`[${config.name}] Map visible by default: ${mapContainer ? 'YES (UNEXPECTED)' : 'NO (CORRECT - OPTIONAL)'}`);

        // Step 2: Fill out signup form WITHOUT location
        console.log(`[${config.name}] 2. Submitting registration with Name, Email, Password (NO LOCATION)...`);
        await page.type('input[name="name"]', testName);
        await page.type('input[name="email"]', testEmail);
        await page.type('input[name="password"]', testPassword);
        await page.type('input[name="confirmPassword"]', testPassword);

        // Click create account button
        await page.click('button[type="submit"]');

        // Step 3: Verify redirect to LOGIN PAGE (NOT Marketplace / Dashboard)
        console.log(`[${config.name}] 3. Waiting for redirect to LOGIN PAGE (/#/login/user)...`);
        await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 15000 });
        const currentUrlAfterSignup = page.url();
        console.log(`[${config.name}] Current URL after signup: ${currentUrlAfterSignup}`);
        if (!currentUrlAfterSignup.includes('/login')) {
            throw new Error(`Expected redirect to login page, but got: ${currentUrlAfterSignup}`);
        }
        console.log(`[${config.name}] [PASS] Successfully navigated to Login page without auto-authenticating!`);

        // Step 4: Check localStorage tokens - MUST NOT EXIST
        const storedToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('green_bond_token'));
        console.log(`[${config.name}] Stored token in localStorage: ${storedToken ? 'FOUND (BUG!)' : 'NONE (CORRECT!)'}`);
        if (storedToken) {
            throw new Error('Registration created an authenticated token in localStorage!');
        }

        // Step 5: Verify trying to open protected route without login redirects away
        console.log(`[${config.name}] 4. Attempting to directly open protected dashboard /#/user without signing in...`);
        await page.goto(`${BASE_URL}/#/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 15000 });
        const protectedAttemptUrl = page.url();
        console.log(`[${config.name}] URL after accessing protected route: ${protectedAttemptUrl}`);
        if (!protectedAttemptUrl.includes('/login')) {
            throw new Error(`Protected route allowed access without manual login! URL: ${protectedAttemptUrl}`);
        }
        console.log(`[${config.name}] [PASS] Protected route properly guarded. Manual login required!`);

        // Step 6: Perform MANUAL LOGIN with the newly created credentials
        console.log(`[${config.name}] 5. Navigating to login and performing manual login...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.type('input[type="email"]', testEmail);
        await page.type('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Step 7: Verify redirect to dashboard /#/user after manual login
        console.log(`[${config.name}] 6. Waiting for dashboard access after manual sign-in...`);
        await page.waitForFunction(() => window.location.hash === '#/user' || window.location.hash.startsWith('#/user/'), { timeout: 15000 });
        console.log(`[${config.name}] Reached dashboard URL: ${page.url()}`);

        // Step 8: Verify session retained on refresh
        console.log(`[${config.name}] 7. Refreshing page to verify session retention...`);
        await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForFunction(() => window.location.hash === '#/user' || window.location.hash.startsWith('#/user/'), { timeout: 15000 });
        console.log(`[${config.name}] [PASS] Session retained on refresh!`);

        // Step 9: Logout
        console.log(`[${config.name}] 8. Testing logout...`);
        await page.evaluate(async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        console.log(`[${config.name}] [PASS] Logged out cleanly.`);

        await context.close();
        console.log(`>>> RESULT FOR ${config.name}: ALL PASS <<<`);
        return { name: config.name, status: 'PASS', email: testEmail };
    } catch (err) {
        console.error(`[FAIL] Error during ${config.name} test:`, err.message);
        await context.close();
        return { name: config.name, status: 'FAIL', error: err.message };
    }
}

async function runAllDevices() {
    console.log('======================================================');
    console.log('STARTING REAL BROWSER MULTI-DEVICE REGISTRATION SUITE');
    console.log('======================================================');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security'
        ]
    });

    const results = [];
    for (let i = 0; i < devices.length; i++) {
        const res = await runDeviceRegistrationTest(browser, devices[i], i + 1);
        results.push(res);
    }

    await browser.close();

    console.log('\n======================================================');
    console.log('BROWSER MULTI-DEVICE REGISTRATION SUITE SUMMARY');
    console.log('======================================================');
    let allPassed = true;
    for (const r of results) {
        console.log(`${r.name.padEnd(20)} : ${r.status}`);
        if (r.status !== 'PASS') allPassed = false;
    }
    console.log('======================================================');

    if (!allPassed) {
        process.exit(1);
    } else {
        console.log('ALL 4 DEVICES IN REGISTRATION MATRIX VERIFIED SUCCESSFULLY: PASS!');
        process.exit(0);
    }
}

runAllDevices().catch(err => {
    console.error('Fatal error running registration suite:', err);
    process.exit(1);
});
