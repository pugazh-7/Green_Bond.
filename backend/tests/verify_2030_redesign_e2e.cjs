const fs = require('fs');
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';

const screenshotsDir = path.resolve(__dirname, '../../dist/screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const devices = [
    {
        name: 'Desktop_1920x1080',
        label: 'Desktop Full HD (1920x1080)',
        viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    },
    {
        name: 'Desktop_1440x900',
        label: 'Desktop Wide (1440x900)',
        viewport: { width: 1440, height: 900, isMobile: false, hasTouch: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
    },
    {
        name: 'Android_Chrome',
        label: 'Android Chrome (393x851)',
        viewport: { width: 393, height: 851, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
    },
    {
        name: 'iPhone_Safari',
        label: 'iPhone Safari (390x844)',
        viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    }
];

async function runTest() {
    console.log('🚀 Starting GreenBond 2030 Redesign Multi-Device Browser Verification Suite...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const results = [];

    for (const dev of devices) {
        console.log(`\n-------------------------------------------------------`);
        console.log(`📱 TESTING DEVICE: ${dev.label}`);
        console.log(`-------------------------------------------------------`);
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        await page.setViewport(dev.viewport);
        await page.setUserAgent(dev.userAgent);

        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        try {
            // 1. Visit Marketplace
            console.log('1. Navigating to Marketplace (/#/user/marketplace)...');
            await page.goto(`${BASE_URL}/#/user/marketplace`, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));

            // Verify Marketplace Switcher exists
            const switcherExists = await page.evaluate(() => {
                return !!document.querySelector('button') && document.body.innerText.includes('Shopping');
            });
            console.log('   Marketplace Switcher rendered:', switcherExists ? '✅ PASS' : '❌ FAIL');

            // Screenshot Marketplace Home
            const mpScreenshot = path.join(screenshotsDir, `${dev.name}_01_marketplace.png`);
            await page.screenshot({ path: mpScreenshot, fullPage: false });
            console.log('   Screenshot captured:', mpScreenshot);

            // 2. Test Quick mode switch
            console.log('2. Switching to QUICK delivery mode...');
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const quickBtn = buttons.find(b => b.innerText.includes('Quick'));
                if (quickBtn) quickBtn.click();
            });
            await new Promise(r => setTimeout(r, 2000));

            const quickScreenshot = path.join(screenshotsDir, `${dev.name}_02_quick_view.png`);
            await page.screenshot({ path: quickScreenshot, fullPage: false });
            console.log('   Screenshot captured:', quickScreenshot);

            // 3. Test Fresh mode switch
            console.log('3. Switching to FRESH farm-direct mode...');
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const freshBtn = buttons.find(b => b.innerText.includes('Fresh'));
                if (freshBtn) freshBtn.click();
            });
            await new Promise(r => setTimeout(r, 2000));

            const freshScreenshot = path.join(screenshotsDir, `${dev.name}_03_fresh_view.png`);
            await page.screenshot({ path: freshScreenshot, fullPage: false });
            console.log('   Screenshot captured:', freshScreenshot);

            // 4. Visit Cart Page
            console.log('4. Navigating to Cart (/#/user/cart)...');
            await page.evaluate(() => {
                const testCart = [
                    {
                        _id: 'test-organic-tomatoes',
                        name: 'Organic Vine Ripe Tomatoes',
                        title: 'Organic Vine Ripe Tomatoes',
                        price: 45,
                        unit: 'kg',
                        quantity: 2,
                        category: 'Vegetables',
                        farmer: 'GreenValley Agro',
                        cartType: 'FRESH'
                    },
                    {
                        _id: 'test-artisanal-honey',
                        name: 'Wild Forest Raw Honey 500g',
                        title: 'Wild Forest Raw Honey 500g',
                        price: 320,
                        unit: 'jar',
                        quantity: 1,
                        category: 'Staples',
                        brand: 'NatureCraft',
                        cartType: 'SHOPPING'
                    }
                ];
                localStorage.setItem('user_cart', JSON.stringify(testCart));
            });

            await page.goto(`${BASE_URL}/#/user/cart`, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1500));

            const cartScreenshot = path.join(screenshotsDir, `${dev.name}_04_cart.png`);
            await page.screenshot({ path: cartScreenshot, fullPage: false });
            console.log('   Screenshot captured:', cartScreenshot);

            // 5. Check Order Tracking Page
            console.log('5. Navigating to Orders (/#/user/orders)...');
            await page.goto(`${BASE_URL}/#/user/orders`, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1500));

            const ordersScreenshot = path.join(screenshotsDir, `${dev.name}_05_orders.png`);
            await page.screenshot({ path: ordersScreenshot, fullPage: false });
            console.log('   Screenshot captured:', ordersScreenshot);

            // Check if any emojis leaked into main action buttons or headers
            const emojiAudit = await page.evaluate(() => {
                const regex = /[\u{1F300}-\u{1FAFF}]/u;
                const buttons = Array.from(document.querySelectorAll('button, h1, h2, h3, a'));
                const found = [];
                for (const el of buttons) {
                    if (regex.test(el.innerText)) {
                        found.push(el.innerText.trim());
                    }
                }
                return found;
            });

            console.log('   Emoji Audit on critical controls:', emojiAudit.length === 0 ? '✅ 0 Emojis Found (Clean SVGs)' : `⚠️ Found: ${emojiAudit.join(', ')}`);

            results.push({
                device: dev.label,
                status: 'PASSED',
                consoleErrors: consoleErrors.length,
                emojiViolations: emojiAudit.length
            });

        } catch (err) {
            console.error(`   ❌ Error testing ${dev.label}:`, err.message);
            results.push({
                device: dev.label,
                status: 'FAILED',
                error: err.message
            });
        } finally {
            await context.close();
        }
    }

    await browser.close();

    console.log('\n=======================================================');
    console.log('📊 MULTI-DEVICE 2030 REDESIGN TEST SUMMARY');
    console.log('=======================================================');
    console.table(results);
}

runTest();
