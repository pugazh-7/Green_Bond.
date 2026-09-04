const BASE_URL = 'http://127.0.0.1:5000';

async function verifyFeatures() {
    console.log('====================================================');
    console.log('GREENBOND FEATURE REGRESSION VERIFICATION');
    console.log('====================================================');

    // 1. Get token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pugazh@gmail.com', password: 'password123' })
    });
    const { token } = await loginRes.json();

    const tests = [
        { name: 'Shopping Meta API', url: '/api/marketplace/shopping-meta', expect: 200 },
        { name: 'Products List API', url: '/api/products', expect: 200 },
        { name: 'Fresh Marketplace API', url: '/api/marketplace/fresh', expect: 200 },
        { name: 'Quick Delivery Meta API', url: '/api/marketplace/quick-meta', expect: 200 },
        { name: 'Marketplace Search API', url: '/api/marketplace/products?q=banana', expect: 200 },
        { name: 'Cart Protected API', url: '/api/cart', auth: true, expect: 200 },
        { name: 'Orders Protected API', url: '/api/orders/my-orders', auth: true, expect: 200 },
        { name: 'Image CDN Service', url: '/api/images/product/default?v=1', expect: 200 },
        { name: 'Server Health & DB', url: '/api/health', expect: 200 },
    ];

    let passed = 0;
    for (const t of tests) {
        try {
            const headers = {};
            if (t.auth) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${BASE_URL}${t.url}`, {
                method: t.method || 'GET',
                headers
            });
            if (res.status === t.expect) {
                console.log(`[PASS] ${t.name} returned HTTP ${res.status}`);
                passed++;
            } else {
                console.error(`[FAIL] ${t.name} returned HTTP ${res.status}, expected ${t.expect}`);
            }
        } catch (e) {
            console.error(`[FAIL] ${t.name} request error: ${e.message}`);
        }
    }

    console.log('====================================================');
    console.log(`REGRESSION SUMMARY: ${passed}/${tests.length} PASSED`);
    console.log('====================================================');

    if (passed !== tests.length) {
        process.exit(1);
    }
}

verifyFeatures().catch(err => {
    console.error(err);
    process.exit(1);
});
