import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import User from '../models/User.js'; // To get a shop admin/seller id if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond';

const electronics = [
    { name: "iPhone 15", brand: "Apple", price: 79900, originalPrice: 89900 },
    { name: "Samsung Galaxy S24", brand: "Samsung", price: 89999, originalPrice: 99999 },
    { name: "OnePlus Nord", brand: "OnePlus", price: 29999, originalPrice: 31999 },
    { name: "Redmi Phone", brand: "Xiaomi", price: 15999, originalPrice: 18999 },
    { name: "HP Laptop", brand: "HP", price: 54999, originalPrice: 60999 },
    { name: "Dell Laptop", brand: "Dell", price: 56999, originalPrice: 62999 },
    { name: "Lenovo Laptop", brand: "Lenovo", price: 49999, originalPrice: 55999 },
    { name: "Sony Headphones", brand: "Sony", price: 14999, originalPrice: 19999 },
    { name: "Boat Earphones", brand: "boAt", price: 1299, originalPrice: 2999 },
    { name: "Apple Watch", brand: "Apple", price: 41900, originalPrice: 44900 },
    { name: "Power Bank", brand: "Mi", price: 1999, originalPrice: 2499 },
    { name: "Bluetooth Speaker", brand: "JBL", price: 3499, originalPrice: 4999 },
    { name: "USB-C Charger", brand: "Spigen", price: 999, originalPrice: 1499 },
    { name: "Charging Cable", brand: "AmazonBasics", price: 399, originalPrice: 599 }
];

const fashion = [
    { name: "Men’s Shirt", brand: "Peter England", price: 999, originalPrice: 1599 },
    { name: "Men’s T-Shirt", brand: "Puma", price: 599, originalPrice: 1299 },
    { name: "Men’s Jeans", brand: "Levi's", price: 1899, originalPrice: 2999 },
    { name: "Women’s Kurti", brand: "Biba", price: 1199, originalPrice: 1999 },
    { name: "Women’s Dress", brand: "H&M", price: 1499, originalPrice: 2499 },
    { name: "Women’s T-Shirt", brand: "Zara", price: 799, originalPrice: 1299 },
    { name: "Kids T-Shirt", brand: "Mothercare", price: 499, originalPrice: 899 },
    { name: "Sports Shoes", brand: "Nike", price: 3999, originalPrice: 5999 },
    { name: "Slippers", brand: "Crocs", price: 1499, originalPrice: 2999 }
];

const grocery = [
    { name: "Basmati Rice", brand: "Daawat", price: 190, originalPrice: 250 },
    { name: "Toor Dal", brand: "Tata Sampann", price: 160, originalPrice: 190 },
    { name: "Moong Dal", brand: "Tata Sampann", price: 140, originalPrice: 170 },
    { name: "Sugar", brand: "Madhur", price: 55, originalPrice: 65 },
    { name: "Salt", brand: "Tata Salt", price: 25, originalPrice: 28 },
    { name: "Cooking Oil", brand: "Fortune", price: 140, originalPrice: 180 },
    { name: "Wheat Atta", brand: "Aashirvaad", price: 210, originalPrice: 240 },
    { name: "Turmeric Powder", brand: "Everest", price: 70, originalPrice: 90 },
    { name: "Chilli Powder", brand: "MDH", price: 80, originalPrice: 100 },
    { name: "Coriander Powder", brand: "Catch", price: 60, originalPrice: 80 }
];

const snacks = [
    { name: "Biscuits", brand: "Britannia", price: 30, originalPrice: 40 },
    { name: "Chips", brand: "Lay's", price: 20, originalPrice: 20 },
    { name: "Chocolates", brand: "Dairy Milk", price: 150, originalPrice: 160 },
    { name: "Coca-Cola", brand: "Coca-Cola", price: 40, originalPrice: 40 },
    { name: "Pepsi", brand: "Pepsi", price: 40, originalPrice: 40 }
];

// Base list of categories and their items
const seedData = [
    { category: "Electronics", items: electronics },
    { category: "Fashion", items: fashion },
    { category: "Grocery", items: grocery },
    { category: "Snacks & Drinks", items: snacks }
];

const generateProducts = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing SHOPPING products
        await Product.deleteMany({ marketplaceType: 'SHOPPING' });
        console.log("Cleared old SHOPPING products");

        // Use a generic admin user for seller
        const admin = await User.findOne({ role: 'admin' });
        const sellerId = admin ? admin._id : new mongoose.Types.ObjectId();

        const productsToInsert = [];

        // We need 1000+ products. 
        // We will generate variations of the base products to reach 1000.
        let counter = 1;
        while (productsToInsert.length < 1050) {
            for (const cat of seedData) {
                for (const item of cat.items) {
                    if (productsToInsert.length >= 1050) break;

                    const isVariation = counter > 1;
                    const variantName = isVariation ? `${item.name} - Variant ${counter}` : item.name;
                    
                    const priceOffset = isVariation ? Math.floor(Math.random() * 50) : 0;
                    const price = item.price + priceOffset;
                    const originalPrice = item.originalPrice + priceOffset + Math.floor(Math.random() * 20);
                    const discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);

                    productsToInsert.push({
                        title: variantName, // Map to Product model 'title'
                        name: variantName,  // Keep for UI if needed
                        brand: item.brand,
                        category: cat.category,
                        subcategory: cat.category,
                        description: `Premium ${item.name} from ${item.brand}. High quality and sustainable product.`,
                        price: price.toString(),
                        originalPrice: originalPrice.toString(),
                        discountPercentage: discountPercentage,
                        stock: Math.floor(Math.random() * 100) + 10,
                        availableQuantity: Math.floor(Math.random() * 100) + 10,
                        unit: cat.category === 'Grocery' ? '1 kg' : '1 unit',
                        minOrder: '1',
                        image: "/nano_banana.jpg",
                        sellerId: sellerId,
                        sellerType: "ADMIN",
                        sourceType: "SHOP",
                        marketplaceType: "SHOPPING",
                        rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
                        reviewCount: Math.floor(Math.random() * 500),
                        location: "Main Warehouse",
                        contact: "support@greenbond.com",
                        isActive: true,
                        searchKeywords: [item.name.toLowerCase(), item.brand.toLowerCase(), cat.category.toLowerCase()]
                    });
                }
            }
            counter++;
        }

        await Product.insertMany(productsToInsert);
        console.log(`Successfully seeded ${productsToInsert.length} SHOPPING products.`);

        mongoose.connection.close();
    } catch (err) {
        console.error("Error seeding products:", err);
        mongoose.connection.close();
        process.exit(1);
    }
};

generateProducts();
