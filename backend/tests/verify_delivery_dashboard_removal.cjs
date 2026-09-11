const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const FRONTEND_URL = 'http://localhost:5173';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

const TEST_USER = {
    email: 'user_sidebar_test@greenbond.com',
    password: 'Password123!',
    mobile: '9870001122'
};

const TEST_DELIVERY = {
    email: 'delivery_sidebar_test@greenbond.com',
    password: 'Password123!',
    mobile: '9870001133'
};

const results = {};

function logPass(testName, details = '') {
    console.log(`[PASS] ${testName}${details ? ' - ' + details : ''}`);
    results[testName] = 'PASS';
}

function logFail(testName, err) {
    console.error(`[FAIL] ${testName}:`, err.message || err);
    results[testName] = 'FAIL';
}

async function setupUsers() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Setup normal user with location
    await db.collection('users').deleteMany({ email: TEST_USER.email });
    await db.collection('users').insertOne({
        name: 'Regular User',
        email: TEST_USER.email,
        mobile: TEST_USER.mobile,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        location: {
            lat: 13.0827,
            lng: 80.2707,
            address: 'Chennai, Tamil Nadu'
        },
        locationGeo: {
            type: 'Point',
            coordinates: [80.2707, 13.0827]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogoutAt: null
    });

    // 2. Setup delivery boy with location
    await db.collection('deliverypartners').deleteMany({ email: TEST_DELIVERY.email });
    await db.collection('deliverypartners').insertOne({
        name: 'Delivery Partner',
        email: TEST_DELIVERY.email,
        mobile: TEST_DELIVERY.mobile,
        password: hashedPassword,
        role: 'delivery',
        status: 'Available',
        location: {
            lat: 13.0827,
            lng: 80.2707,
            address: 'Chennai, Tamil Nadu'
        },
        locationGeo: {
            type: 'Point',
            coordinates: [80.2707, 13.0827]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogoutAt: null
    });

    console.log('Database users initialized.');
}

async function runTests() {
    console.log('============================================================');
    console.log('TEST SUITE: REMOVE DELIVERY DASHBOARD FROM NORMAL USER SIDEBAR');
    console.log('============================================================\n');

    await setupUsers();

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });

    try {
        // ==========================================
        // TEST 1: Login as normal USER -> Delivery Dashboard NOT visible
        // ==========================================
        console.log('\n--- Running TEST 1: Normal USER Sidebar ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
            await page.type('input[name="email"], input[type="email"]', TEST_USER.email);
            await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
            await page.waitForSelector('nav', { timeout: 5000 });

            const navText = await page.$eval('nav', el => el.innerText);
            console.log('  Nav items on screen:\n' + navText.split('\n').map(t => '    - ' + t).join('\n'));

            if (navText.includes('Delivery Dashboard')) {
                throw new Error('Delivery Dashboard found in normal USER sidebar!');
            }

            // Expected items
            const expectedItems = ['Marketplace', 'Orders', 'Bulk Orders', 'Wishlist', 'Cart', 'Account'];
            for (const item of expectedItems) {
                if (!navText.includes(item)) {
                    throw new Error(`Expected item "${item}" not found in sidebar`);
                }
            }

            logPass('TEST 1: Normal User Sidebar', 'Sidebar contains standard items and NO Delivery Dashboard');

            // ==========================================
            // TEST 3: Normal USER manually opens /delivery -> Access Denied / Redirect
            // ==========================================
            console.log('\n--- Running TEST 3: Route Protection (/delivery for User) ---');
            await page.goto(`${FRONTEND_URL}/#/delivery`, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));

            const redirectedHash = await page.evaluate(() => window.location.hash);
            console.log('  Current URL hash after navigating to /#/delivery:', redirectedHash);
            if (redirectedHash.includes('/delivery')) {
                throw new Error('Normal user was allowed to access /delivery!');
            }
            if (!redirectedHash.includes('/user')) {
                throw new Error(`Expected redirect to /user, got: ${redirectedHash}`);
            }

            logPass('TEST 3: Route Protection', 'Normal user blocked from /delivery and redirected to /user');

            // ==========================================
            // TEST 5: Normal User Logout
            // ==========================================
            console.log('\n--- Running TEST 5: Normal User Logout ---');
            const logoutClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.innerText.includes('Logout'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (!logoutClicked) throw new Error('Logout button not found');

            await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 8000 });
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 5000 });
            const token = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
            if (token) throw new Error('Token still present after logout refresh');

            logPass('TEST 5: Logout', 'User successfully logged out, persists after refresh');
            await context.close();
        } catch (e) {
            logFail('TEST 1 / 3 / 5', e);
        }

        // ==========================================
        // TEST 2 & TEST 4: Login as DELIVERY BOY -> Delivery Dashboard available
        // ==========================================
        console.log('\n--- Running TEST 2 & 4: Delivery Boy Login and Dashboard ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/delivery`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
            await page.type('input[name="email"], input[type="email"]', TEST_DELIVERY.email);
            await page.type('input[name="password"], input[type="password"]', TEST_DELIVERY.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/delivery'), { timeout: 10000 });
            console.log('  Navigated to /delivery after delivery boy login');

            await page.waitForFunction(
                () => document.body && document.body.innerText.includes('Delivery Dashboard'),
                { timeout: 10000 }
            );

            logPass('TEST 2: Delivery Boy Login', 'Delivery boy logs in directly to /delivery');
            logPass('TEST 4: Delivery Dashboard Available', 'Delivery Dashboard works normally for Delivery Boy');
            await context.close();
        } catch (e) {
            logFail('TEST 2 / 4: Delivery Boy Dashboard', e);
        }

        // ==========================================
        // TEST 6: Mobile User Dashboard (Android & iPhone Viewports)
        // ==========================================
        console.log('\n--- Running TEST 6: Mobile User Dashboard ---');
        const mobileViewports = [
            { name: 'Android Chrome', width: 412, height: 915, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36' },
            { name: 'iPhone Safari', width: 390, height: 844, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15' }
        ];

        for (const mv of mobileViewports) {
            try {
                const context = await browser.createBrowserContext();
                const page = await context.newPage();
                await page.setViewport({ width: mv.width, height: mv.height, isMobile: true, hasTouch: true });
                await page.setUserAgent(mv.ua);

                await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
                await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
                await page.type('input[name="email"], input[type="email"]', TEST_USER.email);
                await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
                await page.click('button[type="submit"]');

                await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });

                // Open mobile sidebar
                const hamburgerBtn = await page.$('button svg path[d="M4 6h16M4 12h16M4 18h16"]');
                if (hamburgerBtn) {
                    await hamburgerBtn.click();
                    await new Promise(r => setTimeout(r, 500));
                }

                await page.waitForSelector('nav', { timeout: 5000 });
                const navText = await page.$eval('nav', el => el.innerText);
                if (navText.includes('Delivery Dashboard')) {
                    throw new Error(`Delivery Dashboard found in ${mv.name} sidebar!`);
                }
                console.log(`  ${mv.name}: No Delivery Dashboard in sidebar (clean standard menu verified).`);
                await context.close();
            } catch (e) {
                throw new Error(`${mv.name} failed: ${e.message}`);
            }
        }
        logPass('TEST 6: Mobile User Dashboard', 'Verified clean sidebar on Android Chrome & iPhone Safari');

    } finally {
        await browser.close();
        await mongoose.disconnect();
    }

    console.log('\n============================================================');
    console.log('SUMMARY OF RESULTS');
    console.log('============================================================');
    let allPassed = true;
    for (const [test, status] of Object.entries(results)) {
        console.log(`${test}: ${status}`);
        if (status !== 'PASS') allPassed = false;
    }
    console.log('============================================================');
    console.log(allPassed ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED - REVIEW LOGS');
    console.log('============================================================');
}

runTests().catch(console.error);
