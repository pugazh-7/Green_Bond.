const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

async function debug() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('Navigating to http://localhost:5000/#/login/user');
    await page.goto('http://localhost:5000/#/login/user', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const url = page.url();
    console.log('URL is:', url);
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log('BODY HTML (first 1000 chars):', html.substring(0, 1000));
    const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, className: i.className })));
    console.log('INPUTS FOUND:', JSON.stringify(inputs, null, 2));

    await browser.close();
}

debug().catch(console.error);
