const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('[BROWSER PAGEERROR]', err.message));
    page.on('request', req => {
        if (req.url().includes('/api/')) {
            console.log('[API REQ]', req.method(), req.url());
        }
    });
    page.on('response', async res => {
        if (res.url().includes('/api/')) {
            console.log('[API RES]', res.status(), res.url());
            try {
                const json = await res.json();
                console.log('[API RES BODY]', JSON.stringify(json));
            } catch (e) {}
        }
    });

    await page.goto('http://localhost:5173/#/login/user', { waitUntil: 'networkidle2' });
    console.log('Login URL:', await page.url());

    const createAccountLink = await page.$('#account-create-user, a[href*="/signup/user"]');
    await createAccountLink.click();
    await page.waitForFunction(() => window.location.hash.includes('/signup/user'), { timeout: 6000 });
    console.log('Signup URL:', await page.url());

    const timestamp = Date.now();
    const testUser = {
        name: `Test User ${timestamp}`,
        email: `user_flow_${timestamp}@greenbond.com`,
        mobile: `98${String(timestamp).slice(-8)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    };

    console.log('Typing fields...', testUser);
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="mobile"]', testUser.mobile);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.confirmPassword);

    console.log('Clicking submit...');
    await page.click('button[type="submit"]');

    console.log('Waiting for location-setup or response...');
    try {
        await page.waitForFunction(() => window.location.hash.includes('/location-setup'), { timeout: 10000 });
        console.log('SUCCESS! Navigated to:', await page.url());
    } catch (e) {
        console.log('FAILED waiting for location-setup:', e.message);
        console.log('Current URL:', await page.url());
        const body = await page.evaluate(() => document.body.innerText);
        console.log('Body:', body.slice(0, 500));
    }

    await browser.close();
    process.exit(0);
})();
