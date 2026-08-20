const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Register a user first to ensure they exist
    console.log("Registering user...");
    await page.goto('http://localhost:5173/');
    await page.evaluate(async () => {
        await fetch('http://localhost:5000/api/auth/register-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test', email: 'test_final@test.com', mobile: '9999999991', password: 'password', confirmPassword: 'password' })
        });
    });

    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/#/login/user');
    
    await page.type('input[type="email"]', 'test_final@test.com');
    await page.type('input[type="password"]', 'password');
    
    console.log("Clicking login...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation wait timeout')),
        page.click('button[type="submit"]')
    ]);

    // Check if we reached marketplace
    const currentUrl = page.url();
    console.log("URL after login:", currentUrl);
    
    // Check if there is a toast error
    const toasts = await page.evaluate(() => {
        const elements = document.querySelectorAll('.go3958317564'); // This is usually the toast container in react-hot-toast but just checking text is easier
        return document.body.innerText.includes('Please login to access this page');
    });
    
    console.log("Contains login error toast:", toasts);
    
    await browser.close();
})();
