const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer'));

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));

    try {
        const timestamp = Date.now();
        const email = `testdebug3_${timestamp}@greenbond.com`;
        
        console.log('Navigating to signup...');
        await page.goto('http://localhost:5173/#/signup/user', { waitUntil: 'networkidle2' });
        
        await page.type('input[name="name"]', 'Debug User 3');
        await page.type('input[name="email"]', email);
        await page.type('input[name="mobile"]', `91${String(timestamp).slice(-8)}`);
        await page.type('input[name="password"]', 'Password123!');
        await page.type('input[name="confirmPassword"]', 'Password123!');
        
        console.log('Submitting signup...');
        await page.click('button[type="submit"]');
        
        await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
        console.log('Reached /location-setup!');
        
        await page.waitForSelector('#input-search-location', { timeout: 5000 });
        
        console.log('Typing Thiruvannamalai...');
        await page.type('#input-search-location', 'thiruvannamalai');
        
        console.log('Clicking Search button...');
        await page.click('#btn-search-location-submit');
        
        // Wait for suggestions
        await page.waitForSelector('div.absolute button', { timeout: 5000 });
        console.log('Suggestions appeared! Clicking first suggestion...');
        await page.click('div.absolute button');
        
        // Verify address card and map container
        await page.waitForSelector('#location-map-container', { timeout: 5000 });
        await page.waitForSelector('#btn-confirm-location', { timeout: 5000 });
        console.log('Map and Confirm Location button are visible!');
        
        console.log('Clicking Confirm Location...');
        await page.click('#btn-confirm-location');
        
        // Wait for navigation to Marketplace
        await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
        console.log('SUCCESSFULLY NAVIGATED TO MARKETPLACE! Current hash:', await page.evaluate(() => window.location.hash));
        
        // Refresh page to test persistence
        console.log('Reloading Marketplace page...');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
        console.log('SUCCESS! Marketplace remained after reload! Current hash:', await page.evaluate(() => window.location.hash));

    } catch (err) {
        console.error('Debug script error:', err);
    } finally {
        await browser.close();
    }
})();
