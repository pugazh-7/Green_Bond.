const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'monster_logout_user@greenbond.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
    console.log('Navigated to user hash, waiting for Logout button to mount...');
    await page.waitForFunction(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Logout') || b.innerText.includes('Log Out'));
    }, { timeout: 15000 });
    console.log('User layout mounted, URL:', page.url());

    // Check buttons in page
    const btnText = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    });
    console.log('Buttons found on page:', btnText);

    const clickRes = await page.evaluate(async () => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logoutBtn = btns.find(b => b.innerText.includes('Logout'));
        if (logoutBtn) {
            console.log('Found logout button, clicking it now...');
            logoutBtn.click();
            return 'Clicked Logout button';
        }
        return 'Logout button not found';
    });
    console.log('Click result:', clickRes);

    await new Promise(r => setTimeout(r, 4000));
    console.log('URL after click:', page.url());
    console.log('Hash after click:', await page.evaluate(() => window.location.hash));
    console.log('Storage after click:', await page.evaluate(() => ({
        token: localStorage.getItem('token'),
        currentUser: localStorage.getItem('green_bond_current_user')
    })));

    await browser.close();
})();
