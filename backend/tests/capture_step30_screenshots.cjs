const fs = require('fs');
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../frontend/node_modules/puppeteer'));

const BASE_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';

const screenshotsDir = path.resolve(__dirname, '../../dist/screenshots_2030');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function createTestAccount(email, password, mobile) {
    const res = await fetch(`${API_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Luxury 2030 Customer',
            email,
            mobile,
            password,
            confirmPassword: password,
            location: {
                lat: 13.0827,
                lng: 80.2707,
                address: 'Anna Nagar, Chennai, Tamil Nadu 600040',
                label: 'Home'
            }
        })
    });
    const data = await res.json();
    return { status: res.status, data };
}

async function run() {
    console.log('📸 Generating 12 Step-30 Screenshots from the live running application...');

    const timestamp = Date.now();
    const testEmail = `luxury_2030_${timestamp}@greenbond.org`;
    const testPassword = 'Password2030!';
    const testMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    const regResult = await createTestAccount(testEmail, testPassword, testMobile);
    if (regResult.status !== 201 && regResult.status !== 200) {
        console.error('Failed to create test user:', regResult.data);
        process.exit(1);
    }
    const token = regResult.data.token;
    const user = regResult.data.user;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // Helper to inject user session & location
    const injectSession = async (customCart = null) => {
        await page.evaluate(({ token, user, customCart }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('green_bond_token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('green_bond_location', JSON.stringify({
                lat: 13.0827,
                lng: 80.2707,
                address: 'Anna Nagar, Chennai, Tamil Nadu 600040',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600040',
                label: 'Home'
            }));
            if (customCart) {
                localStorage.setItem('user_cart', JSON.stringify(customCart));
            }
            window.dispatchEvent(new Event('storage'));
        }, { token, user, customCart });
    };

    // 1. 01-home.png (Desktop Home / Landing)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '01-home.png'), fullPage: false });
    console.log('Saved 01-home.png');

    // Seed session for customer pages
    await injectSession();

    // 2. 02-marketplace.png (Desktop Marketplace)
    await page.goto(`${BASE_URL}/user`, { waitUntil: 'networkidle2' });
    await injectSession();
    await page.goto(`${BASE_URL}/user`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '02-marketplace.png'), fullPage: false });
    console.log('Saved 02-marketplace.png');

    // 3. 03-shopping.png (Desktop Shopping Mode)
    await page.goto(`${BASE_URL}/user?phase=SHOPPING`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '03-shopping.png'), fullPage: false });
    console.log('Saved 03-shopping.png');

    // 4. 04-quick.png (Desktop Quick Mode)
    await page.goto(`${BASE_URL}/user?phase=QUICK`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '04-quick.png'), fullPage: false });
    console.log('Saved 04-quick.png');

    // 5. 05-fresh.png (Desktop Fresh Mode)
    await page.goto(`${BASE_URL}/user?phase=FRESH`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '05-fresh.png'), fullPage: false });
    console.log('Saved 05-fresh.png');

    // 6. 06-search.png (Desktop Search)
    await page.goto(`${BASE_URL}/user`, { waitUntil: 'networkidle2' });
    // Type a query in search bar
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
        await searchInput.type('Fresh Tomato');
        await new Promise(r => setTimeout(r, 1000));
    }
    await page.screenshot({ path: path.join(screenshotsDir, '06-search.png'), fullPage: false });
    console.log('Saved 06-search.png');

    // 7. 07-product.png (Desktop Product Details)
    // Find a product card or navigate directly to a sample product
    let productId = null;
    const cards = await page.$$('div[class*="card-2030"]');
    if (cards && cards.length > 0) {
        // click card or extract product link
        const productLink = await page.$('a[href*="/user/product/"]');
        if (productLink) {
            await productLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
    }
    // If not clicked, check products from API
    if (!page.url().includes('/product/')) {
        const prodRes = await fetch(`${API_URL}/api/marketplace/products?lat=13.0827&lng=80.2707&page=1&limit=5`);
        if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData.products && prodData.products.length > 0) {
                productId = prodData.products[0]._id;
                await page.goto(`${BASE_URL}/user/product/${productId}`, { waitUntil: 'networkidle2' });
            }
        }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '07-product.png'), fullPage: false });
    console.log('Saved 07-product.png');

    // 8. 08-cart.png (Desktop Cart with multi-speed grouping)
    const sampleCart = [
        {
            _id: 'cart_item_1',
            name: 'Organic Sweet Bell Peppers',
            price: 65,
            quantity: 2,
            unit: '500g',
            cartType: 'FRESH',
            farmer: 'Green Horizon Farm'
        },
        {
            _id: 'cart_item_2',
            name: 'Cold Pressed Coconut Oil',
            price: 240,
            quantity: 1,
            unit: '1L',
            cartType: 'QUICK',
            eta: '10-15 min'
        },
        {
            _id: 'cart_item_3',
            name: 'Artisanal Clay Pot Planter',
            price: 499,
            quantity: 1,
            unit: '1 unit',
            cartType: 'SHOPPING'
        }
    ];
    await injectSession(sampleCart);
    await page.goto(`${BASE_URL}/user/cart`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '08-cart.png'), fullPage: false });
    console.log('Saved 08-cart.png');

    // 9. 09-orders.png (Desktop Orders & Tracking)
    // Seed an active order in localStorage
    await page.evaluate(() => {
        const mockOrder = {
            _id: 'GB-2030-98421',
            createdAt: new Date().toISOString(),
            status: 'Shipped',
            totalAmount: 804,
            otp: '4921',
            items: [
                { name: 'Organic Sweet Bell Peppers', quantity: 2, price: 65 },
                { name: 'Cold Pressed Coconut Oil', quantity: 1, price: 240 }
            ]
        };
        localStorage.setItem('green_bond_orders', JSON.stringify([mockOrder]));
        window.dispatchEvent(new Event('storage'));
    });
    await page.goto(`${BASE_URL}/user/orders`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, '09-orders.png'), fullPage: false });
    console.log('Saved 09-orders.png');

    // Mobile Viewport for 10, 11, 12
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');

    // 10. 10-mobile-home.png
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '10-mobile-home.png'), fullPage: false });
    console.log('Saved 10-mobile-home.png');

    // 11. 11-mobile-marketplace.png
    await page.goto(`${BASE_URL}/user`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '11-mobile-marketplace.png'), fullPage: false });
    console.log('Saved 11-mobile-marketplace.png');

    // 12. 12-mobile-fresh.png
    await page.goto(`${BASE_URL}/user?phase=FRESH`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(screenshotsDir, '12-mobile-fresh.png'), fullPage: false });
    console.log('Saved 12-mobile-fresh.png');

    await browser.close();
    console.log('🎉 All 12 Step-30 screenshots captured successfully in dist/screenshots_2030/!');
}

run().catch(err => {
    console.error('Error capturing screenshots:', err);
    process.exit(1);
});
