const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

async function testLogout() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE:', msg.text()));

    // 1. Go to login
    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'pugazh@gmail.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Wait for user dashboard
    await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
    console.log('Logged in URL:', page.url());

    // 3. Logout
    console.log('Calling logout...');
    await page.evaluate(async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        localStorage.clear();
        sessionStorage.clear();
    });

    console.log('Navigating to http://localhost:5000/#/login/user...');
    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    console.log('Page URL is now:', page.url());
    console.log('Page hash is:', await page.evaluate(() => window.location.hash));

    const emailInput = await page.$('input[type="email"]');
    console.log('Is input[type="email"] found?', Boolean(emailInput));
    if (!emailInput) {
        console.log('HTML:', await page.evaluate(() => document.body.innerHTML.substring(0, 500)));
    }

    await browser.close();
}

testLogout().catch(console.error);
