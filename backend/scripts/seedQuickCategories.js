import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const QUICK_PRODUCTS = [
    // --- ELECTRONICS (Return Eligible: 7 Days) ---
    {
        name: 'Boat Airdopes 141 TWS Earbuds',
        brand: 'Boat',
        category: 'Electronics',
        subcategory: 'Audio',
        price: '1299',
        mrp: '4490',
        discountPercentage: 71,
        unit: 'piece',
        stock: 45,
        rating: 4.4,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Noise ColorFit Pulse Smartwatch',
        brand: 'Noise',
        category: 'Electronics',
        subcategory: 'Wearables',
        price: '1499',
        mrp: '4999',
        discountPercentage: 70,
        unit: 'piece',
        stock: 30,
        rating: 4.3,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Logitech B170 Wireless Mouse',
        brand: 'Logitech',
        category: 'Electronics',
        subcategory: 'Accessories',
        price: '599',
        mrp: '895',
        discountPercentage: 33,
        unit: 'piece',
        stock: 50,
        rating: 4.5,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'HP K1500 Wired Multimedia Keyboard',
        brand: 'HP',
        category: 'Electronics',
        subcategory: 'Accessories',
        price: '499',
        mrp: '999',
        discountPercentage: 50,
        unit: 'piece',
        stock: 25,
        rating: 4.2,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Boat Stone 190 Bluetooth Speaker 5W',
        brand: 'Boat',
        category: 'Electronics',
        subcategory: 'Speakers',
        price: '999',
        mrp: '2990',
        discountPercentage: 66,
        unit: 'piece',
        stock: 40,
        rating: 4.6,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Ambrane 10000mAh Power Bank (22.5W Fast)',
        brand: 'Ambrane',
        category: 'Electronics',
        subcategory: 'Power',
        price: '899',
        mrp: '1999',
        discountPercentage: 55,
        unit: 'piece',
        stock: 35,
        rating: 4.4,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Portronics 20W Type-C Fast Adapter',
        brand: 'Portronics',
        category: 'Electronics',
        subcategory: 'Chargers',
        price: '399',
        mrp: '999',
        discountPercentage: 60,
        unit: 'piece',
        stock: 60,
        rating: 4.5,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Sony WH-1000XM4 Noise Cancelling Headphones',
        brand: 'Sony',
        category: 'Electronics',
        subcategory: 'Audio',
        price: '19990',
        mrp: '29990',
        discountPercentage: 33,
        unit: 'piece',
        stock: 15,
        rating: 4.8,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop'
    },

    // --- FURNITURE (Return Eligible: 7 Days) ---
    {
        name: 'Ergonomic High-Back Mesh Office Chair',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Chairs',
        price: '3499',
        mrp: '7999',
        discountPercentage: 56,
        unit: 'piece',
        stock: 20,
        rating: 4.7,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1580481077195-c3ef05118f6d?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Wooden Foldable Laptop Study Desk Table',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Tables',
        price: '699',
        mrp: '1499',
        discountPercentage: 53,
        unit: 'piece',
        stock: 40,
        rating: 4.4,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Modern 3-Tier Wooden Bookshelf / Display Rack',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Shelves',
        price: '1299',
        mrp: '2999',
        discountPercentage: 56,
        unit: 'piece',
        stock: 25,
        rating: 4.5,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Bedside Engineered Wood Nightstand Table',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Tables',
        price: '999',
        mrp: '2499',
        discountPercentage: 60,
        unit: 'piece',
        stock: 30,
        rating: 4.3,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Comfort Foam Bean Bag XXL (Filled)',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Seating',
        price: '1199',
        mrp: '2999',
        discountPercentage: 60,
        unit: 'piece',
        stock: 35,
        rating: 4.6,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Solid Wood Indoor Plant Stand (Set of 2)',
        brand: 'GreenBond Living',
        category: 'Furniture',
        subcategory: 'Stands',
        price: '499',
        mrp: '999',
        discountPercentage: 50,
        unit: 'pair',
        stock: 45,
        rating: 4.5,
        isReturnable: true,
        returnPolicy: '7 Days Return',
        image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=400&auto=format&fit=crop'
    },

    // --- GIFTS (Non-Returnable) ---
    {
        name: 'Ferrero Rocher Premium Chocolates (16 pcs)',
        brand: 'Ferrero',
        category: 'Gifts',
        subcategory: 'Chocolates',
        price: '499',
        mrp: '599',
        discountPercentage: 16,
        unit: 'pack',
        stock: 60,
        rating: 4.8,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Fresh Red Rose Bouquet (6 Stems)',
        brand: 'Ferns N Petals',
        category: 'Gifts',
        subcategory: 'Flowers',
        price: '299',
        mrp: '499',
        discountPercentage: 40,
        unit: 'pack',
        stock: 30,
        rating: 4.7,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55ef6?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Cadbury Celebrations Rich Dry Fruit Box',
        brand: 'Cadbury',
        category: 'Gifts',
        subcategory: 'Chocolates',
        price: '350',
        mrp: '450',
        discountPercentage: 22,
        unit: 'box',
        stock: 50,
        rating: 4.6,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Aromatherapy Scented Glass Candle (Vanilla & Lavender)',
        brand: 'GreenBond Gifts',
        category: 'Gifts',
        subcategory: 'Decor',
        price: '249',
        mrp: '499',
        discountPercentage: 50,
        unit: 'piece',
        stock: 40,
        rating: 4.5,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Cute Plush Teddy Bear (12 inch Pink)',
        brand: 'GreenBond Gifts',
        category: 'Gifts',
        subcategory: 'Toys',
        price: '349',
        mrp: '699',
        discountPercentage: 50,
        unit: 'piece',
        stock: 35,
        rating: 4.6,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584849611980-60b64d0d0812?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Birthday Greeting Card & Envelope',
        brand: 'Archies',
        category: 'Gifts',
        subcategory: 'Cards',
        price: '99',
        mrp: '149',
        discountPercentage: 33,
        unit: 'piece',
        stock: 80,
        rating: 4.4,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop'
    },

    // --- MEDICINES (Non-Returnable) ---
    {
        name: 'Dolo 650mg Paracetamol Tablets (Strip of 15)',
        brand: 'Micro Labs',
        category: 'Medicines',
        subcategory: 'Fever & Pain',
        price: '32',
        mrp: '35',
        discountPercentage: 8,
        unit: 'strip',
        stock: 120,
        rating: 4.9,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Volini Instant Pain Relief Spray 100g',
        brand: 'Volini',
        category: 'Medicines',
        subcategory: 'Pain Relief',
        price: '145',
        mrp: '170',
        discountPercentage: 14,
        unit: 'can',
        stock: 75,
        rating: 4.8,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Vicks Vaporub Balm for Cold & Cough 50g',
        brand: 'Vicks',
        category: 'Medicines',
        subcategory: 'Cold & Cough',
        price: '85',
        mrp: '95',
        discountPercentage: 10,
        unit: 'jar',
        stock: 90,
        rating: 4.8,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Hansaplast Washproof Band-Aids (Pack of 20)',
        brand: 'Hansaplast',
        category: 'Medicines',
        subcategory: 'First Aid',
        price: '60',
        mrp: '70',
        discountPercentage: 14,
        unit: 'pack',
        stock: 100,
        rating: 4.7,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Digital Infrared Forehead & Body Thermometer',
        brand: 'Dr. Morepen',
        category: 'Medicines',
        subcategory: 'Devices',
        price: '499',
        mrp: '1299',
        discountPercentage: 61,
        unit: 'piece',
        stock: 35,
        rating: 4.6,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Limcee Vitamin C 500mg Chewable (Strip of 15)',
        brand: 'Abbott',
        category: 'Medicines',
        subcategory: 'Immunity & Vitamins',
        price: '25',
        mrp: '28',
        discountPercentage: 10,
        unit: 'strip',
        stock: 150,
        rating: 4.8,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'Dettol Antiseptic Disinfectant Liquid 250ml',
        brand: 'Dettol',
        category: 'Medicines',
        subcategory: 'Antiseptics',
        price: '120',
        mrp: '135',
        discountPercentage: 11,
        unit: 'bottle',
        stock: 80,
        rating: 4.9,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=400&auto=format&fit=crop'
    },
    {
        name: 'First Aid Emergency Care Kit with Essentials',
        brand: 'GreenBond Pharmacy',
        category: 'Medicines',
        subcategory: 'First Aid',
        price: '349',
        mrp: '699',
        discountPercentage: 50,
        unit: 'kit',
        stock: 40,
        rating: 4.7,
        isReturnable: false,
        returnPolicy: 'Non-Returnable',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop'
    }
];

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log("Connected.");

        // 1. Ensure QuickMart shop exists
        let quickMart = await Shop.findOne({ email: "quickmart@greenbond.com" });
        if (!quickMart) {
            quickMart = await Shop.create({
                name: "GreenBond QuickHub & Pharmacy",
                email: "quickmart@greenbond.com",
                phone: "9876543210",
                locationGeo: {
                    type: "Point",
                    coordinates: [77.5946, 12.9716] // Center Point
                },
                locationText: "Main Market, Srivilliputhur / Madurai",
                isActive: true,
                rating: 4.8
            });
            console.log("Created GreenBond QuickHub shop.");
        }

        // 2. Remove any old non-aligned Quick products
        await Product.deleteMany({ marketplaceType: 'QUICK' });
        console.log("Cleared old Quick products.");

        // 3. Insert specific Quick products (Electronics, Gifts, Furniture, Medicines)
        const productsToInsert = QUICK_PRODUCTS.map(p => ({
            ...p,
            sellerId: quickMart._id,
            sellerType: 'SHOP_OWNER',
            sourceType: 'SHOP',
            marketplaceType: 'QUICK',
            location: 'Srivilliputhur / Madurai',
            contact: '9876543210',
            minOrder: '1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const inserted = await Product.insertMany(productsToInsert);
        console.log(`Successfully seeded ${inserted.length} Quick products across Electronics, Gifts, Furniture, and Medicines.`);

        // 4. Clean Shopping products: Remove Electronics, Furniture, Gifts, Mobiles, Laptops from Shopping so Shopping strictly contains Fashion, Groceries, etc.
        const removedFromShopping = await Product.deleteMany({
            marketplaceType: 'SHOPPING',
            category: { $in: ['Electronics', 'Furniture', 'Gifts', 'Mobiles', 'Laptops', 'Medicines'] }
        });
        console.log(`Cleaned up Shopping collection: removed ${removedFromShopping.deletedCount} items that belong to Quick.`);

        console.log("================ SEED COMPLETE ================");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

run();
