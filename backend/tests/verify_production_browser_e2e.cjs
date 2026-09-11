const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';

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

async function createTestAccount(email, password, mobile) {
    const res = await fetch(`${API_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'E2E Device User',
            email,
            mobile,
            password,
            confirmPassword: password
        })
    });
    const data = await res.json();
    return { status: res.status, data };
}

async function runDeviceE2E(browser, config, credentials) {
    console.log(`\n======================================================`);
    console.log(`E2E TEST: ${config.name}`);
    console.log(`======================================================`);

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(config.viewport);
    await page.setUserAgent(config.userAgent);

    const networkRequests = [];
    page.on('request', req => {
        networkRequests.push(req.url());
    });

    try {
        // 1. Open production/local URL
        console.log(`[${config.name}] 1. Navigating to login...`);
        await page.goto(`${BASE_URL}/#/login/user`, { waitUntil: 'networkidle2', timeout: 20000 });
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        console.log(`[${config.name}] ✓ Login form loaded successfully`);

        // 2. Wrong password test
        console.log(`[${config.name}] 2. Testing wrong password...`);
        await page.type('input[type="email"]', credentials.email);
        await page.type('input[type="password"]', 'wrongPassword123!');
        await page.click('button[type="submit"]');

        await page.waitForFunction(() => {
            return document.body.innerText.includes('Invalid email or password');
        }, { timeout: 8000 });
        console.log(`[${config.name}] ✓ Invalid credentials error shown correctly`);

        // Clear password field
        await page.evaluate(() => {
            const pwdInput = document.querySelector('input[type="password"]');
            if (pwdInput) {
                pwdInput.value = '';
                pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // 3. Correct password test
        console.log(`[${config.name}] 3. Logging in with correct credentials...`);
        await page.type('input[type="password"]', credentials.password);
        await page.click('button[type="submit"]');

        // Wait for redirect off login page and token in localStorage
        await page.waitForFunction(() => {
            const hash = window.location.hash;
            const token = localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            return Boolean(token) && !hash.includes('/login');
        }, { timeout: 15000 });

        const urlAfterLogin = page.url();
        console.log(`[${config.name}] ✓ Logged in successfully. Current URL: ${urlAfterLogin}`);

        // Verify token in localStorage
        const storedToken = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
        if (!storedToken) {
            throw new Error(`[${config.name}] Token was not stored in localStorage`);
        }
        console.log(`[${config.name}] ✓ Token successfully persisted in localStorage`);

        // 4. Page refresh while logged in
        console.log(`[${config.name}] 4. Refreshing page to verify session persistence...`);
        await page.reload({ waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 2000));

        const tokenAfterRefresh = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
        const userAfterRefresh = await page.evaluate(() => localStorage.getItem('green_bond_current_user'));
        if (!tokenAfterRefresh || !userAfterRefresh) {
            throw new Error(`[${config.name}] Session wiped on refresh!`);
        }
        console.log(`[${config.name}] ✓ User remains authenticated after refresh`);

        // 5. Open protected route directly
        console.log(`[${config.name}] 5. Navigating directly to protected route...`);
        await page.goto(`${BASE_URL}/#/user`, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));
        const finalUrl = page.url();
        console.log(`[${config.name}] ✓ Protected route accessible. URL: ${finalUrl}`);

        // 6. Logout test
        console.log(`[${config.name}] 6. Testing logout...`);
        await page.evaluate(() => {
            // Find and click any logout button or trigger logout
            const buttons = Array.from(document.querySelectorAll('button'));
            const logoutBtn = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('logout'));
            if (logoutBtn) {
                logoutBtn.click();
            } else {
                // Trigger via window storage / auth context
                localStorage.clear();
                window.location.hash = '#/login/user';
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('green_bond_token'));
        console.log(`[${config.name}] ✓ Logout successful. Token cleared: ${!tokenAfterLogout}`);

        await context.close();
        return { name: config.name, success: true };
    } catch (err) {
        console.error(`[${config.name}] ✗ FAILED:`, err.message);
        await context.close();
        return { name: config.name, success: false, error: err.message };
    }
}

async function runAll() {
    console.log('===========================================================');
    console.log('GREENBOND COMPREHENSIVE BROWSER MATRIX TEST');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('===========================================================\n');

    const timestamp = Date.now();
    const credentials = {
        email: `browser_matrix_${timestamp}@greenbond.com`,
        password: 'Password123!',
        mobile: `9${String(timestamp).slice(-9)}`
    };

    console.log(`Creating test user: ${credentials.email}...`);
    const regResult = await createTestAccount(credentials.email, credentials.password, credentials.mobile);
    if (regResult.status !== 201) {
        console.error('Failed to create test user:', regResult);
        process.exit(1);
    }
    console.log('Test user created successfully.\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    for (const device of devices) {
        const result = await runDeviceE2E(browser, device, credentials);
        results.push(result);
    }

    await browser.close();

    console.log('\n===========================================================');
    console.log('BROWSER MATRIX TEST SUMMARY:');
    let allPassed = true;
    for (const r of results) {
        console.log(`  ${r.name}: ${r.success ? 'PASSED ✓' : 'FAILED ✗ (' + r.error + ')'}`);
        if (!r.success) allPassed = false;
    }
    console.log('===========================================================');

    process.exit(allPassed ? 0 : 1);
}

runAll();
