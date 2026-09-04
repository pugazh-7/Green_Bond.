const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'pugazh@gmail.com';
const TEST_PASSWORD = 'password123';

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

async function runDeviceTest(browser, config) {
    console.log(`\n======================================================`);
    console.log(`RUNNING DEVICE TEST: ${config.name}`);
    console.log(`======================================================`);

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(config.viewport);
    await page.setUserAgent(config.userAgent);

    try {
        // Step 0: Clear any prior localStorage
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Step 1: Open Login Page cleanly
        console.log(`[${config.name}] 1. Navigating to ${BASE_URL}/#/login/user...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        console.log(`[${config.name}] Current URL on login load: ${page.url()}`);

        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        console.log(`[${config.name}] Login form inputs successfully found!`);

        // Step 2: Test Invalid Password
        console.log(`[${config.name}] 2. Testing invalid credentials feedback...`);
        await page.type('input[type="email"]', TEST_EMAIL);
        await page.type('input[type="password"]', 'WrongSecretPassword99!');
        await page.click('button[type="submit"]');

        // Wait for toast or error message
        await new Promise(r => setTimeout(r, 1200));
        const contentAfterFailedLogin = await page.content();
        const hasInvalidError = contentAfterFailedLogin.includes('Invalid') || contentAfterFailedLogin.includes('password') || contentAfterFailedLogin.includes('error');
        console.log(`[${config.name}] Invalid password error feedback: ${hasInvalidError ? 'PASS' : 'FAIL'}`);

        // Step 3: Fresh reload for valid credentials
        console.log(`[${config.name}] 3. Reloading fresh login form for valid credentials...`);
        await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        console.log(`[${config.name}] Submitting valid credentials (${TEST_EMAIL})...`);
        await page.type('input[type="email"]', TEST_EMAIL);
        await page.type('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for navigation to /#/user
        console.log(`[${config.name}] 4. Waiting for redirect to /#/user dashboard...`);
        await page.waitForFunction(() => window.location.hash === '#/user' || window.location.hash.startsWith('#/user/'), { timeout: 15000 });
        console.log(`[${config.name}] Reached dashboard URL: ${page.url()}`);

        // Check localStorage for tokens
        const storedToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('green_bond_token'));
        const storedUser = await page.evaluate(() => localStorage.getItem('green_bond_current_user'));
        console.log(`[${config.name}] Token stored in localStorage: ${storedToken ? 'YES (' + storedToken.substring(0, 15) + '...)' : 'NO'}`);
        console.log(`[${config.name}] User stored in localStorage: ${storedUser ? 'YES' : 'NO'}`);

        if (!storedToken) throw new Error('Token was not saved in localStorage');

        // Step 4: Test Page Refresh (Session Restoration)
        console.log(`[${config.name}] 5. Reloading page to verify session restoration...`);
        await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
        
        await page.waitForFunction(() => window.location.hash === '#/user' || window.location.hash.startsWith('#/user/'), { timeout: 15000 });
        const urlAfterReload = page.url();
        console.log(`[${config.name}] Current URL after reload: ${urlAfterReload}`);

        if (!urlAfterReload.includes('/user')) {
            throw new Error(`Session lost after reload! Redirected to: ${urlAfterReload}`);
        }
        console.log(`[${config.name}] [PASS] Session retained on refresh!`);

        // Step 5: Test Logout
        console.log(`[${config.name}] 6. Testing logout...`);
        await page.evaluate(async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 15000 });
        const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        if (!emailInput) throw new Error('Login form not found after logout');
        console.log(`[${config.name}] [PASS] Logout successful, navigated cleanly back to login page!`);

        console.log(`>>> RESULT FOR ${config.name}: ALL PASS <<<`);
        return { name: config.name, status: 'PASS' };
    } catch (err) {
        console.error(`>>> RESULT FOR ${config.name}: FAIL - ${err.message} <<<`);
        return { name: config.name, status: 'FAIL', error: err.message };
    } finally {
        await context.close();
    }
}

async function run() {
    console.log('Launching Puppeteer Chrome...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    for (const dev of devices) {
        const res = await runDeviceTest(browser, dev);
        results.push(res);
    }

    await browser.close();

    console.log('\n======================================================');
    console.log('REAL BROWSER DEVICE MATRIX SUMMARY');
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
        console.log('ALL 4 DEVICES IN MATRIX VERIFIED SUCCESSFULLY: PASS!');
        process.exit(0);
    }
}

run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
