const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('userRole', 'user');
    localStorage.setItem('green_bond_current_user', JSON.stringify({ role: 'user', name: 'pugazh', email: 'pugazh@gmail.com' }));
  });
  
  await page.goto('http://localhost:5173/#/user', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await browser.close();
})();
