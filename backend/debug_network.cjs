const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer'));

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.on('requestfailed', req => {
        console.log('[FAILED REQ]', req.url(), req.failure() ? req.failure().errorText : '');
    });

    try {
        const timestamp = Date.now();
        const email = `testdebug2_${timestamp}@greenbond.com`;
        
        await page.goto('http://localhost:5173/#/signup/user', { waitUntil: 'networkidle2' });
        
        await page.type('input[name="name"]', 'Debug User');
        await page.type('input[name="email"]', email);
        await page.type('input[name="mobile"]', `91${String(timestamp).slice(-8)}`);
        await page.type('input[name="password"]', 'Password123!');
        await page.type('input[name="confirmPassword"]', 'Password123!');
        
        await page.click('button[type="submit"]');
        await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
        await page.waitForSelector('#input-search-location', { timeout: 5000 });
        
        await page.type('#input-search-location', 'thiruvannamalai');
        await page.click('#btn-search-location-submit');
        
        await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
})();
