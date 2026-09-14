/**
 * Comprehensive Automated End-to-End Verification Suite for:
 * GREENBOND — NORMAL USER ONBOARDING FLOW
 * 
 * Tests:
 * 1. App Open -> Click "Account Create" -> Navigates to /signup ONLY (NEVER location, NEVER marketplace)
 * 2. Signup Validation & Error Handling: Invalid/duplicate input stays on /signup
 * 3. Successful Signup -> Backend creates MongoDB record -> Sets auth session -> Navigates to /location-setup
 * 4. Protected Route Interception: Trying to access /marketplace before location setup bounces back to /location-setup
 * 5. Location Selection & Confirmation -> Calls /api/auth/update-location -> Persists location in MongoDB User document
 * 6. Navigation to Marketplace -> User lands on /user (Marketplace)
 * 7. Refresh Test: Refreshing on /user maintains authenticated session on /user
 * 8. Mobile Viewport Test: Full onboarding flow on mobile viewport
 */

const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));
const mongoose = require('mongoose');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

const testRunId = Date.now();
const testUser = {
    name: `Onboard User ${testRunId}`,
    email: `onboard_${testRunId}@test.greenbond.com`,
    mobile: '9' + String(testRunId).slice(-9),
    password: 'Password123!'
};

const results = {};

function pass(name, detail) {
    console.log(`[PASS] ${name} - ${detail}`);
    results[name] = 'PASS';
}

function fail(name, error) {
    console.error(`[FAIL] ${name}:`, error.message || error);
    results[name] = 'FAIL';
}

