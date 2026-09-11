import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Farmer from '../models/Farmer.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import DeviceToken from '../models/DeviceToken.js';
import BulkOrder from '../models/BulkOrder.js';
import Payment from '../models/Payment.js';
import ServiceZone from '../models/ServiceZone.js';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';

async function safeReset() {
    console.log('==================================================');
    console.log('GREENBOND SAFE DEVELOPMENT DATABASE RESET');
    console.log('==================================================');

    // 1. Safety check
    if (MONGODB_URI.includes('mongodb.net') || process.env.NODE_ENV === 'production') {
        console.error('CRITICAL ABORT: Connected URI appears to be production or cloud Atlas!');
        process.exit(1);
    }

    if (!MONGODB_URI.includes('127.0.0.1') && !MONGODB_URI.includes('localhost')) {
        console.error('CRITICAL ABORT: Database host is not local development (127.0.0.1/localhost)');
        process.exit(1);
    }

    console.log('Connecting to MongoDB development database...');
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        directConnection: true
    });

    const dbName = mongoose.connection.name;
    console.log(`Connected to database: "${dbName}" on host ${mongoose.connection.host}:${mongoose.connection.port}`);

    if (dbName !== 'green_bond') {
        console.error(`CRITICAL ABORT: Connected to "${dbName}", expected "green_bond"`);
        process.exit(1);
    }

    // 2. Clear application collections
    console.log('\n--- Clearing development application data ---');
    await Promise.all([
        User.deleteMany({}),
        Order.deleteMany({}),
        Cart.deleteMany({}),
        Notification.deleteMany({}),
        DeviceToken.deleteMany({}),
        BulkOrder.deleteMany({}),
        Payment.deleteMany({}),
        ServiceZone.deleteMany({})
    ]);

    console.log('Cleared Users, Orders, Carts, Notifications, DeviceTokens, BulkOrders, Payments, ServiceZones.');

    // 3. Rebuild indexes
    console.log('\n--- Rebuilding schema indexes ---');
    await Promise.all([
        User.init(),
        Product.init(),
        Farmer.init(),
        Shop.init(),
        Cart.init(),
        Order.init()
    ]);
    console.log('Schema indexes verified and rebuilt.');

    // 4. Seed baseline Admin & Default Test User
    console.log('\n--- Seeding baseline users ---');
    const salt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('admin123', salt);
    const userHashedPassword = await bcrypt.hash('password123', salt);

    await User.create([
        {
            name: 'Administrator',
            email: 'admin@greenbond.com',
            mobile: '9999999999',
            password: adminHashedPassword,
            role: 'admin'
        },
        {
            name: 'Pugazh User',
            email: 'pugazh@gmail.com',
            mobile: '9876543210',
            password: userHashedPassword,
            role: 'user',
            location: {
                lat: 12.2274,
                lng: 79.0673,
                address: 'Thiruvannamalai, Tamil Nadu'
            },
            locationGeo: {
                type: 'Point',
                coordinates: [79.0673, 12.2274]
            }
        }
    ]);
    console.log('Seeded Admin (admin@greenbond.com) and Test User (pugazh@gmail.com).');

    // 5. Seed baseline catalog items if products empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
        console.log('\n--- Seeding baseline marketplace catalog ---');
        const SEED_LOCATION = { lat: 12.2274, lng: 79.0673, address: 'Thiruvannamalai, Tamil Nadu' };
        
        let quickShop = await Shop.findOne({ email: 'quickstore@greenbond.com' });
        if (!quickShop) {
            quickShop = await Shop.create({
                name: 'GreenBond QuickStore',
                ownerName: 'Admin',
                email: 'quickstore@greenbond.com',
                mobile: '9999999992',
                password: userHashedPassword,
                location: SEED_LOCATION,
                locationGeo: { type: 'Point', coordinates: [SEED_LOCATION.lng, SEED_LOCATION.lat] },
                isActive: true,
                role: 'shop'
            });
        }

        let sampleFarmer = await Farmer.findOne({ mobile: '9999999993' });
        if (!sampleFarmer) {
            sampleFarmer = await Farmer.create({
                name: 'Madurai Green Farms',
                mobile: '9999999993',
                location: 'Madurai',
                address: 'Madurai Farm Road',
                lat: 9.9252,
                lng: 78.1198,
                pin: userHashedPassword,
                verificationStatus: 'APPROVED'
            });
        }

        const baselineProducts = [
            {
                title: 'Organic Banana (Yelakki)',
                name: 'Organic Banana (Yelakki)',
                price: '60',
                mrp: '₹75',
                minOrder: '1 kg',
                contact: '9999999993',
                stock: 100,
                unit: 'kg',
                category: 'Fruits',
                farmer: sampleFarmer.name,
                farmerId: sampleFarmer._id,
                sellerId: sampleFarmer._id,
                sellerType: 'FARMER',
                sourceType: 'FARMER',
                marketplaceType: 'FRESH',
                isActive: true,
                rating: 4.8,
                location: 'Madurai',
                image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=800&auto=format&fit=crop'
            },
            {
                title: 'Farm Fresh Tomatoes',
                name: 'Farm Fresh Tomatoes',
                price: '40',
                mrp: '₹50',
                minOrder: '1 kg',
                contact: '9999999993',
                stock: 80,
                unit: 'kg',
                category: 'Vegetables',
                farmer: sampleFarmer.name,
                farmerId: sampleFarmer._id,
                sellerId: sampleFarmer._id,
                sellerType: 'FARMER',
                sourceType: 'FARMER',
                marketplaceType: 'FRESH',
                isActive: true,
                rating: 4.7,
                location: 'Madurai',
                image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=800&auto=format&fit=crop'
            },
            {
                title: 'Aashirvaad Superior MP Atta 5kg',
                name: 'Aashirvaad Superior MP Atta 5kg',
                price: '275',
                mrp: '₹310',
                minOrder: '1 pack',
                contact: '9999999992',
                stock: 50,
                unit: 'pack',
                category: 'Atta, Rice & Dal',
                farmer: 'GreenBond QuickStore',
                sellerId: quickShop._id,
                sellerType: 'SHOP_OWNER',
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                isActive: true,
                rating: 4.9,
                location: 'Thiruvannamalai',
                image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop'
            },
            {
                title: 'Amul Taaza Fresh Toned Milk 1L',
                name: 'Amul Taaza Fresh Toned Milk 1L',
                price: '54',
                mrp: '₹56',
                minOrder: '1 pack',
                contact: '9999999992',
                stock: 120,
                unit: 'pack',
                category: 'Dairy, Bread & Eggs',
                farmer: 'GreenBond QuickStore',
                sellerId: quickShop._id,
                sellerType: 'SHOP_OWNER',
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                isActive: true,
                rating: 4.9,
                location: 'Thiruvannamalai',
                image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800&auto=format&fit=crop'
            },
            {
                title: 'Boat Rockerz 450 Bluetooth Headphone',
                name: 'Boat Rockerz 450 Bluetooth Headphone',
                price: '1499',
                mrp: '₹3990',
                minOrder: '1 piece',
                contact: 'support@greenbond.com',
                stock: 40,
                unit: 'piece',
                category: 'Electronics',
                farmer: 'GreenBond Hub',
                sellerType: 'ADMIN',
                sourceType: 'SHOP',
                marketplaceType: 'SHOPPING',
                isActive: true,
                rating: 4.6,
                location: 'Pan India',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'
            }
        ];

        await Product.insertMany(baselineProducts);
        console.log(`Seeded ${baselineProducts.length} baseline products across FRESH, QUICK, and SHOPPING.`);
    }

    // 6. Summary verification
    const [finalUsers, finalProducts, finalOrders, finalCarts] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Cart.countDocuments()
    ]);

    console.log('\n==================================================');
    console.log('RESET VERIFICATION SUMMARY:');
    console.log(`Users in green_bond: ${finalUsers}`);
    console.log(`Products in green_bond: ${finalProducts}`);
    console.log(`Orders in green_bond: ${finalOrders}`);
    console.log(`Carts in green_bond: ${finalCarts}`);
    console.log('STATUS: PASS');
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
}

safeReset().catch((err) => {
    console.error('Safe reset error:', err);
    process.exit(1);
});
