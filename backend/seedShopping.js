import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

// Reusable Image Generation Prompt Function
export const generateImagePrompt = (productName, brand, category, subcategory, variant, size) => {
    let base = `professional commercial product photography, ${productName} by ${brand}, `;
    if (size) base += `${size} packaging, `;
    
    if (category === 'Fashion') {
        base += `clean studio background, front-facing garment, accurate fabric texture, realistic folds, catalog photography, high detail, single product, centered composition, no watermark`;
    } else if (category === 'Grocery' || category === 'Snacks') {
        base += `clean white studio background, front-facing product, realistic proportions, sharp details, e-commerce catalog photography, single product, centered composition, no extra objects, no text distortion, no watermark`;
    } else if (category === 'Electronics') {
        base += `clean studio lighting, highly detailed tech product, sleek design, sharp focus, 4k resolution, e-commerce style, isolated on white background`;
    } else {
        base += `high resolution, clean background, centered, professional studio lighting, e-commerce ready`;
    }
    
    return base;
};

// Data Dictionaries for Generation
const categories = {
    Electronics: {
        subcats: ["Smartphones", "Laptops", "Audio", "Accessories"],
        brands: ["Samsung", "Apple", "Sony", "HP", "Dell", "OnePlus", "JBL", "Logitech"],
        imgMap: {
            "Smartphones": "https://images.unsplash.com/photo-1598327105666-5b89351cb315?w=500&q=80",
            "Laptops": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80",
            "Audio": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80",
            "Accessories": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80"
        },
        aliases: ["tech", "gadgets", "elec"],
        tags: ["electronics", "digital"]
    },
    Fashion: {
        subcats: ["Men's Shirts", "Women's Dresses", "Kids Clothing", "Footwear"],
        brands: ["Levi's", "Nike", "Adidas", "Puma", "Biba", "Peter England", "H&M"],
        imgMap: {
            "Men's Shirts": "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=500&q=80",
            "Women's Dresses": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80",
            "Kids Clothing": "https://images.unsplash.com/photo-1519272367469-65eb00171ff7?w=500&q=80",
            "Footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"
        },
        aliases: ["dress", "clothing", "apparel", "sattai", "சட்டை"],
        tags: ["wear", "style"]
    },
    Grocery: {
        subcats: ["Rice", "Dal", "Spices", "Oil", "Atta"],
        brands: ["India Gate", "Tata", "Aashirvaad", "Fortune", "Everest"],
        imgMap: {
            "Rice": "https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&q=80",
            "Dal": "https://images.unsplash.com/photo-1585232986252-870098df2334?w=500&q=80",
            "Spices": "https://images.unsplash.com/photo-1596647900350-13f56ecb5ea8?w=500&q=80",
            "Oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80",
            "Atta": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80"
        },
        aliases: ["provisions", "mooligai", "arisi", "அரிசி"],
        tags: ["food", "cooking"]
    },
    Snacks: {
        subcats: ["Chips", "Biscuits", "Chocolates", "Beverages"],
        brands: ["Lays", "Britannia", "Cadbury", "Coca-Cola", "Pepsi"],
        imgMap: {
            "Chips": "https://images.unsplash.com/photo-1566478989037-e98748d56b46?w=500&q=80",
            "Biscuits": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80",
            "Chocolates": "https://images.unsplash.com/photo-1548880629-8735237887d1?w=500&q=80",
            "Beverages": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"
        },
        aliases: ["snacks", "drinks", "thini"],
        tags: ["tasty", "refreshment"]
    },
    Dairy: {
        subcats: ["Milk", "Curd", "Paneer", "Butter", "Eggs"],
        brands: ["Amul", "Aavin", "Milky Mist", "Nandini"],
        imgMap: {
            "Milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
            "Curd": "https://images.unsplash.com/photo-1584279762118-20d43a6d65be?w=500&q=80",
            "Paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80",
            "Butter": "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80",
            "Eggs": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80"
        },
        aliases: ["dairy", "paal", "பால்"],
        tags: ["fresh", "morning"]
    },
    PersonalCare: {
        subcats: ["Shampoo", "Soap", "Toothpaste", "Deodorant"],
        brands: ["Dove", "Lifebuoy", "Colgate", "Axe", "Nivea"],
        imgMap: {
            "Shampoo": "https://images.unsplash.com/photo-1631730486784-5456119f69ae?w=500&q=80",
            "Soap": "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=500&q=80",
            "Toothpaste": "https://images.unsplash.com/photo-1559404285-d856037eecba?w=500&q=80",
            "Deodorant": "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500&q=80"
        },
        aliases: ["care", "bath", "soppu", "சோப்பு"],
        tags: ["hygiene", "body"]
    }
};