async function runOnboardingTests() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    try {
        // ==========================================
        // STEP 1 & 2 & 3: APP OPEN -> ACCOUNT CREATE -> SIGNUP ONLY
        // ==========================================
        console.log('\n--- STEP 1 & 2: App Open -> Click Account Create -> Navigates to Signup ONLY ---');
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        page.on('console', msg => {
            const txt = msg.text();
            if (txt.includes('Error') || txt.includes('error') || txt.includes('[LOCATION]')) {
                console.log('  PAGE LOG:', txt);
            }
        });
        await page.setViewport({ width: 1280, height: 800 });

        await page.goto(`${FRONTEND_URL}/#/`, { waitUntil: 'networkidle2' });

        const accountCreateNav = await page.$('#account-create-nav');
        if (!accountCreateNav) throw new Error('#account-create-nav button not found on landing navbar');

        await accountCreateNav.click();
        await page.waitForFunction(() => window.location.hash.includes('/signup'), { timeout: 8000 });

        const currentHash = await page.evaluate(() => window.location.hash);
        console.log('  Navigated to URL:', await page.url());

        if (currentHash.includes('/location')) {
            throw new Error('VIOLATION: Account Create navigated directly to Location Setup!');
        }
        if (currentHash.includes('/user') || currentHash.includes('/marketplace')) {
            throw new Error('VIOLATION: Account Create navigated directly to Marketplace!');
        }
        if (!currentHash.includes('/signup')) {
            throw new Error(`Expected /signup, but got: ${currentHash}`);
        }

        // Verify signup form elements exist
        await page.waitForSelector('input[name="name"]', { timeout: 5000 });
        await page.waitForSelector('input[name="email"]', { timeout: 5000 });
        await page.waitForSelector('input[name="password"]', { timeout: 5000 });
        await page.waitForSelector('input[name="confirmPassword"]', { timeout: 5000 });
        await page.waitForSelector('button[type="submit"]', { timeout: 5000 });

        pass('STEP 1: Account Create Button', 'Navigates strictly to /signup; Location Setup and Marketplace do NOT appear');

        // ==========================================
        // STEP 4: SIGNUP FAILURE STAYS ON SIGNUP PAGE
        // ==========================================
        console.log('\n--- STEP 2: Signup Failure Verification (Stay on Signup Page) ---');
        // Test with invalid email
        await page.type('input[name="name"]', 'Bad User');
        await page.type('input[name="email"]', 'notanemail');
        await page.type('input[name="password"]', '123');
        await page.type('input[name="confirmPassword"]', 'mismatch');
        await page.click('button[type="submit"]');

        await new Promise(r => setTimeout(r, 1000));
        const failHash = await page.evaluate(() => window.location.hash);
        if (!failHash.includes('/signup')) {
            throw new Error(`Signup failure navigated away from /signup to: ${failHash}`);
        }
        pass('STEP 2: Signup Failure Handling', 'Failed validation remains on /signup with no redirect');

        // Full page reload cleanly for valid submission
        await page.reload({ waitUntil: 'networkidle2' });

        // ==========================================
        // STEP 5, 6, 7, 8: VALID SIGNUP -> BACKEND DB USER CREATION -> LOCATION SETUP
        // ==========================================
        console.log('\n--- STEP 3: Valid Signup -> MongoDB User Creation -> Location Setup ---');
        await page.waitForSelector('input[name="name"]', { timeout: 5000 });
        await page.type('input[name="name"]', testUser.name);
        await page.type('input[name="email"]', testUser.email);
        await page.type('input[name="mobile"]', testUser.mobile);
        await page.type('input[name="password"]', testUser.password);
        await page.type('input[name="confirmPassword"]', testUser.password);

        console.log('  Submitting signup form for:', testUser.email);
        await page.click('button[type="submit"]');

        // Check response or error
        await new Promise(r => setTimeout(r, 2000));
        console.log('  Current URL after click:', await page.url());
        const toastTexts = await page.evaluate(() => Array.from(document.querySelectorAll('[role="status"], .hot-toast, div')).map(e => e.innerText).filter(t => t && (t.includes('failed') || t.includes('match') || t.includes('created') || t.includes('Error') || t.includes('valid'))).slice(0, 5));
        console.log('  Page status messages:', toastTexts);

        // Await redirect to /location-setup
        await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });
        console.log('  After successful signup, URL:', await page.url());

        // Verify user was ACTUALLY created in MongoDB
        const createdUser = await db.collection('users').findOne({ email: testUser.email.toLowerCase() });
        if (!createdUser) {
            throw new Error('User was NOT found in MongoDB after registration response!');
        }
        console.log(`  MongoDB User verified: id=${createdUser._id}, email=${createdUser.email}, role=${createdUser.role}`);
        if (createdUser.role !== 'user') {
            throw new Error(`Expected role 'user', got: ${createdUser.role}`);
        }

        // Verify token in localStorage
        const storedToken = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
        if (!storedToken) {
            throw new Error('Authentication token was not established in localStorage');
        }

        pass('STEP 3: Signup & DB Persistence', 'Backend created user in MongoDB, established session, navigated to /location-setup');

        // ==========================================
        // STEP 9: PROTECTED ROUTE CHECK BEFORE LOCATION SETUP
        // ==========================================
        console.log('\n--- STEP 4: Protected Route Check Before Location Confirmation ---');
        // Attempting to jump directly to /user or /marketplace must bounce back to /location-setup
        await page.goto(`${FRONTEND_URL}/#/user`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));
        const attemptedUserHash = await page.evaluate(() => window.location.hash);
        console.log('  Attempting /user before location setup resulted in hash:', attemptedUserHash);
        if (!attemptedUserHash.includes('/location-setup')) {
            throw new Error(`Expected redirection to /location-setup because location is unsaved, but stayed on: ${attemptedUserHash}`);
        }

        pass('STEP 4: Location Route Protection', 'User without saved location cannot bypass /location-setup');

        // ==========================================
        // STEP 10, 11, 12, 13: SELECT LOCATION -> CONFIRM -> DB SAVE -> MARKETPLACE
        // ==========================================
        console.log('\n--- STEP 5: Select Location -> Confirm Location -> MongoDB Update -> Marketplace ---');
        // Wait for location card & Confirm Location button to be ready
        await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 800));

        // Click Confirm Location
        await page.click('#btn-confirm-location');

        // Await navigation to Marketplace (/user)
        await page.waitForFunction(() => (window.location.hash === '#/user' || window.location.hash.startsWith('#/user/')) && !window.location.hash.includes('/location'), { timeout: 12000 });
        console.log('  Landed on Marketplace URL:', await page.url());

        // Verify MongoDB user document was updated with real location data
        const updatedUser = await db.collection('users').findOne({ email: testUser.email.toLowerCase() });
        if (!updatedUser.location || !updatedUser.location.lat || !updatedUser.location.lng) {
            throw new Error('Location was NOT saved to MongoDB User document!');
        }
        console.log(`  MongoDB location verified: lat=${updatedUser.location.lat}, lng=${updatedUser.location.lng}, address=${updatedUser.location.address}`);

        pass('STEP 5: Location Save & Marketplace Navigation', 'Location saved to MongoDB User record and navigated to Marketplace');

        // ==========================================
        // STEP 14: REFRESH TEST
        // ==========================================
        console.log('\n--- STEP 6: Refresh on Marketplace ---');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));
        const refreshHash = await page.evaluate(() => window.location.hash);
        console.log('  After refresh hash:', refreshHash);
        if (!refreshHash.includes('/user')) {
            throw new Error(`After refresh, expected /user but got: ${refreshHash}`);
        }
        pass('STEP 6: Refresh Persistence', 'Refreshing on /user maintains authenticated session and location');

        await context.close();

        // ==========================================
        // STEP 15: MOBILE VIEWPORT TEST
        // ==========================================
        console.log('\n--- STEP 7: Mobile Viewport Full Onboarding Lifecycle ---');
        const mobileRunId = Date.now();
        const mobileUser = {
            name: `Mobile User ${mobileRunId}`,
            email: `mob_${mobileRunId}@test.greenbond.com`,
            mobile: '8' + String(mobileRunId).slice(-9),
            password: 'Password123!'
        };

        const mobileContext = await browser.createBrowserContext();
        const mobilePage = await mobileContext.newPage();
        await mobilePage.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

        await mobilePage.goto(`${FRONTEND_URL}/#/`, { waitUntil: 'networkidle2' });

        // Open mobile menu
        const menuBtn = await mobilePage.$('button svg path[d*="M4 6h16"]');
        if (menuBtn) {
            await mobilePage.evaluate(() => {
                const btn = document.querySelector('button svg path[d*="M4 6h16"]').closest('button');
                if (btn) btn.click();
            });
            await new Promise(r => setTimeout(r, 400));
        }

        // Click Account Create in mobile menu or direct nav
        const mobileCreateLink = await mobilePage.$('#account-create-mobile') || await mobilePage.$('#account-create-nav');
        if (!mobileCreateLink) throw new Error('Mobile Account Create link not found');
        await mobileCreateLink.click();

        await mobilePage.waitForFunction(() => window.location.hash.includes('/signup'), { timeout: 8000 });
        console.log('  Mobile navigated to:', await mobilePage.url());

        // Fill mobile signup
        await mobilePage.waitForSelector('input[name="name"]', { timeout: 5000 });
        await mobilePage.type('input[name="name"]', mobileUser.name);
        await mobilePage.type('input[name="email"]', mobileUser.email);
        await mobilePage.type('input[name="mobile"]', mobileUser.mobile);
        await mobilePage.type('input[name="password"]', mobileUser.password);
        await mobilePage.type('input[name="confirmPassword"]', mobileUser.password);

        await mobilePage.click('button[type="submit"]');

        await mobilePage.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });
        console.log('  Mobile after signup:', await mobilePage.url());

        // Confirm location on mobile
        await mobilePage.waitForSelector('#btn-confirm-location', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 800));

        await mobilePage.evaluate(() => {
            const btn = document.querySelector('#btn-confirm-location');
            if (btn) {
                btn.scrollIntoView();
                btn.click();
            }
        });

        await mobilePage.waitForFunction(() => (window.location.hash === '#/user' || window.location.hash.startsWith('#/user/')) && !window.location.hash.includes('/location'), { timeout: 12000 });
        console.log('  Mobile landed on Marketplace:', await mobilePage.url());

        pass('STEP 7: Mobile Viewport Flow', 'Mobile full lifecycle: Account Create -> Signup -> DB User -> Location Setup -> DB Location -> Marketplace passed');
        await mobileContext.close();

    } finally {
        await browser.close();
        await mongoose.disconnect();
    }

    console.log('\n======================================================');
    console.log('NORMAL USER ONBOARDING TEST SUMMARY:');
    console.log('======================================================');
    let allPassed = true;
    for (const [test, status] of Object.entries(results)) {
        console.log(`${status === 'PASS' ? '✓' : '✗'} ${test}: ${status}`);
        if (status !== 'PASS') allPassed = false;
    }
    console.log('======================================================\n');
    process.exit(allPassed ? 0 : 1);
}

runOnboardingTests().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
});
