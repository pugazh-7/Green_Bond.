import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './models/Product.js';
import Shop from './models/Shop.js';
import Farmer from './models/Farmer.js';

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        console.log("\n--- 5. DATABASE COUNTS ---");
        const shoppingCount = await Product.countDocuments({ marketplaceType: 'SHOPPING' });
        const quickCount = await Product.countDocuments({ marketplaceType: 'QUICK' });
        const freshCount = await Product.countDocuments({ marketplaceType: 'FRESH' });
        
        console.log(`SHOPPING PRODUCTS: ${shoppingCount}`);
        console.log(`QUICK PRODUCTS: ${quickCount}`);
        console.log(`FRESH/FARMER PRODUCTS: ${freshCount}`);

        console.log("\n--- 4. MARKETPLACE SEPARATION ---");
        
        const shoppingSellers = await Product.distinct('sellerType', { marketplaceType: 'SHOPPING' });
        console.log(`Shopping Sellers Types: ${shoppingSellers.join(', ')}`);

        const quickSellers = await Product.distinct('sellerType', { marketplaceType: 'QUICK' });
        console.log(`Quick Sellers Types: ${quickSellers.join(', ')}`);

        const freshSellers = await Product.distinct('sellerType', { marketplaceType: 'FRESH' });
        console.log(`Fresh Sellers Types: ${freshSellers.join(', ')}`);
        
        const crossCheck1 = await Product.countDocuments({ marketplaceType: 'SHOPPING', sellerType: 'FARMER' });
        console.log(`Fresh products in Shopping: ${crossCheck1} (Should be 0)`);
        
        const crossCheck2 = await Product.countDocuments({ marketplaceType: 'QUICK', sellerType: 'FARMER' });
        console.log(`Fresh products in Quick: ${crossCheck2} (Should be 0)`);
        
        const crossCheck3 = await Product.countDocuments({ marketplaceType: 'FRESH', sellerType: 'SHOP_OWNER' });
        console.log(`Quick products in Fresh: ${crossCheck3} (Should be 0)`);
        
        console.log("\n--- API ENDPOINTS (MOCK) ---");
        // We will just do DB queries simulating the API logic to see if counts match.
        // Shopping All
        const shoppingAllDb = await Product.countDocuments({ marketplaceType: 'SHOPPING', isActive: true });
        console.log(`SHOPPING All API matching DB logic: ${shoppingAllDb}`);
        
        const quickAllDb = await Product.countDocuments({ marketplaceType: 'QUICK', isActive: true });
        console.log(`QUICK All API matching DB logic: ${quickAllDb}`);
        
        const freshAllDb = await Product.countDocuments({ marketplaceType: 'FRESH', isActive: true });
        console.log(`FRESH All API matching DB logic: ${freshAllDb}`);

        console.log("\n--- CHECKING IMAGES ---");
        const missingImages = await Product.countDocuments({ image: { $exists: false }, images: { $size: 0 } });
        console.log(`Products missing images: ${missingImages}`);
        
        const productsWithImage = await Product.find({ $or: [{image: {$exists: true, $ne: ""}}, {'images.0': {$exists: true}}] }).limit(5);
        console.log("Sample product images:");
        productsWithImage.forEach(p => {
            console.log(`- ${p.name} (${p.marketplaceType}): ${p.image || (p.images && p.images[0])}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

verify();
