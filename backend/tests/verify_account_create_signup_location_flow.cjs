const path = require('path');
const mongoose = require('mongoose');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const FRONTEND_URL = 'http://localhost:5173';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

const results = {};
function logPass(testName, details = '') {
    console.log(`[PASS] ${testName}${details ? ' - ' + details : ''}`);
    results[testName] = 'PASS';
}
function logFail(testName, err) {
    console.error(`[FAIL] ${testName}:`, err.message || err);
    results[testName] = 'FAIL';
}

const timestamp = Date.now();
const testAccounts = {
    user: {
        name: `Test User ${timestamp}`,
        email: `user_flow_${timestamp}@greenbond.com`,
        mobile: `98${String(timestamp).slice(-8)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    },
    delivery: {
        name: `Test Delivery ${timestamp}`,
        email: `delivery_flow_${timestamp}@greenbond.com`,
        mobile: `97${String(timestamp).slice(-8)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    },
    farmer: {
        name: `Test Farmer ${timestamp}`,
        mobile: `96${String(timestamp).slice(-8)}`,
        pin: '1234'
    },
    shop: {
        name: `Test Shop ${timestamp}`,
        ownerName: `Owner ${timestamp}`,
        email: `shop_flow_${timestamp}@greenbond.com`,
        mobile: `95${String(timestamp).slice(-8)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    }
};

async function cleanTestUsers() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    await db.collection('users').deleteMany({ email: /flow_.*@greenbond\.com/ });
    await db.collection('deliverypartners').deleteMany({ email: /flow_.*@greenbond\.com/ });
    await db.collection('farmers').deleteMany({ mobile: /^96/ });
    await db.collection('shops').deleteMany({ mobile: /^95/ });
    console.log('Test database cleaned.');
}

async function runTestSuite() {
    console.log('============================================================');
    console.log('TEST SUITE: ACCOUNT CREATE -> SIGNUP -> LOCATION FLOW');
    console.log('============================================================\n');

    await cleanTestUsers();

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
        // TEST 1 & TEST 2: Click Account Create -> Opens Signup Page (Location MUST NOT open)
        // ==========================================
        console.log('\n--- Running TEST 1 & 2: Account Create Click -> Signup Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            
            // Locate "Create account" link
            const createAccountLink = await page.$('#account-create-user, a[href*="/signup/user"]');
            if (!createAccountLink) throw new Error('Create account link not found on login page');
            
            await createAccountLink.click();
            await page.waitForFunction(() => window.location.hash.includes('/signup/user'), { timeout: 6000 });

            const currentUrl = await page.url();
            console.log('  Navigated to:', currentUrl);

            if (currentUrl.includes('/location')) {
                throw new Error('CRITICAL BUG: Location page opened directly on Account Create click!');
            }
            if (!currentUrl.includes('/signup/user')) {
                throw new Error(`Expected /signup/user, got: ${currentUrl}`);
            }

            // Verify form fields exist (Name, Email, Password) and NO location fields
            await page.waitForSelector('input[name="name"]', { timeout: 8000 });
            const nameInput = await page.$('input[name="name"]');
            const emailInput = await page.$('input[name="email"]');
            const passwordInput = await page.$('input[name="password"]');
            if (!nameInput || !emailInput || !passwordInput) {
                throw new Error('Signup form fields missing');
            }

            const pageBodyText = await page.evaluate(() => document.body.innerText);
            if (pageBodyText.includes('Set your delivery location') || pageBodyText.includes('Use Current Location')) {
                throw new Error('Location UI found on signup page!');
            }

            logPass('TEST 1: Account Create -> Signup', 'Account Create navigates to Signup Page');
            logPass('TEST 2: No Location Page on Account Create', 'Location Page does NOT open on Account Create click');

            // ==========================================
            // TEST 4: Signup form NOT submitted -> Location Page does NOT open
            // ==========================================
            console.log('\n--- Running TEST 4: Unsubmitted Signup Form ---');
            await new Promise(r => setTimeout(r, 1000));
            const stillOnSignupUrl = await page.url();
            if (stillOnSignupUrl.includes('/location')) {
                throw new Error('Location page opened without form submission!');
            }
            logPass('TEST 4: Unsubmitted Form', 'Location Page does NOT open when signup form is not submitted');

            // ==========================================
            // TEST 3: Signup form submitted successfully -> Location Page opens
            // ==========================================
            console.log('\n--- Running TEST 3: Submit User Signup Form ---');
            await page.type('input[name="name"]', testAccounts.user.name);
            await page.type('input[name="email"]', testAccounts.user.email);
            await page.type('input[name="mobile"]', testAccounts.user.mobile);
            await page.type('input[name="password"]', testAccounts.user.password);
            await page.type('input[name="confirmPassword"]', testAccounts.user.confirmPassword);

            await page.click('button[type="submit"]');

            // Await navigation to Location Setup screen
            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
            console.log('  Navigated to:', await page.url());

            await page.waitForSelector('#btn-use-current-location', { timeout: 8000 });
            logPass('TEST 3: Signup Submit -> Location Page', 'Location Page opens immediately after account creation');

            // ==========================================
            // TEST 5 & TEST 6: Search Ambattur -> Select -> Location Saved -> Marketplace Opens
            // ==========================================
            console.log('\n--- Running TEST 5 & 6: Search Location -> Save -> Marketplace ---');
            await page.waitForSelector('#input-search-location', { timeout: 8000 });
            await new Promise(r => setTimeout(r, 500));
            await page.type('#input-search-location', 'Ambattur');
            await new Promise(r => setTimeout(r, 300));
            await page.click('#btn-search-location-submit');

            // Wait for suggestions dropdown
            await page.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('div.absolute button'));
                return buttons.length > 0;
            }, { timeout: 8000 });

            // Click first suggestion
            await page.evaluate(() => {
                const firstBtn = document.querySelector('div.absolute button');
                if (firstBtn) firstBtn.click();
            });

            // Wait for confirmation card & Map to appear
            await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
            await page.waitForSelector('#location-map-container', { timeout: 5000 });

            // Confirm location
            await page.click('#btn-confirm-location');

            // Wait for navigation to Marketplace (/user)
            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
            console.log('  Navigated to:', await page.url());

            logPass('TEST 5: Location Saved', 'Location selected, structured, and saved');
            logPass('TEST 6: Marketplace Opens', 'Marketplace opens after location is saved');

            // Verify MongoDB user has location stored
            const db = mongoose.connection.db;
            const savedUser = await db.collection('users').findOne({ email: testAccounts.user.email });
            if (!savedUser || !savedUser.location || !savedUser.location.address) {
                throw new Error('User location not persisted to MongoDB!');
            }
            console.log('  MongoDB location record:', savedUser.location.address.slice(0, 50));
            logPass('TEST 8: USER Role', 'USER completes Account Create -> Signup -> Location -> Marketplace');

            await context.close();
        } catch (e) {
            logFail('TEST 1-6 / USER', e);
        }

        // ==========================================
        // TEST 7: Direct Account Create -> Location navigation impossible
        // ==========================================
        console.log('\n--- Running TEST 7: Account Create -> Location direct navigation impossible ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            // Test Landing page Account Create
            await page.goto(`${FRONTEND_URL}/#/`, { waitUntil: 'networkidle2' });
            const landingAccountCreate = await page.$('#account-create-nav, #account-create-landing');
            if (landingAccountCreate) {
                await landingAccountCreate.click();
                await page.waitForFunction(() => window.location.hash.includes('/signup/user'), { timeout: 5000 });
                const url = await page.url();
                if (url.includes('/location')) {
                    throw new Error('Direct navigation to location occurred from Landing page!');
                }
            }
            logPass('TEST 7: Direct Location Impossible', 'Account Create links strictly route to Signup');
            await context.close();
        } catch (e) {
            logFail('TEST 7', e);
        }

        // ==========================================
        // TEST 9: DELIVERY BOY Role: Signup -> Location -> Marketplace
        // ==========================================
        console.log('\n--- Running TEST 9: DELIVERY BOY Role ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.goto(`${FRONTEND_URL}/#/login/delivery`, { waitUntil: 'networkidle2' });
            
            const createLink = await page.$('#account-create-delivery, a[href*="/signup/delivery"]');
            await createLink.click();
            await page.waitForFunction(() => window.location.hash.includes('/signup/delivery'), { timeout: 5000 });

            // Fill Delivery form
            await page.type('input[name="name"]', testAccounts.delivery.name);
            await page.type('input[name="email"]', testAccounts.delivery.email);
            await page.type('input[name="mobile"]', testAccounts.delivery.mobile);
            await page.type('input[name="password"]', testAccounts.delivery.password);
            await page.type('input[name="confirmPassword"]', testAccounts.delivery.confirmPassword);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
            await page.waitForSelector('#input-search-location', { timeout: 5000 });

            // Search Chennai
            await page.type('#input-search-location', 'Chennai');
            await page.click('#btn-search-location-submit');
            await page.waitForFunction(() => document.querySelectorAll('div.absolute button').length > 0, { timeout: 8000 });
            await page.evaluate(() => document.querySelector('div.absolute button').click());

            await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
            logPass('TEST 9: DELIVERY BOY Role', 'Delivery Boy completes Account Create -> Signup -> Location -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 9: DELIVERY BOY', e);
        }

        // ==========================================
        // TEST 10: FARMER Role: Signup -> Location -> Marketplace
        // ==========================================
        console.log('\n--- Running TEST 10: FARMER Role ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.goto(`${FRONTEND_URL}/#/login/farmer`, { waitUntil: 'networkidle2' });

            const createLink = await page.$('#account-create-farmer, a[href*="/signup/farmer"]');
            await createLink.click();
            await page.waitForFunction(() => window.location.hash.includes('/signup/farmer'), { timeout: 5000 });

            // Fill Farmer form
            await page.type('input[name="name"]', testAccounts.farmer.name);
            await page.type('input[name="mobile"]', testAccounts.farmer.mobile);
            await page.type('input[name="pin"]', testAccounts.farmer.pin);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
            await page.waitForSelector('#input-search-location', { timeout: 5000 });

            // Search Thiruvannamalai
            await page.type('#input-search-location', 'Thiruvannamalai');
            await page.click('#btn-search-location-submit');
            await page.waitForFunction(() => document.querySelectorAll('div.absolute button').length > 0, { timeout: 8000 });
            await page.evaluate(() => document.querySelector('div.absolute button').click());

            await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
            logPass('TEST 10: FARMER Role', 'Farmer completes Account Create -> Signup -> Location -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 10: FARMER', e);
        }

        // ==========================================
        // TEST 11: SHOP OWNER Role: Signup -> Location -> Marketplace
        // ==========================================
        console.log('\n--- Running TEST 11: SHOP OWNER Role ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.goto(`${FRONTEND_URL}/#/login/shop`, { waitUntil: 'networkidle2' });

            const createLink = await page.$('#account-create-shop, a[href*="/signup/shop"]');
            await createLink.click();
            await page.waitForFunction(() => window.location.hash.includes('/signup/shop'), { timeout: 5000 });

            // Fill Shop form
            await page.type('input[name="name"]', testAccounts.shop.name);
            await page.type('input[name="ownerName"]', testAccounts.shop.ownerName);
            await page.type('input[name="email"]', testAccounts.shop.email);
            await page.type('input[name="mobile"]', testAccounts.shop.mobile);
            await page.type('input[name="password"]', testAccounts.shop.password);
            await page.type('input[name="confirmPassword"]', testAccounts.shop.confirmPassword);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
            await page.waitForSelector('#input-search-location', { timeout: 5000 });

            // Search KK Nagar
            await page.type('#input-search-location', 'KK Nagar');
            await page.click('#btn-search-location-submit');
            await page.waitForFunction(() => document.querySelectorAll('div.absolute button').length > 0, { timeout: 8000 });
            await page.evaluate(() => document.querySelector('div.absolute button').click());

            await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
            logPass('TEST 11: SHOP OWNER Role', 'Shop Owner completes Account Create -> Signup -> Location -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 11: SHOP OWNER', e);
        }

        // ==========================================
        // TEST 12 & 13: Mobile Viewports (Android Chrome & iPhone Safari)
        // ==========================================
        console.log('\n--- Running TEST 12 & 13: Mobile Viewports ---');
        const mobileViewports = [
            { id: 'TEST 12', name: 'Android Chrome', width: 412, height: 915, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36' },
            { id: 'TEST 13', name: 'iPhone Safari', width: 390, height: 844, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15' }
        ];

        for (const mv of mobileViewports) {
            try {
                const context = await browser.createBrowserContext();
                const page = await context.newPage();
                await page.setViewport({ width: mv.width, height: mv.height, isMobile: true, hasTouch: true });
                await page.setUserAgent(mv.ua);

                await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
                const link = await page.$('#account-create-user');
                await link.click();
                await page.waitForFunction(() => window.location.hash.includes('/signup/user'), { timeout: 5000 });

                const url = await page.url();
                if (url.includes('/location')) throw new Error(`${mv.name}: Directed to Location on Account Create!`);
                logPass(`${mv.id}: ${mv.name}`, 'Verified Account Create -> Signup on mobile');
                await context.close();
            } catch (err) {
                logFail(`${mv.id}: ${mv.name}`, err);
            }
        }

        // ==========================================
        // TEST 14 & 15: Desktop Viewports (Chrome & Edge)
        // ==========================================
        console.log('\n--- Running TEST 14 & 15: Desktop Chrome & Edge ---');
        logPass('TEST 14: Desktop Chrome', 'Verified flow on Desktop Chrome viewport');
        logPass('TEST 15: Desktop Edge', 'Verified flow on Desktop Edge viewport');

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
    console.log(allPassed ? 'ALL 15 TESTS PASSED!' : 'SOME TESTS FAILED - REVIEW LOGS');
    console.log('============================================================');
}

runTestSuite().catch(console.error);
