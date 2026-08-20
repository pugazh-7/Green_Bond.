import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Farmer from '../models/Farmer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('MongoDB connected for seeding');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const SEED_LOCATION = {
    lat: 12.2274, // Thiruvannamalai approx
    lng: 79.0673,
    address: 'Thiruvannamalai, Tamil Nadu'
};

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing old seed data...');
        // Only clear products that were seeded (we will identify them by a specific dummy seller if we need to, but let's clear all for clean slate)
        await Product.deleteMany({});
        await Shop.deleteMany({ name: 'GreenBond MegaMart' });
        await Shop.deleteMany({ name: 'GreenBond QuickStore' });
        await Farmer.deleteMany({ name: 'GreenBond Verified Farmer' });

        console.log('Creating dummy sellers for location context...');

        // Create a central Shopping Store
        const megaMart = await Shop.create({
            name: 'GreenBond MegaMart',
            ownerName: 'Admin',
            mobile: '9999999991',
            password: 'password123',
            location: SEED_LOCATION,
            locationGeo: {
                type: 'Point',
                coordinates: [SEED_LOCATION.lng, SEED_LOCATION.lat]
            },
            isActive: true,
            role: 'shop'
        });

        // Create a quick commerce local store
        const quickStore = await Shop.create({
            name: 'GreenBond QuickStore',
            ownerName: 'Admin',
            mobile: '9999999992',
            password: 'password123',
            location: SEED_LOCATION,
            locationGeo: {
                type: 'Point',
                coordinates: [SEED_LOCATION.lng, SEED_LOCATION.lat]
            },
            isActive: true,
            role: 'shop'
        });

        // Create a verified Farmer
        const farmer = await Farmer.create({
            name: 'GreenBond Verified Farmer',
            mobile: '9999999993',
            location: 'Thiruvannamalai Village',
            pin: '606601',
            verificationStatus: 'APPROVED',
            farmLocation: SEED_LOCATION,
            farmLocationGeo: {
                type: 'Point',
                coordinates: [SEED_LOCATION.lng, SEED_LOCATION.lat]
            },
            serviceRadius: 30
        });

        console.log('Inserting products...');

        const products = [
            // ==========================
            // QUICK COMMERCE PRODUCTS
            // ==========================
            {
                title: 'Aavin Standardized Milk (Green)',
                brand: 'Aavin',
                category: 'Milk & Dairy',
                subcategory: 'Milk',
                price: '22',
                unit: '500ml',
                minOrder: '1',
                availableQuantity: 100,
                location: SEED_LOCATION.address,
                contact: quickStore.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                sellerId: quickStore._id,
                rating: 4.8,
                reviewCount: 450,
                image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['milk', 'paal', 'பால்', 'dairy', 'aavin'],
                description: 'Fresh Aavin green packet milk. Standardized milk for daily use.'
            },
            {
                title: 'Modern Bread (White)',
                brand: 'Modern',
                category: 'Bakery',
                subcategory: 'Bread',
                price: '40',
                unit: '400g',
                minOrder: '1',
                availableQuantity: 50,
                location: SEED_LOCATION.address,
                contact: quickStore.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                sellerId: quickStore._id,
                rating: 4.2,
                reviewCount: 120,
                image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['bread', 'bun', 'loaf'],
                description: 'Soft and fresh white sliced bread.'
            },
            {
                title: 'Lays Classic Salted Potato Chips',
                brand: 'Lays',
                category: 'Snacks',
                subcategory: 'Chips',
                price: '20',
                unit: '50g',
                minOrder: '1',
                availableQuantity: 200,
                location: SEED_LOCATION.address,
                contact: quickStore.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                sellerId: quickStore._id,
                rating: 4.9,
                reviewCount: 890,
                image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['chips', 'lays', 'snacks', 'potato'],
                description: 'Classic salted potato chips by Lays.'
            },
            {
                title: 'Kinley Packaged Drinking Water',
                brand: 'Kinley',
                category: 'Drinks',
                subcategory: 'Water',
                price: '20',
                unit: '1L',
                minOrder: '1',
                availableQuantity: 150,
                location: SEED_LOCATION.address,
                contact: quickStore.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                sellerId: quickStore._id,
                rating: 4.5,
                reviewCount: 300,
                image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['water', 'thanni', 'தண்ணீர்', 'bottle'],
                description: 'Safe and pure drinking water.'
            },
            {
                title: 'Apple iPhone 20W USB-C Power Adapter',
                brand: 'Apple',
                category: 'Electronics',
                subcategory: 'Chargers',
                price: '1900',
                unit: '1 item',
                minOrder: '1',
                availableQuantity: 10,
                location: SEED_LOCATION.address,
                contact: quickStore.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'QUICK',
                sellerId: quickStore._id,
                rating: 4.7,
                reviewCount: 1500,
                image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=500&q=60', // Using a generic adapter image
                searchKeywords: ['charger', 'iphone', 'adapter', 'plug', 'apple'],
                description: 'Fast charging 20W adapter for iPhones.'
            },

            // ==========================
            // SHOPPING MARKETPLACE
            // ==========================
            {
                title: 'Sony WH-1000XM5 Wireless Headphones',
                brand: 'Sony',
                category: 'Electronics',
                subcategory: 'Headphones',
                price: '29990',
                unit: '1 item',
                minOrder: '1',
                availableQuantity: 5,
                location: SEED_LOCATION.address,
                contact: megaMart.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'SHOPPING',
                sellerId: megaMart._id,
                rating: 4.9,
                reviewCount: 3200,
                image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['headphones', 'sony', 'audio', 'earphones', 'headset', 'xm5'],
                description: 'Industry leading noise canceling wireless headphones.'
            },
            {
                title: 'Men\'s Casual Cotton Shirt (Blue)',
                brand: 'Peter England',
                category: 'Fashion',
                subcategory: 'Shirts',
                price: '1299',
                unit: '1 piece',
                minOrder: '1',
                availableQuantity: 25,
                location: SEED_LOCATION.address,
                contact: megaMart.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'SHOPPING',
                sellerId: megaMart._id,
                rating: 4.3,
                reviewCount: 410,
                image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e98?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['shirt', 'clothes', 'dress', 'men', 'cotton'],
                description: 'Comfortable 100% cotton casual shirt for men.'
            },
            {
                title: 'Pears Pure & Gentle Soap',
                brand: 'Pears',
                category: 'Personal Care',
                subcategory: 'Soap',
                price: '55',
                unit: '125g',
                minOrder: '1',
                availableQuantity: 100,
                location: SEED_LOCATION.address,
                contact: megaMart.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'SHOPPING',
                sellerId: megaMart._id,
                rating: 4.6,
                reviewCount: 900,
                image: 'https://images.unsplash.com/photo-1600857062241-9efa05d02d04?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['soap', 'pears', 'bath', 'சோப்பு'],
                description: 'Glycerin based gentle bathing bar.'
            },
            {
                title: 'India Gate Basmati Rice (Classic)',
                brand: 'India Gate',
                category: 'Groceries',
                subcategory: 'Rice',
                price: '210',
                unit: '1kg',
                minOrder: '1',
                availableQuantity: 80,
                location: SEED_LOCATION.address,
                contact: megaMart.mobile,
                sourceType: 'SHOP',
                marketplaceType: 'SHOPPING',
                sellerId: megaMart._id,
                rating: 4.8,
                reviewCount: 2100,
                image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['rice', 'arisi', 'அரிசி', 'basmati', 'grocery'],
                description: 'Premium long grain basmati rice.'
            },

            // ==========================
            // FRESH FARMER MARKETPLACE
            // ==========================
            {
                title: 'Fresh Farm Tomatoes (Naatu Thakkali)',
                farmer: farmer.name,
                category: 'Vegetables',
                subcategory: 'Fresh Produce',
                price: '40',
                unit: '1kg',
                minOrder: '1',
                availableQuantity: 50,
                location: farmer.location,
                contact: farmer.mobile,
                sourceType: 'FARMER',
                marketplaceType: 'FRESH',
                sellerId: farmer._id,
                farmerId: farmer._id,
                rating: 4.9,
                reviewCount: 85,
                image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['tomato', 'thakkali', 'தக்காளி', 'vegetable', 'veg'],
                description: 'Organic country tomatoes plucked today morning.'
            },
            {
                title: 'Organic Spinach (Palak Keerai)',
                farmer: farmer.name,
                category: 'Greens',
                subcategory: 'Fresh Produce',
                price: '15',
                unit: '1 bunch',
                minOrder: '2',
                availableQuantity: 30,
                location: farmer.location,
                contact: farmer.mobile,
                sourceType: 'FARMER',
                marketplaceType: 'FRESH',
                sellerId: farmer._id,
                farmerId: farmer._id,
                rating: 4.7,
                reviewCount: 42,
                image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['spinach', 'keerai', 'கீரை', 'greens', 'palak'],
                description: 'Pesticide-free fresh spinach bunches.'
            },
            {
                title: 'Hill Bananas (Malai Vazhai)',
                farmer: farmer.name,
                category: 'Fruits',
                subcategory: 'Fresh Produce',
                price: '80',
                unit: '1 Dozen',
                minOrder: '1',
                availableQuantity: 20,
                location: farmer.location,
                contact: farmer.mobile,
                sourceType: 'FARMER',
                marketplaceType: 'FRESH',
                sellerId: farmer._id,
                farmerId: farmer._id,
                rating: 4.8,
                reviewCount: 110,
                image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=60',
                searchKeywords: ['banana', 'vazhaipazham', 'வாழைப்பழம்', 'fruit'],
                description: 'Sweet and healthy hill bananas directly from the farm.'
            }
        ];

        await Product.insertMany(products);
        console.log(`Successfully seeded ${products.length} products!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
