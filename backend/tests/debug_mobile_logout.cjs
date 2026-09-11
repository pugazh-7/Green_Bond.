const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

    page.on('console', msg => console.log('MOBILE LOG:', msg.text()));

    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'monster_logout_user@greenbond.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    console.log('Waiting for user layout...');
    await page.waitForFunction(() => window.location.hash.includes('/user'), { timeout: 10000 });
    
    // Wait for either the hamburger menu or bottom nav
    await page.waitForFunction(() => document.querySelectorAll('button, a').length > 5, { timeout: 10000 });
    console.log('Mobile view ready, navigating to /#/user/profile...');
    
    await page.goto('http://localhost:5000/#/user/profile', { waitUntil: 'networkidle2' });
    
    await page.waitForFunction(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Log Out') || b.innerText.includes('Logout'));
    }, { timeout: 10000 });

    console.log('Profile page loaded! Clicking Log Out button...');
    const clickRes = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logoutBtn = btns.find(b => b.innerText.includes('Log Out') || b.innerText.includes('Logout'));
        if (logoutBtn) {
            logoutBtn.click();
            return 'Clicked Profile Logout';
        }
        return 'Button not found';
    });
    console.log('Click result:', clickRes);

    await page.waitForFunction(() => window.location.hash.includes('/login'), { timeout: 10000 });
    console.log('URL after logout:', page.url());
    console.log('Storage after logout:', await page.evaluate(() => ({
        token: localStorage.getItem('token'),
        currentUser: localStorage.getItem('green_bond_current_user')
    })));

    await browser.close();
})();
