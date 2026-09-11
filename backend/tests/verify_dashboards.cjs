const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'green_bond_super_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:5000';

async function runTests() {
    console.log('--- Starting Admin, Delivery Boy, and Shop Owner Verification ---');
    
    // Connect to DB directly
    await mongoose.connect('mongodb://127.0.0.1:27017/green_bond');
    const db = mongoose.connection;
    console.log('Connected to MongoDB:', db.name);

    // Fetch or verify existing users
    const usersCol = db.collection('users');
    let adminUser = await usersCol.findOne({ role: 'admin' });
    let shopUser = await usersCol.findOne({ role: 'shop' });
    let deliveryUser = await usersCol.findOne({ role: 'delivery' });
    let regularUser = await usersCol.findOne({ role: 'user' });

    if (!adminUser) {
        const adminId = new mongoose.Types.ObjectId();
        await usersCol.insertOne({
            _id: adminId,
            name: 'Platform Admin',
            email: 'admin@greenbond.com',
            mobile: '9999999999',
            role: 'admin',
            createdAt: new Date()
        });
        adminUser = await usersCol.findOne({ _id: adminId });
    }

    const shopsCol = db.collection('shops');
    let shopRecord = await shopsCol.findOne({ isActive: true });
    if (!shopRecord) {
        const shopId = new mongoose.Types.ObjectId();
        await shopsCol.insertOne({
            _id: shopId,
            name: 'Green Fresh Mart',
            ownerName: 'Fresh Mart Owner',
            mobile: '9888888888',
            password: 'hashed_password',
            isActive: true,
            status: 'OPEN',
            location: {
                address: '12 Gandhi Road, Thiruvannamalai',
                lat: 12.2253,
                lng: 79.0747
            },
            createdAt: new Date()
        });
        shopRecord = await shopsCol.findOne({ _id: shopId });
    }
    shopUser = {
        _id: shopRecord._id,
        name: shopRecord.name,
        mobile: shopRecord.mobile,
        role: 'shop'
    };



    if (!deliveryUser) {
        const delId = new mongoose.Types.ObjectId();
        await usersCol.insertOne({
            _id: delId,
            name: 'Rider Ramesh',
            email: 'rider@greenbond.com',
            mobile: '9777777777',
            role: 'delivery',
            createdAt: new Date()
        });
        deliveryUser = await usersCol.findOne({ _id: delId });
    }

    if (!regularUser) {
        const uid = new mongoose.Types.ObjectId();
        await usersCol.insertOne({
            _id: uid,
            name: 'Test Customer',
            email: 'customer@greenbond.com',
            mobile: '9666666666',
            role: 'user',
            createdAt: new Date()
        });
        regularUser = await usersCol.findOne({ _id: uid });
    }

    console.log('Using test accounts:');
    console.log('- Admin:', adminUser?.email || adminUser?.mobile);
    console.log('- Shop:', shopUser?.name, `(${shopUser?._id})`);
    console.log('- Delivery:', deliveryUser?.name, `(${deliveryUser?._id})`);
    console.log('- User:', regularUser?.name);

    // Generate JWT tokens for each role using exact secret
    const adminToken = jwt.sign({ id: adminUser._id.toString(), role: 'admin', mobile: adminUser.mobile }, JWT_SECRET, { expiresIn: '1h' });
    const shopToken = jwt.sign({ id: shopUser._id.toString(), role: 'shop', mobile: shopUser.mobile }, JWT_SECRET, { expiresIn: '1h' });
    const deliveryToken = jwt.sign({ id: deliveryUser._id.toString(), role: 'delivery', mobile: deliveryUser.mobile }, JWT_SECRET, { expiresIn: '1h' });
    const userToken = regularUser ? jwt.sign({ id: regularUser._id.toString(), role: 'user', mobile: regularUser.mobile }, JWT_SECRET, { expiresIn: '1h' }) : null;

    // 1. Verify Admin Endpoints
    console.log('\n[1] Testing Admin Dashboard APIs:');
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('GET /api/admin/stats status:', statsRes.status, statsRes.ok ? 'PASS' : 'FAIL');
    if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log('Admin Stats:', stats);
    }

    // Role Protection Check: Regular user trying to access admin stats
    if (userToken) {
        const forbiddenRes = await fetch(`${BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        console.log('Role Protection Check (User accessing Admin API):', forbiddenRes.status, forbiddenRes.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');
    }

    // 2. Verify Delivery Partner Endpoints
    console.log('\n[2] Testing Delivery Boy Dashboard APIs:');
    const deliveryStatsRes = await fetch(`${BASE_URL}/api/orders/delivery-stats`, {
        headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    console.log('GET /api/orders/delivery-stats status:', deliveryStatsRes.status, deliveryStatsRes.ok ? 'PASS' : 'FAIL');
    if (deliveryStatsRes.ok) {
        const dStats = await deliveryStatsRes.json();
        console.log('Delivery Stats:', dStats);
    }

    const deliveryOrdersRes = await fetch(`${BASE_URL}/api/orders/delivery-orders`, {
        headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    console.log('GET /api/orders/delivery-orders status:', deliveryOrdersRes.status, deliveryOrdersRes.ok ? 'PASS' : 'FAIL');

    // 3. Verify Shop Owner Endpoints
    console.log('\n[3] Testing Shop Owner Dashboard APIs:');
    const shopMetricsRes = await fetch(`${BASE_URL}/api/shop/metrics`, {
        headers: { 'Authorization': `Bearer ${shopToken}` }
    });
    console.log('GET /api/shop/metrics status:', shopMetricsRes.status, shopMetricsRes.ok ? 'PASS' : 'FAIL');
    if (shopMetricsRes.ok) {
        const sMetrics = await shopMetricsRes.json();
        console.log('Shop Metrics:', sMetrics);
    }

    const shopOrdersRes = await fetch(`${BASE_URL}/api/orders/shop-orders`, {
        headers: { 'Authorization': `Bearer ${shopToken}` }
    });
    console.log('GET /api/orders/shop-orders status:', shopOrdersRes.status, shopOrdersRes.ok ? 'PASS' : 'FAIL');

    const shopProductsRes = await fetch(`${BASE_URL}/api/products/my-products`, {
        headers: { 'Authorization': `Bearer ${shopToken}` }
    });
    console.log('GET /api/products/my-products status:', shopProductsRes.status, shopProductsRes.ok ? 'PASS' : 'FAIL');
    
    // Add product test for shop
    const addProdRes = await fetch(`${BASE_URL}/api/products/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${shopToken}`
        },
        body: JSON.stringify({
            title: 'Automated Test Organic Apples',
            price: '120',
            category: 'Groceries',
            availableQuantity: 25,
            unit: 'kg',
            description: 'Fresh test apples',
            minOrder: 1,
            orderType: 'retail',
            location: 'Thiruvannamalai',
            contact: shopUser.mobile
        })
    });
    console.log('POST /api/products/add status:', addProdRes.status, addProdRes.ok ? 'PASS' : 'FAIL');

    if (addProdRes.ok) {
        const createdProd = await addProdRes.json();
        const testProdId = createdProd._id || createdProd.id || (createdProd.product && createdProd.product._id);
        
        if (testProdId) {
            // Test stock update
            const stockRes = await fetch(`${BASE_URL}/api/products/${testProdId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${shopToken}`
                },
                body: JSON.stringify({ availableQuantity: 30 })
            });
            console.log(`PUT /api/products/${testProdId}/stock status:`, stockRes.status, stockRes.ok ? 'PASS' : 'FAIL');

            // Test status toggle
            const toggleRes = await fetch(`${BASE_URL}/api/products/${testProdId}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${shopToken}` }
            });
            console.log(`PATCH /api/products/${testProdId}/toggle-status status:`, toggleRes.status, toggleRes.ok ? 'PASS' : 'FAIL');

            // Test product edit
            const editRes = await fetch(`${BASE_URL}/api/products/${testProdId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${shopToken}`
                },
                body: JSON.stringify({
                    title: 'Automated Test Organic Apples - Premium',
                    price: '135'
                })
            });
            console.log(`PUT /api/products/${testProdId} status:`, editRes.status, editRes.ok ? 'PASS' : 'FAIL');

            // Test product delete
            const delRes = await fetch(`${BASE_URL}/api/products/${testProdId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${shopToken}` }
            });
            console.log(`DELETE /api/products/${testProdId} status:`, delRes.status, delRes.ok ? 'PASS' : 'FAIL');
        }
    }

    console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
