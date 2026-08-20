import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const electronics = [
    { brand: "Apple", name: "iPhone", type: "Smartphone", category: "Electronics", subcat: "Mobiles", priceBase: 60000, max: 150000, img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=500&auto=format&fit=crop" },
    { brand: "Samsung", name: "Galaxy", type: "Smartphone", category: "Electronics", subcat: "Mobiles", priceBase: 15000, max: 120000, img: "https://images.unsplash.com/photo-1610945265064-3254de8ff129?q=80&w=500&auto=format&fit=crop" },
    { brand: "OnePlus", name: "Nord", type: "Smartphone", category: "Electronics", subcat: "Mobiles", priceBase: 20000, max: 40000, img: "https://images.unsplash.com/photo-1678911820864-e2c5ce217c46?q=80&w=500&auto=format&fit=crop" },
    { brand: "Dell", name: "Inspiron", type: "Laptop", category: "Electronics", subcat: "Laptops", priceBase: 40000, max: 80000, img: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=500&auto=format&fit=crop" },
    { brand: "HP", name: "Pavilion", type: "Laptop", category: "Electronics", subcat: "Laptops", priceBase: 45000, max: 75000, img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&auto=format&fit=crop" },
    { brand: "Sony", name: "WH-1000X", type: "Headphones", category: "Electronics", subcat: "Audio", priceBase: 15000, max: 35000, img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=500&auto=format&fit=crop" },
    { brand: "Boat", name: "Rockerz", type: "Earphones", category: "Electronics", subcat: "Audio", priceBase: 1000, max: 3000, img: "https://images.unsplash.com/photo-1557825835-b243fc46b149?q=80&w=500&auto=format&fit=crop" },
    { brand: "Apple", name: "Watch Series", type: "Smartwatch", category: "Electronics", subcat: "Wearables", priceBase: 25000, max: 50000, img: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=500&auto=format&fit=crop" }
];

const fashion = [
    { brand: "Levis", name: "Classic Jeans", type: "Men", category: "Fashion", subcat: "Jeans", priceBase: 1500, max: 3500, img: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500&auto=format&fit=crop" },
    { brand: "Peter England", name: "Cotton Shirt", type: "Men", category: "Fashion", subcat: "Shirts", priceBase: 900, max: 2000, img: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=500&auto=format&fit=crop" },
    { brand: "Puma", name: "Graphic T-Shirt", type: "Men", category: "Fashion", subcat: "T-Shirts", priceBase: 600, max: 1500, img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop" },
    { brand: "Nike", name: "Running Shoes", type: "Unisex", category: "Fashion", subcat: "Footwear", priceBase: 3000, max: 8000, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500&auto=format&fit=crop" },
    { brand: "Biba", name: "Cotton Kurti", type: "Women", category: "Fashion", subcat: "Ethnic", priceBase: 1200, max: 3000, img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=500&auto=format&fit=crop" },
    { brand: "H&M", name: "Floral Dress", type: "Women", category: "Fashion", subcat: "Dresses", priceBase: 1500, max: 4000, img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=500&auto=format&fit=crop" }
];

const grocery = [
    { brand: "India Gate", name: "Basmati Rice", type: "5kg", category: "Grocery", subcat: "Rice", priceBase: 500, max: 800, img: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=500&auto=format&fit=crop" },
    { brand: "Tata", name: "Toor Dal", type: "1kg", category: "Grocery", subcat: "Dal", priceBase: 150, max: 200, img: "https://images.unsplash.com/photo-1585232986252-870098df2334?q=80&w=500&auto=format&fit=crop" },
    { brand: "Madhur", name: "Refined Sugar", type: "1kg", category: "Grocery", subcat: "Sugar", priceBase: 40, max: 55, img: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?q=80&w=500&auto=format&fit=crop" },
    { brand: "Fortune", name: "Sunflower Oil", type: "1L", category: "Grocery", subcat: "Oil", priceBase: 120, max: 160, img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=500&auto=format&fit=crop" },
    { brand: "Aashirvaad", name: "Wheat Atta", type: "5kg", category: "Grocery", subcat: "Atta", priceBase: 220, max: 300, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=500&auto=format&fit=crop" },
    { brand: "Everest", name: "Masala Powder", type: "100g", category: "Grocery", subcat: "Spices", priceBase: 30, max: 80, img: "https://images.unsplash.com/photo-1596647900350-13f56ecb5ea8?q=80&w=500&auto=format&fit=crop" }
];

const snacks = [
    { brand: "Lays", name: "Potato Chips", type: "Packet", category: "Snacks", subcat: "Chips", priceBase: 10, max: 50, img: "https://images.unsplash.com/photo-1566478989037-e98748d56b46?q=80&w=500&auto=format&fit=crop" },
    { brand: "Oreo", name: "Cookies", type: "Packet", category: "Snacks", subcat: "Biscuits", priceBase: 10, max: 40, img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=500&auto=format&fit=crop" },
    { brand: "Cadbury", name: "Dairy Milk", type: "Bar", category: "Snacks", subcat: "Chocolates", priceBase: 20, max: 150, img: "https://images.unsplash.com/photo-1548880629-8735237887d1?q=80&w=500&auto=format&fit=crop" },
    { brand: "Coca-Cola", name: "Cold Drink", type: "Bottle", category: "Drinks", subcat: "Beverages", priceBase: 40, max: 90, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop" }
];

const personalCare = [
    { brand: "Dove", name: "Shampoo", type: "Bottle", category: "Personal Care", subcat: "Hair", priceBase: 150, max: 400, img: "https://images.unsplash.com/photo-1631730486784-5456119f69ae?q=80&w=500&auto=format&fit=crop" },
    { brand: "Colgate", name: "Toothpaste", type: "Tube", category: "Personal Care", subcat: "Dental", priceBase: 50, max: 150, img: "https://images.unsplash.com/photo-1559404285-d856037eecba?q=80&w=500&auto=format&fit=crop" },
    { brand: "Dettol", name: "Soap", type: "Bar", category: "Personal Care", subcat: "Bath", priceBase: 35, max: 50, img: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=500&auto=format&fit=crop" }
];

const getRand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateProducts = (baseArray, count) => {
    let products = [];
    const models = ["Plus", "Pro", "Max", "Ultra", "Lite", "Essential", "Premium", "Advanced", "Original", "Classic"];
    const colors = ["Black", "White", "Blue", "Red", "Green", "Silver", "Gold", "Grey"];
    
    for (let i = 0; i < count; i++) {
        const base = baseArray[getRand(0, baseArray.length - 1)];
        const modelSuffix = models[getRand(0, models.length - 1)];
        const colorSuffix = colors[getRand(0, colors.length - 1)];
        
        let title = `${base.brand} ${base.name} ${modelSuffix}`;
        if (base.category === "Fashion" || base.category === "Electronics") {
            title += ` (${colorSuffix})`;
        } else if (base.category === "Grocery") {
            title = `${base.brand} ${base.name} Premium Quality`;
        }

        const price = getRand(base.priceBase, base.max);
        
        products.push({
            title: title,
            brand: base.brand,
            category: base.category,
            subcategory: base.subcat,
            price: price.toString(),
            minOrder: "1",
            availableQuantity: getRand(10, 500),
            unit: base.type === "5kg" || base.type === "1kg" ? "bag" : (base.type === "Bottle" ? "bottle" : "piece"),
            marketplaceType: "SHOPPING",
            sellerType: "ADMIN",
            sourceType: "SHOP",
            location: "Pan India",
            contact: "support@greenbond.com",
            rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
            reviewCount: getRand(10, 1000),
            image: base.img,
            searchKeywords: [base.brand.toLowerCase(), base.name.toLowerCase(), base.category.toLowerCase(), base.subcat.toLowerCase()],
            description: `High quality ${base.name} by ${base.brand}. Authentic and guaranteed.`
        });
    }
    return products;
};

const runSeeder = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");
        
        console.log("Generating 1000+ products...");
        let allProducts = [];
        allProducts = allProducts.concat(generateProducts(electronics, 350));
        allProducts = allProducts.concat(generateProducts(fashion, 300));
        allProducts = allProducts.concat(generateProducts(grocery, 250));
        allProducts = allProducts.concat(generateProducts(snacks, 100));
        allProducts = allProducts.concat(generateProducts(personalCare, 50));
        
        console.log(`Generated ${allProducts.length} products. Inserting...`);
        
        // Chunk inserts to avoid massive RAM spikes
        const chunkSize = 200;
        for (let i = 0; i < allProducts.length; i += chunkSize) {
            const chunk = allProducts.slice(i, i + chunkSize);
            await Product.insertMany(chunk);
            console.log(`Inserted chunk ${i / chunkSize + 1}`);
        }
        
        console.log("All 1000+ products successfully seeded!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runSeeder();
