const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

async function testSubmit() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
    page.on('request', req => {
        if (req.url().includes('/api/')) console.log('API REQUEST:', req.method(), req.url(), req.postData());
    });
    page.on('response', async res => {
        if (res.url().includes('/api/')) {
            let body = '';
            try { body = await res.text(); } catch {}
            console.log('API RESPONSE:', res.status(), res.url(), body);
        }
    });

    console.log('Navigating to http://localhost:5000/#/login/user...');
    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');

    console.log('Typing credentials...');
    await page.type('input[type="email"]', 'pugazh@gmail.com');
    await page.type('input[type="password"]', 'password123');

    console.log('Clicking submit button...');
    await page.click('button[type="submit"]');

    console.log('Waiting 4 seconds...');
    await new Promise(r => setTimeout(r, 4000));

    console.log('FINAL URL IS:', page.url());
    const storedToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('green_bond_token'));
    const storedUser = await page.evaluate(() => localStorage.getItem('green_bond_current_user'));
    console.log('FINAL TOKEN:', storedToken ? 'FOUND: ' + storedToken.substring(0, 15) : 'NONE');
    console.log('FINAL USER:', storedUser);

    await browser.close();
}

testSubmit().catch(console.error);