const getRand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateProductSet = (categoryName, targetCount) => {
    let products = [];
    const catData = categories[categoryName];
    if (!catData) return [];

    const models = ["Plus", "Pro", "Max", "Ultra", "Lite", "Essential", "Premium", "Classic", "Gold", "Silver", "Basic", "Advanced"];
    
    for (let i = 0; i < targetCount; i++) {
        const subcat = catData.subcats[getRand(0, catData.subcats.length - 1)];
        const brand = catData.brands[getRand(0, catData.brands.length - 1)];
        const modelSuffix = models[getRand(0, models.length - 1)];
        
        let title = `${brand} ${subcat.replace(/s$/, '')} ${modelSuffix}`;
        let basePrice = getRand(100, 5000);
        if (categoryName === 'Electronics') basePrice = getRand(1000, 100000);
        
        const discountPercentage = getRand(5, 40);
        const price = Math.round(basePrice * (1 - discountPercentage/100));

        products.push({
            title: title,
            brand: brand,
            category: categoryName,
            subcategory: subcat,
            price: price.toString(),
            originalPrice: basePrice.toString(),
            discountPercentage: discountPercentage,
            minOrder: "1",
            availableQuantity: getRand(10, 500),
            unit: "piece",
            marketplaceType: "SHOPPING",
            sellerType: "ADMIN",
            sourceType: "SHOP",
            location: "Pan India",
            contact: "support@greenbond.com",
            rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
            reviewCount: getRand(10, 1000),
            image: catData.imgMap[subcat],
            searchKeywords: [brand.toLowerCase(), subcat.toLowerCase(), categoryName.toLowerCase(), title.toLowerCase()],
            aliases: catData.aliases,
            tags: catData.tags,
            isActive: true,
            description: `High quality ${title} by ${brand}. Authentic and guaranteed.`
        });
    }
    return products;
};

const runSeeder = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");
        
        console.log("Dropping existing SHOPPING products (ADMIN only) to start fresh...");
        await Product.deleteMany({ marketplaceType: "SHOPPING", sellerType: "ADMIN" });

        console.log("Generating 1000+ targeted SHOPPING products...");
        let allProducts = [];
        
        // Exact target constraints provided by user
        allProducts = allProducts.concat(generateProductSet('Electronics', 200));
        allProducts = allProducts.concat(generateProductSet('Fashion', 200));
        allProducts = allProducts.concat(generateProductSet('Grocery', 250));
        allProducts = allProducts.concat(generateProductSet('Snacks', 150));
        allProducts = allProducts.concat(generateProductSet('Dairy', 100));
        allProducts = allProducts.concat(generateProductSet('PersonalCare', 150));
        
        console.log(`Generated ${allProducts.length} unique products. Inserting...`);
        
        const chunkSize = 200;
        for (let i = 0; i < allProducts.length; i += chunkSize) {
            const chunk = allProducts.slice(i, i + chunkSize);
            await Product.insertMany(chunk);
            console.log(`Inserted chunk ${i / chunkSize + 1} of ${Math.ceil(allProducts.length/chunkSize)}`);
        }
        
        console.log(`All ${allProducts.length} Shopping products successfully seeded!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runSeeder();
