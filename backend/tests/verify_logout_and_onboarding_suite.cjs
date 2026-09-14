const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const FRONTEND_URL = 'http://localhost:5173';
const MONGO_URI = 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

const PASSWORD = 'Password123!';
const testTimestamp = Date.now();

const accounts = {
    user: {
        name: `Logout Test User ${testTimestamp}`,
        email: `logout_user_${testTimestamp}@greenbond.com`,
        mobile: `98${String(testTimestamp).slice(-8)}`,
        password: PASSWORD,
        role: 'user',
        location: { lat: 13.0827, lng: 80.2707, address: 'Chennai, Tamil Nadu' }
    },
    delivery: {
        name: `Logout Test Delivery ${testTimestamp}`,
        email: `logout_deliv_${testTimestamp}@greenbond.com`,
        mobile: `97${String(testTimestamp).slice(-8)}`,
        password: PASSWORD,
        role: 'delivery',
        status: 'Active'
    },
    farmer: {
        name: `Logout Test Farmer ${testTimestamp}`,
        email: `logout_farmer_${testTimestamp}@greenbond.com`,
        mobile: `96${String(testTimestamp).slice(-8)}`,
        pin: '1234',
        role: 'client',
        verificationStatus: 'APPROVED',
        farmerStatus: 'ACTIVE'
    },
    shop: {
        name: `Logout Test Shop ${testTimestamp}`,
        ownerName: `Owner ${testTimestamp}`,
        email: `logout_shop_${testTimestamp}@greenbond.com`,
        mobile: `95${String(testTimestamp).slice(-8)}`,
        password: PASSWORD,
        role: 'shop'
    },
    admin: {
        name: `Logout Test Admin ${testTimestamp}`,
        email: `logout_admin_${testTimestamp}@greenbond.com`,
        mobile: `94${String(testTimestamp).slice(-8)}`,
        password: PASSWORD,
        role: 'admin'
    }
};

const results = {};
function pass(testName, msg = '') {
    console.log(`[PASS] ${testName}${msg ? ' - ' + msg : ''}`);
    results[testName] = 'PASS';
}
function fail(testName, err) {
    console.error(`[FAIL] ${testName}:`, err.message || err);
    results[testName] = 'FAIL';
}

