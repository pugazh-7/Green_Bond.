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
            body: JSON.stringify({ name: 'Test', email: 'test_puppeteer@test.com', mobile: '9999999990', password: 'password', confirmPassword: 'password' })
        });
    });

    // Go to login page
    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/#/login/user');
    
    // Fill form
    await page.type('input[type="email"]', 'test_puppeteer@test.com');
    await page.type('input[type="password"]', 'password');
    
    // Setup listener for toasts
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log("Clicking login...");
    // Find the login button (it's the submit button)
    await page.click('button[type="submit"]');

    // Wait for network idle or 3 seconds
    await new Promise(r => setTimeout(r, 3000));
    
    // Check url
    const currentUrl = page.url();
    console.log("URL after login:", currentUrl);

    // Wait 14 minutes silently... no, just verify if we got kicked out.
    // If URL is still /#/login/user or /#/, it failed. If it's /#/user/marketplace, it worked.
    
    await browser.close();
})();
