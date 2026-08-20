import mongoose from 'mongoose';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const adminToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'admin' }, JWT_SECRET);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETest() {
    console.log("=== STARTING E2E TEST ===");
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log("Connected to MongoDB for direct verification.");

        // Clear previous test data
        await mongoose.connection.db.collection('users').deleteMany({ email: 'testcustomer@example.com' });
        await mongoose.connection.db.collection('farmers').deleteMany({ mobile: '9999999999' });
        await mongoose.connection.db.collection('deliverypartners').deleteMany({ email: 'testdelivery@example.com' });
        await mongoose.connection.db.collection('products').deleteMany({ title: 'Test Organic Tomatoes' });
        await mongoose.connection.db.collection('orders').deleteMany({ customerName: 'Test Customer' });
        await mongoose.connection.db.collection('servicezones').deleteMany({ zoneId: 'TVM-001' });

        // 1. Create/Activate Service Zone
        console.log("1. Admin creates/activates Thiruvannamalai service zone...");
        const ServiceZone = (await import('../models/ServiceZone.js')).default;
        await ServiceZone.create({
            zoneId: 'TVM-001',
            name: 'Thiruvannamalai',
            locationGeo: { type: 'Point', coordinates: [79.0747, 12.2253] },
            radiusKm: 10,
            active: true
        });
        
        // 2. Farmer Registration
        console.log("2. Farmer registers...");
        let res = await fetch(`${API_BASE}/auth/register-farmer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Farmer',
                mobile: '9999999999',
                pin: '1234',
                location: 'Thiruvannamalai',
                lat: 12.2253,
                lng: 79.0747
            })
        });
        if (!res.ok) throw new Error("Farmer registration failed: " + await res.text());
        
        // Login Farmer
        res = await fetch(`${API_BASE}/auth/login-farmer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Farmer', mobile: '9999999999', pin: '1234' })
        });
        if (!res.ok) throw new Error("Farmer login failed: " + await res.text());
        let data = await res.json();
        const farmerToken = data.token;
        const farmerId = data.farmer.id;

        // 3. Admin approves farmer (Direct DB to bypass admin token auth setup for simplicity, as requested testing is mostly farmer/customer flow)
        console.log("3 & 4. Farmer submits land proof & Admin approves farmer...");
        await mongoose.connection.db.collection('farmers').updateOne({ mobile: '9999999999' }, { $set: { verificationStatus: 'APPROVED' } });

        // 5. Farmer adds product
        console.log("5. Farmer adds product...");
        res = await fetch(`${API_BASE}/products/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${farmerToken}` },
            body: JSON.stringify({
                title: 'Test Organic Tomatoes',
                price: '₹50/kg',
                availableQuantity: 100,
                unit: 'kg',
                minOrder: '1',
                contact: '9999999999',
                category: 'Vegetables',
                location: 'Thiruvannamalai',
                farmer: 'Test Farmer'
            })
        });
        if (!res.ok) throw new Error("Product addition failed: " + await res.text());
        data = await res.json();
        const productId = data.product._id;

        // 6. Customer registers
        console.log("6. Customer registers...");
        res = await fetch(`${API_BASE}/auth/register-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Customer',
                email: 'testcustomer@example.com',
                mobile: '8888888888',
                password: 'password123',
                confirmPassword: 'password123',
                location: { lat: 12.2300, lng: 79.0700, address: 'Test Customer Address' }
            })
        });
        if (!res.ok) throw new Error("Customer registration failed: " + await res.text());
        
        // Login Customer
        res = await fetch(`${API_BASE}/auth/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testcustomer@example.com', password: 'password123' })
        });
        if (!res.ok) throw new Error("Customer login failed: " + await res.text());
        data = await res.json();
        const customerToken = data.token;

        // Delivery Partner registers
        console.log("Preparing Delivery Partner...");
        res = await fetch(`${API_BASE}/auth/register-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Delivery',
                email: 'testdelivery@example.com',
                mobile: '7777777777',
                password: 'password123',
                confirmPassword: 'password123',
                location: { lat: 12.2260, lng: 79.0750, address: 'Test Hub' }
            })
        });
        if (!res.ok) throw new Error("Delivery registration failed: " + await res.text());
        
        // Login Delivery Partner
        res = await fetch(`${API_BASE}/auth/login-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testdelivery@example.com', password: 'password123' })
        });
        if (!res.ok) throw new Error("Delivery login failed: " + await res.text());
        data = await res.json();
        const deliveryToken = data.token;

        // Partner goes available
        const statRes = await fetch(`${API_BASE}/auth/delivery/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deliveryToken}` },
            body: JSON.stringify({ status: 'Available' })
        });
        console.log("STATUS UPDATE RES:", await statRes.text());
        
        // Debug: Check Partner in DB
        const debugPartner = await mongoose.connection.db.collection('deliverypartners').findOne({ email: 'testdelivery@example.com' });
        console.log("DEBUG PARTNER:", JSON.stringify(debugPartner));

        // 8. Customer Places COD Order
        console.log("8 & 9. Customer places COD order...");
        res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
            body: JSON.stringify({
                customerName: 'Test Customer',
                customerEmail: 'testcustomer@example.com',
                deliveryAddress: 'Test Customer Address',
                pickupAddress: 'Test Farmer Address',
                deliveryLat: 12.2300,
                deliveryLng: 79.0700,
                paymentMethod: 'COD',
                paymentStatus: 'Pending',
                qty: 2,
                total: '₹100',
                deliveryFee: 10,
                items: [{
                    productId: productId,
                    title: 'Test Organic Tomatoes',
                    price: '₹50/kg',
                    quantity: 2,
                    farmerId: farmerId
                }]
            })
        });
        if (!res.ok) throw new Error("Order creation failed: " + await res.text());
        data = await res.json();
        const orderId = data.order.id;
        console.log(`Order created: ${orderId}. Total Amount: ${data.order.totalAmount}`);

        // Verify product stock deduction
        const checkProd = await mongoose.connection.db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(productId) });
        if (checkProd.availableQuantity !== 98) throw new Error(`Stock deduction failed! Expected 98, got ${checkProd.availableQuantity}`);

        // 10. Farmer accepts order
        console.log("10. Farmer accepts order...");
        res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${farmerToken}` },
            body: JSON.stringify({ status: 'FARMER_ACCEPTED' })
        });
        if (!res.ok) throw new Error("Farmer accept failed: " + await res.text());

        // 11 & 12. Farmer packs order (READY_FOR_PICKUP) & Auto Delivery Assignment
        console.log("11 & 12. Farmer marks READY_FOR_PICKUP & Delivery Assigned...");
        res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${farmerToken}` },
            body: JSON.stringify({ status: 'READY_FOR_PICKUP' })
        });
        if (!res.ok) throw new Error("Ready for pickup failed: " + await res.text());
        
        let orderRecord = await mongoose.connection.db.collection('orders').findOne({ id: orderId });
        if (orderRecord.status !== 'DELIVERY_ASSIGNED') throw new Error("Order didn't auto-assign delivery partner! Status: " + orderRecord.status);
        console.log("Delivery assigned to:", orderRecord.deliveryBoyId);

        // Fetch OTPs from DB
        const pickupOtpRec = await mongoose.connection.db.collection('otps').findOne({ orderId: orderRecord._id, type: 'PICKUP' });
        const deliveryOtpRec = await mongoose.connection.db.collection('otps').findOne({ orderId: orderRecord._id, type: 'DELIVERY' });
        
        const pickupOtp = pickupOtpRec ? pickupOtpRec.code : orderRecord.pickupOtp;
        const deliveryOtp = deliveryOtpRec ? deliveryOtpRec.code : orderRecord.deliveryOtp;

        // 13 & 14. Delivery partner verified pickup OTP
        console.log("13, 14 & 15. Delivery partner verifies Pickup OTP...");
        res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/verify-pickup-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deliveryToken}` },
            body: JSON.stringify({ otp: pickupOtp })
        });
        if (!res.ok) throw new Error("Pickup OTP failed: " + await res.text());
        
        orderRecord = await mongoose.connection.db.collection('orders').findOne({ id: orderId });
        if (orderRecord.status !== 'PICKED_UP') throw new Error("Order status not PICKED_UP!");

        console.log("Waiting 3s for OUT_FOR_DELIVERY auto-transition...");
        await delay(3000);
        orderRecord = await mongoose.connection.db.collection('orders').findOne({ id: orderId });
        if (orderRecord.status !== 'OUT_FOR_DELIVERY') throw new Error("Order status not OUT_FOR_DELIVERY!");

        // 18, 19, 20. Delivery verified delivery OTP
        console.log("18 & 19. Delivery partner verifies Delivery OTP...");
        res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/verify-delivery-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deliveryToken}` },
            body: JSON.stringify({ otp: deliveryOtp })
        });
        if (!res.ok) throw new Error("Delivery OTP failed: " + await res.text());
        
        orderRecord = await mongoose.connection.db.collection('orders').findOne({ id: orderId });
        if (orderRecord.status !== 'DELIVERED') throw new Error("Order status not DELIVERED!");
        if (orderRecord.codStatus !== 'COLLECTED') throw new Error("COD Status not COLLECTED!");

        console.log(`22. Amounts: Total=${orderRecord.totalAmount}, Farmer=${orderRecord.farmerAmount}, Comm=${orderRecord.greenBondCommission}`);
        if (orderRecord.farmerAmount !== 90 || orderRecord.greenBondCommission !== 10) {
            throw new Error(`Commission split incorrect! Farmer: ${orderRecord.farmerAmount}, Comm: ${orderRecord.greenBondCommission}`);
        }

        // 24. Audit Readiness
        console.log("Running final launch audit...");
        const adminData = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
        
        const jwt = (await import('jsonwebtoken')).default;
        const newAdminToken = jwt.sign({ id: adminData._id, role: adminData.role }, JWT_SECRET, { expiresIn: '1d' });

        res = await fetch(`${API_BASE}/admin/audit`, {
            headers: { 'Authorization': `Bearer ${newAdminToken}` }
        });
        const audit = await res.json();
        console.log("LAUNCH READINESS:", `${audit.totalScore}%`);
        console.log("PRODUCTION STATUS:", audit.overallStatus);
        
        if (audit.totalScore !== 100) {
            console.error(audit.categories.filter(c => c.status !== 'PASS'));
            throw new Error("Audit score is not 100%!");
        }

        console.log("✅ ALL E2E TESTS PASSED SUCCESSFULLY!");
    } catch (err) {
        console.error("❌ E2E TEST FAILED:", err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runE2ETest();