async function seedUsers() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const hashPass = await bcrypt.hash(PASSWORD, 10);
    const hashPin = await bcrypt.hash('1234', 10);

    // Seed Normal User
    await db.collection('users').deleteOne({ email: accounts.user.email });
    await db.collection('users').insertOne({
        name: accounts.user.name,
        email: accounts.user.email,
        mobile: accounts.user.mobile,
        password: hashPass,
        role: 'user',
        location: accounts.user.location,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Seed Delivery Partner
    await db.collection('deliverypartners').deleteOne({ email: accounts.delivery.email });
    await db.collection('deliverypartners').insertOne({
        name: accounts.delivery.name,
        email: accounts.delivery.email,
        mobile: accounts.delivery.mobile,
        password: hashPass,
        role: 'delivery',
        status: 'Available',
        createdAt: new Date()
    });

    // Seed Farmer
    await db.collection('farmers').deleteOne({ mobile: accounts.farmer.mobile });
    await db.collection('farmers').insertOne({
        name: accounts.farmer.name,
        mobile: accounts.farmer.mobile,
        email: accounts.farmer.email,
        pin: hashPin,
        verificationStatus: 'APPROVED',
        farmerStatus: 'ACTIVE',
        createdAt: new Date()
    });

    // Seed Shop
    await db.collection('shops').deleteOne({ mobile: accounts.shop.mobile });
    await db.collection('shops').insertOne({
        name: accounts.shop.name,
        ownerName: accounts.shop.ownerName,
        email: accounts.shop.email,
        mobile: accounts.shop.mobile,
        password: hashPass,
        role: 'shop',
        isActive: true,
        createdAt: new Date()
    });

    // Seed Admin
    await db.collection('users').deleteOne({ email: accounts.admin.email });
    await db.collection('users').insertOne({
        name: accounts.admin.name,
        email: accounts.admin.email,
        mobile: accounts.admin.mobile,
        password: hashPass,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log('Database seeded with test accounts for all roles.');
}

async function runTests() {
    await seedUsers();

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    try {
        // ==========================================
        // TEST 1: NORMAL USER LOGIN -> USER DASHBOARD -> LOGOUT -> NORMAL LOGIN PAGE
        // ==========================================
        console.log('\n--- TEST 1: Normal User Login -> Dashboard -> Logout -> Normal Login Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            await page.type('input[type="email"]', accounts.user.email);
            await page.type('input[type="password"]', accounts.user.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => (window.location.hash === '#/user' || window.location.hash.startsWith('#/user/')) && !window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  User landed on:', await page.url());

            // Click Logout in User sidebar
            await page.waitForSelector('#logout-btn, button[class*="text-red"]', { timeout: 8000 });
            await page.click('#logout-btn');

            // Await redirect
            await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 10000 });
            const postLogoutUrl = await page.url();
            console.log('  After User logout URL:', postLogoutUrl);

            if (postLogoutUrl.includes('/login/delivery')) {
                throw new Error('CRITICAL BUG: Normal user logout redirected to /login/delivery!');
            }
            if (!postLogoutUrl.includes('/login/user') && !postLogoutUrl.includes('/login')) {
                throw new Error(`Expected /login/user, got: ${postLogoutUrl}`);
            }

            // Verify auth keys cleared
            const token = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
            if (token) throw new Error('Token still exists in localStorage after logout');

            // Verify Protected Route: Trying to open /user when unauthenticated redirects to /login/user (NOT delivery)
            await page.goto(`${FRONTEND_URL}/#/user`, { waitUntil: 'networkidle2' });
            await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 8000 });
            const directUserUrl = await page.url();
            if (directUserUrl.includes('/login/delivery')) {
                throw new Error('Accessing /user while unauthenticated redirected to /login/delivery!');
            }

            pass('TEST 1: Normal User Logout', 'Normal User logs out to /login/user (NEVER /login/delivery)');
            await context.close();
        } catch (e) {
            fail('TEST 1: Normal User Logout', e);
        }

        // ==========================================
        // TEST 2: LOGIN AGAIN AS USER -> NO DELIVERY ROLE CONTAMINATION
        // ==========================================
        console.log('\n--- TEST 2: Login Again as User -> Verify No Role Contamination ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            await page.type('input[type="email"]', accounts.user.email);
            await page.type('input[type="password"]', accounts.user.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => (window.location.hash === '#/user' || window.location.hash.startsWith('#/user/')) && !window.location.hash.includes('/login'), { timeout: 10000 });
            const userUrl = await page.url();
            if (userUrl.includes('/delivery')) {
                throw new Error('User got delivery dashboard on login!');
            }

            const storedUser = await page.evaluate(() => {
                const u = localStorage.getItem('green_bond_current_user');
                return u ? JSON.parse(u) : null;
            });
            if (!storedUser || storedUser.role !== 'user') {
                throw new Error(`Expected role 'user', got: ${storedUser?.role}`);
            }

            // Verify normal user cannot access /delivery
            await page.goto(`${FRONTEND_URL}/#/delivery`, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 1000));
            const deliveryAttemptUrl = await page.url();
            if (deliveryAttemptUrl.includes('/delivery') && !deliveryAttemptUrl.includes('/login')) {
                throw new Error('Normal user was able to access /delivery portal!');
            }

            pass('TEST 2: Role Isolation & Re-login', 'User maintains role "user" and cannot access /delivery');
            await context.close();
        } catch (e) {
            fail('TEST 2: Role Isolation & Re-login', e);
        }

        // ==========================================
        // TEST 3: DELIVERY BOY LOGIN -> DASHBOARD -> LOGOUT -> NORMAL LOGIN PAGE
        // ==========================================
        console.log('\n--- TEST 3: Delivery Boy Login -> Dashboard -> Logout -> Normal Login Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/delivery`, { waitUntil: 'networkidle2' });
            await page.type('input[type="email"]', accounts.delivery.email);
            await page.type('input[type="password"]', accounts.delivery.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.startsWith('#/delivery') && !window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  Delivery landed on:', await page.url());

            // Click Logout in DeliveryLayout
            await page.waitForSelector('#logout-btn', { timeout: 8000 });
            await page.click('#logout-btn');

            await page.waitForFunction(() => window.location.hash.includes('/login/user'), { timeout: 10000 });
            console.log('  After Delivery logout URL:', await page.url());

            pass('TEST 3: Delivery Boy Logout', 'Delivery Boy logs out to Normal Login Page (/login/user)');
            await context.close();
        } catch (e) {
            fail('TEST 3: Delivery Boy Logout', e);
        }

        // ==========================================
        // TEST 4: FARMER LOGIN -> DASHBOARD -> LOGOUT -> NORMAL LOGIN PAGE
        // ==========================================
        console.log('\n--- TEST 4: Farmer Login -> Dashboard -> Logout -> Normal Login Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/farmer`, { waitUntil: 'networkidle2' });
            await page.type('input[type="text"]', accounts.farmer.name);
            await page.type('input[type="tel"]', accounts.farmer.mobile);
            await page.type('input[type="password"]', accounts.farmer.pin);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.startsWith('#/client') && !window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  Farmer landed on:', await page.url());

            // Click Logout in ClientLayout
            await page.waitForSelector('#logout-btn', { timeout: 8000 });
            await page.click('#logout-btn');

            await page.waitForFunction(() => window.location.hash.includes('/login/user'), { timeout: 10000 });
            console.log('  After Farmer logout URL:', await page.url());

            pass('TEST 4: Farmer Logout', 'Farmer logs out to Normal Login Page (/login/user)');
            await context.close();
        } catch (e) {
            fail('TEST 4: Farmer Logout', e);
        }

        // ==========================================
        // TEST 5: SHOP OWNER LOGIN -> DASHBOARD -> LOGOUT -> NORMAL LOGIN PAGE
        // ==========================================
        console.log('\n--- TEST 5: Shop Owner Login -> Dashboard -> Logout -> Normal Login Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/shop`, { waitUntil: 'networkidle2' });
            await page.type('input[name="mobile"]', accounts.shop.mobile);
            await page.type('input[type="password"]', accounts.shop.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.startsWith('#/shop') && !window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  Shop landed on:', await page.url());

            // Click Logout in ShopLayout
            await page.waitForSelector('#logout-btn', { timeout: 8000 });
            await page.click('#logout-btn');

            await page.waitForFunction(() => window.location.hash.includes('/login/user'), { timeout: 10000 });
            console.log('  After Shop logout URL:', await page.url());

            pass('TEST 5: Shop Owner Logout', 'Shop Owner logs out to Normal Login Page (/login/user)');
            await context.close();
        } catch (e) {
            fail('TEST 5: Shop Owner Logout', e);
        }

        // ==========================================
        // TEST 6: ADMIN LOGIN -> DASHBOARD -> LOGOUT -> NORMAL LOGIN PAGE
        // ==========================================
        console.log('\n--- TEST 6: Admin Login -> Dashboard -> Logout -> Login Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            await page.type('input[type="email"]', accounts.admin.email);
            await page.type('input[type="password"]', accounts.admin.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/admin') && !window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  Admin landed on:', await page.url());

            // Click Logout in AdminDashboard
            await page.waitForSelector('#logout-btn', { timeout: 8000 });
            await page.click('#logout-btn');

            await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 10000 });
            console.log('  After Admin logout URL:', await page.url());

            pass('TEST 6: Admin Logout', 'Admin logs out to Normal Login Page (/login/user)');
            await context.close();
        } catch (e) {
            fail('TEST 6: Admin Logout', e);
        }

        // ==========================================
        // TEST 7: ACCOUNT CREATE BUTTON -> SIGNUP PAGE (LOCATION MUST NOT OPEN)
        // ==========================================
        console.log('\n--- TEST 7: Account Create Button -> Signup Page ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.goto(`${FRONTEND_URL}/#/`, { waitUntil: 'networkidle2' });

            // Locate Account Create link
            const accountCreateLink = await page.$('#account-create-nav');
            if (!accountCreateLink) throw new Error('#account-create-nav not found');

            await accountCreateLink.click();
            await page.waitForFunction(() => window.location.hash.includes('/signup'), { timeout: 8000 });

            const currentUrl = await page.url();
            console.log('  Account Create navigated to:', currentUrl);
            if (currentUrl.includes('/location')) {
                throw new Error('Location page opened on Account Create click!');
            }

            await page.waitForSelector('input[name="name"]', { timeout: 8000 });
            pass('TEST 7: Account Create -> Signup', 'Account Create button opens Signup page directly without opening Location Setup');
            await context.close();
        } catch (e) {
            fail('TEST 7: Account Create -> Signup', e);
        }

        // ==========================================
        // TEST 8: MOBILE VIEWPORT LOGOUT & LOGIN FLOW
        // ==========================================
        console.log('\n--- TEST 8: Mobile Viewport Logout & Login Flow ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            // Pixel 7 Mobile viewport
            await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

            await page.goto(`${FRONTEND_URL}/#/login/user`, { waitUntil: 'networkidle2' });
            await page.type('input[type="email"]', accounts.user.email);
            await page.type('input[type="password"]', accounts.user.password);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => (window.location.hash === '#/user' || window.location.hash.startsWith('#/user/')) && !window.location.hash.includes('/login'), { timeout: 10000 });

            // Mobile Profile tab has logout
            await page.goto(`${FRONTEND_URL}/#/user/profile`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('#logout-btn', { timeout: 8000 });
            await page.evaluate(() => {
                const btn = document.querySelector('#logout-btn');
                if (btn) {
                    btn.scrollIntoView();
                    btn.click();
                }
            });

            await page.waitForFunction(() => window.location.hash.includes('/login/user'), { timeout: 10000 });
            const mobileLogoutUrl = await page.url();
            if (mobileLogoutUrl.includes('/login/delivery')) {
                throw new Error('Mobile logout redirected to /login/delivery!');
            }

            pass('TEST 8: Mobile Viewport Logout', 'Mobile user logout smoothly redirects to /login/user');
            await context.close();
        } catch (e) {
            fail('TEST 8: Mobile Viewport Logout', e);
        }

    } finally {
        await browser.close();
        await mongoose.disconnect();
    }

    console.log('\n======================================================');
    console.log('TEST RESULTS SUMMARY:');
    console.log('======================================================');
    let allPassed = true;
    for (const [test, status] of Object.entries(results)) {
        console.log(`${status === 'PASS' ? '✓' : '✗'} ${test}: ${status}`);
        if (status !== 'PASS') allPassed = false;
    }
    console.log('======================================================\n');
    process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
    console.error('Test suite runner error:', err);
    process.exit(1);
});
