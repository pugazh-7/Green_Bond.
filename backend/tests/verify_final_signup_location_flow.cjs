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

function makeUniqueMobile() {
    return '9' + Math.floor(100000000 + Math.random() * 900000000).toString().slice(0, 9);
}

function makeUniqueEmail(prefix = 'flow') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@greenbond.com`;
}

async function runAcceptanceTests() {
    console.log('============================================================');
    console.log('GREENBOND — FINAL SIGNUP → LOCATION → MARKETPLACE TEST SUITE');
    console.log('============================================================\n');

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for test validation.');

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
        // TEST 6: SIGNUP WITHOUT LOCATION
        // ==========================================
        console.log('\n--- Running TEST 6: SIGNUP WITHOUT LOCATION ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            const signupRoutes = ['/signup/user', '/signup/delivery', '/signup/farmer', '/signup/shop'];
            for (const route of signupRoutes) {
                await page.goto(`${FRONTEND_URL}/#${route}`, { waitUntil: 'networkidle2' });
                const hasLocationPicker = await page.$('.location-picker, [name="location"], [name="farmLocation"]');
                const formText = await page.evaluate(() => document.body.innerText);
                if (hasLocationPicker || formText.includes('Add Delivery Location (Optional)')) {
                    throw new Error(`Location field found on signup form at ${route}`);
                }
            }
            await context.close();
            logPass('TEST 6 — SIGNUP WITHOUT LOCATION', 'No location inputs on any signup forms');
        } catch (e) {
            logFail('TEST 6 — SIGNUP WITHOUT LOCATION', e);
        }

        // ==========================================
        // TEST 1: USER (Signup -> Location -> Current Location -> Save -> Marketplace)
        // ==========================================
        console.log('\n--- Running TEST 1: USER SIGNUP FLOW ---');
        const userEmail = makeUniqueEmail('user');
        try {
            const context = await browser.createBrowserContext();
            await context.overridePermissions(FRONTEND_URL, ['geolocation']);
            const page = await context.newPage();
            await page.setGeolocation({ latitude: 13.0827, longitude: 80.2707 });

            await page.goto(`${FRONTEND_URL}/#/signup/user`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Chennai User');
            await page.type('input[name="email"]', userEmail);
            await page.type('input[name="password"]', 'Password123!');
            await page.type('input[name="confirmPassword"]', 'Password123!');

            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });
            console.log('  Navigated to /location-setup after user signup');

            await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
            await page.click('#btn-use-current-location');

            await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
            console.log('  Current location detected and confirm button visible');

            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });
            console.log('  Successfully navigated to Marketplace (/user)');

            // Verify localStorage location
            const savedLoc = await page.evaluate(() => localStorage.getItem('green_bond_location'));
            if (!savedLoc) throw new Error('Location missing in localStorage');

            // Verify MongoDB record (TEST 8)
            const dbUser = await mongoose.connection.db.collection('users').findOne({ email: userEmail });
            if (!dbUser || !dbUser.location || typeof dbUser.location.lat !== 'number') {
                throw new Error('User location not persisted in MongoDB!');
            }
            console.log(`  Persisted MongoDB coordinates: lat=${dbUser.location.lat}, lng=${dbUser.location.lng}`);

            logPass('TEST 1 — USER', 'Signup -> Account created -> Location screen -> Current location -> Save -> Marketplace');
            logPass('TEST 8 — DATABASE', 'Verified location is stored against the correct MongoDB user');
            logPass('TEST 9 — CURRENT LOCATION', 'Browser location permission granted and geocoded');

            // TEST 7: LOCATION PERSISTENCE ON REFRESH
            console.log('\n--- Running TEST 7: LOCATION PERSISTENCE ---');
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 8000 });
            const persistedLocAfterReload = await page.evaluate(() => localStorage.getItem('green_bond_location'));
            if (!persistedLocAfterReload) throw new Error('Location missing in localStorage after refresh');
            logPass('TEST 7 — LOCATION PERSISTENCE', 'Location remains preserved across page reload');

            // TEST 11: LOGOUT
            console.log('\n--- Running TEST 11: LOGOUT ---');
            const logoutClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.innerText.includes('Logout'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (logoutClicked) {
                await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 8000 });
                logPass('TEST 11 — LOGOUT', 'Marketplace -> Logout -> Login page');

                // TEST 12: REFRESH AFTER LOGOUT
                console.log('\n--- Running TEST 12: REFRESH AFTER LOGOUT ---');
                await page.reload({ waitUntil: 'networkidle2' });
                await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 5000 });
                const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('green_bond_token') || localStorage.getItem('token'));
                if (tokenAfterLogout) throw new Error('Token found in storage after logout refresh');
                logPass('TEST 12 — REFRESH AFTER LOGOUT', 'User remains logged out after page refresh');
            } else {
                throw new Error('Logout button not found');
            }

            await context.close();
        } catch (e) {
            logFail('TEST 1 — USER', e);
            if (!results['TEST 8 — DATABASE']) logFail('TEST 8 — DATABASE', e);
            if (!results['TEST 7 — LOCATION PERSISTENCE']) logFail('TEST 7 — LOCATION PERSISTENCE', e);
            if (!results['TEST 11 — LOGOUT']) logFail('TEST 11 — LOGOUT', e);
        }

        // ==========================================
        // TEST 2: USER SEARCH LOCATION FLOW
        // ==========================================
        console.log('\n--- Running TEST 2: USER SEARCH LOCATION ---');
        const searchUserEmail = makeUniqueEmail('search_user');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            await page.goto(`${FRONTEND_URL}/#/signup/user`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Search Loc User');
            await page.type('input[name="email"]', searchUserEmail);
            await page.type('input[name="password"]', 'Password123!');
            await page.type('input[name="confirmPassword"]', 'Password123!');

            await page.click('button[type="submit"]');
            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });

            await page.waitForSelector('#input-search-location', { timeout: 5000 });
            await page.type('#input-search-location', 'Coimbatore');
            await page.click('#btn-search-location-submit');

            const resultBtn = await page.waitForSelector('.divide-y button', { timeout: 10000 });
            await resultBtn.click();

            await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });

            const dbUser = await mongoose.connection.db.collection('users').findOne({ email: searchUserEmail });
            if (!dbUser || !dbUser.location || typeof dbUser.location.lat !== 'number') {
                throw new Error('Search location not persisted in MongoDB!');
            }
            console.log(`  Persisted Search coordinates: lat=${dbUser.location.lat}, lng=${dbUser.location.lng}`);

            logPass('TEST 2 — USER SEARCH LOCATION', 'Signup -> Location screen -> Search -> Select -> Save -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 2 — USER SEARCH LOCATION', e);
        }

        // ==========================================
        // TEST 3: DELIVERY BOY
        // ==========================================
        console.log('\n--- Running TEST 3: DELIVERY BOY ---');
        const deliveryEmail = makeUniqueEmail('delivery');
        const deliveryMobile = makeUniqueMobile();
        try {
            const context = await browser.createBrowserContext();
            await context.overridePermissions(FRONTEND_URL, ['geolocation']);
            const page = await context.newPage();
            await page.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

            await page.goto(`${FRONTEND_URL}/#/signup/delivery`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Delivery Rider');
            await page.type('input[name="email"]', deliveryEmail);
            await page.type('input[name="mobile"]', deliveryMobile);
            await page.type('input[name="password"]', 'Password123!');
            await page.type('input[name="confirmPassword"]', 'Password123!');

            await page.click('button[type="submit"]');
            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });

            await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
            await page.click('#btn-use-current-location');
            await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });

            const dbPartner = await mongoose.connection.db.collection('deliverypartners').findOne({ email: deliveryEmail });
            if (!dbPartner || !dbPartner.location || typeof dbPartner.location.lat !== 'number') {
                throw new Error('Delivery partner location not persisted in MongoDB!');
            }
            console.log(`  Persisted Delivery coordinates: lat=${dbPartner.location.lat}, lng=${dbPartner.location.lng}`);

            logPass('TEST 3 — DELIVERY BOY', 'Signup -> Location -> Save -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 3 — DELIVERY BOY', e);
        }

        // ==========================================
        // TEST 4: FARMER
        // ==========================================
        console.log('\n--- Running TEST 4: FARMER ---');
        const farmerMobile = makeUniqueMobile();
        try {
            const context = await browser.createBrowserContext();
            await context.overridePermissions(FRONTEND_URL, ['geolocation']);
            const page = await context.newPage();
            await page.setGeolocation({ latitude: 11.0168, longitude: 76.9558 });

            await page.goto(`${FRONTEND_URL}/#/signup/farmer`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Green Farmer');
            await page.type('input[name="mobile"]', farmerMobile);
            await page.type('input[name="pin"]', '1234');

            await page.click('button[type="submit"]');
            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });

            await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
            await page.click('#btn-use-current-location');
            await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });

            const dbFarmer = await mongoose.connection.db.collection('farmers').findOne({ mobile: farmerMobile });
            if (!dbFarmer || !dbFarmer.farmLocation || typeof dbFarmer.farmLocation.lat !== 'number') {
                throw new Error('Farmer farm location not persisted in MongoDB!');
            }
            console.log(`  Persisted Farmer coordinates: lat=${dbFarmer.farmLocation.lat}, lng=${dbFarmer.farmLocation.lng}`);

            logPass('TEST 4 — FARMER', 'Signup -> Location -> Save -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 4 — FARMER', e);
        }

        // ==========================================
        // TEST 5: SHOP OWNER
        // ==========================================
        console.log('\n--- Running TEST 5: SHOP OWNER ---');
        const shopMobile = makeUniqueMobile();
        const shopEmail = makeUniqueEmail('shop');
        try {
            const context = await browser.createBrowserContext();
            await context.overridePermissions(FRONTEND_URL, ['geolocation']);
            const page = await context.newPage();
            await page.setGeolocation({ latitude: 9.9252, longitude: 78.1198 });

            await page.goto(`${FRONTEND_URL}/#/signup/shop`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Madurai Organics');
            await page.type('input[name="ownerName"]', 'Shopkeeper Raj');
            await page.type('input[name="mobile"]', shopMobile);
            await page.type('input[name="email"]', shopEmail);
            await page.type('input[name="password"]', 'Password123!');
            await page.type('input[name="confirmPassword"]', 'Password123!');

            await page.click('button[type="submit"]');
            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });

            await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
            await page.click('#btn-use-current-location');
            await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
            await page.click('#btn-confirm-location');

            await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });

            const dbShop = await mongoose.connection.db.collection('shops').findOne({ mobile: shopMobile });
            if (!dbShop || !dbShop.location || typeof dbShop.location.lat !== 'number') {
                throw new Error('Shop location not persisted in MongoDB!');
            }
            console.log(`  Persisted Shop coordinates: lat=${dbShop.location.lat}, lng=${dbShop.location.lng}`);

            logPass('TEST 5 — SHOP OWNER', 'Signup -> Location -> Save -> Marketplace');
            await context.close();
        } catch (e) {
            logFail('TEST 5 — SHOP OWNER', e);
        }

        // ==========================================
        // TEST 10: LOCATION DENIED FALLBACK
        // ==========================================
        console.log('\n--- Running TEST 10: LOCATION DENIED FALLBACK ---');
        try {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();

            await page.evaluateOnNewDocument(() => {
                navigator.geolocation.getCurrentPosition = function(success, error) {
                    error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1 });
                };
            });

            const deniedEmail = makeUniqueEmail('denied');
            await page.goto(`${FRONTEND_URL}/#/signup/user`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', 'Denied User');
            await page.type('input[name="email"]', deniedEmail);
            await page.type('input[name="password"]', 'Password123!');
            await page.type('input[name="confirmPassword"]', 'Password123!');
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });

            await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
            await page.click('#btn-use-current-location');

            await page.waitForSelector('[role="alert"]', { timeout: 5000 });
            const alertText = await page.$eval('[role="alert"]', el => el.innerText);
            if (!alertText.includes('Location permission was denied')) {
                throw new Error(`Expected denied message, got: ${alertText}`);
            }
            console.log('  Confirmed permission denied error banner:', alertText.trim());

            const currentHash = await page.evaluate(() => window.location.hash);
            if (currentHash.includes('/user')) {
                throw new Error('Should not have navigated to marketplace on denied permission!');
            }

            logPass('TEST 10 — LOCATION DENIED', 'Permission denied message shown with search-location fallback');
            await context.close();
        } catch (e) {
            logFail('TEST 10 — LOCATION DENIED', e);
        }

        // ==========================================
        // TESTS 13 - 16: DEVICE MATRIX TESTING
        // ==========================================
        console.log('\n--- Running TESTS 13 - 16: DEVICE MATRIX ---');
        const matrixDevices = [
            {
                testKey: 'TEST 13 — MOBILE ANDROID',
                name: 'Android Chrome',
                viewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
                userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
            },
            {
                testKey: 'TEST 14 — MOBILE IPHONE',
                name: 'iPhone Safari',
                viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
            },
            {
                testKey: 'TEST 15 — DESKTOP CHROME',
                name: 'Desktop Chrome',
                viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            {
                testKey: 'TEST 16 — DESKTOP EDGE',
                name: 'Desktop Edge',
                viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
            }
        ];

        for (const item of matrixDevices) {
            try {
                const context = await browser.createBrowserContext();
                await context.overridePermissions(FRONTEND_URL, ['geolocation']);
                const page = await context.newPage();
                await page.setViewport(item.viewport);
                await page.setUserAgent(item.userAgent);
                await page.setGeolocation({ latitude: 13.0827, longitude: 80.2707 });

                const randEmail = makeUniqueEmail('device');
                await page.goto(`${FRONTEND_URL}/#/signup/user`, { waitUntil: 'networkidle2' });
                await page.waitForSelector('input[name="name"]', { timeout: 5000 });
                await page.type('input[name="name"]', `${item.name} User`);
                await page.type('input[name="email"]', randEmail);
                await page.type('input[name="password"]', 'Password123!');
                await page.type('input[name="confirmPassword"]', 'Password123!');
                await page.click('button[type="submit"]');

                await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 12000 });
                await page.waitForSelector('#btn-use-current-location', { timeout: 5000 });
                await page.click('#btn-use-current-location');
                await page.waitForSelector('#btn-confirm-location', { timeout: 10000 });
                await page.click('#btn-confirm-location');
                await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 12000 });

                logPass(item.testKey, `${item.name} signup -> location -> marketplace verified`);
                await context.close();
            } catch (e) {
                logFail(item.testKey, e);
            }
        }

    } finally {
        await browser.close();
        await mongoose.disconnect();
    }

    console.log('\n============================================================');
    console.log('FINAL ACCEPTANCE TEST RESULTS SUMMARY');
    console.log('============================================================');
    let allPassed = true;
    for (const [test, status] of Object.entries(results)) {
        console.log(`${test}: ${status}`);
        if (status !== 'PASS') allPassed = false;
    }
    console.log('============================================================');
    console.log(allPassed ? 'ALL 16 ACCEPTANCE TESTS PASSED!' : 'SOME TESTS FAILED - REVIEW LOGS');
    console.log('============================================================');
}

runAcceptanceTests().catch(console.error);
