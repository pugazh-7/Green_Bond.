import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Product from './models/Product.js';
import Shop from './models/Shop.js';

dotenv.config();

const SHOPPING_PRODUCTS = [
    // Electronics (14 products)
    {
        name: "iPhone 15 Pro Max 256GB", brand: "Apple", category: "Electronics", subcategory: "Mobiles",
        price: "159900", mrp: "169900", minOrder: "1", stock: 50, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.9, reviewCount: 245,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["iphone 15", "apple", "mobile", "phone", "smartphone", "cellphone", "ios", "போன்", "iphone"],
        description: "Latest iPhone 15 Pro Max with titanium body and A17 Pro chip."
    },
    {
        name: "Samsung Galaxy S24 Ultra 5G", brand: "Samsung", category: "Electronics", subcategory: "Mobiles",
        price: "129999", mrp: "134999", minOrder: "1", stock: 30, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["samsung", "galaxy s24", "mobile", "phone", "android", "smartphone", "போன்"],
        description: "Samsung Galaxy S24 Ultra with AI features and S Pen."
    },
    {
        name: "OnePlus Nord CE 3 5G", brand: "OnePlus", category: "Electronics", subcategory: "Mobiles",
        price: "24999", mrp: "27999", minOrder: "1", stock: 80, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1678911820864-e2c5ce217c46?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["oneplus", "nord", "mobile", "phone", "android", "smartphone"],
        description: "Fast and smooth OnePlus smartphone with 5G."
    },
    {
        name: "Redmi Note 13 Pro", brand: "Xiaomi", category: "Electronics", subcategory: "Mobiles",
        price: "19999", mrp: "22999", minOrder: "1", stock: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["redmi", "xiaomi", "mobile", "phone", "android", "smartphone"],
        description: "Feature-packed Redmi phone with excellent camera."
    },
    {
        name: "HP Pavilion 14 Laptop", brand: "HP", category: "Electronics", subcategory: "Laptops",
        price: "65000", mrp: "72000", minOrder: "1", stock: 25, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["hp", "laptop", "computer", "notebook", "pc"],
        description: "HP Pavilion thin and light laptop for everyday use."
    },
    {
        name: "Dell Inspiron 15", brand: "Dell", category: "Electronics", subcategory: "Laptops",
        price: "55000", mrp: "60000", minOrder: "1", stock: 30, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dell", "laptop", "computer", "notebook", "pc"],
        description: "Reliable Dell laptop with Intel Core i5 processor."
    },
    {
        name: "Lenovo IdeaPad Slim 3", brand: "Lenovo", category: "Electronics", subcategory: "Laptops",
        price: "45000", mrp: "52000", minOrder: "1", stock: 40, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 210,
        image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["lenovo", "laptop", "computer", "ideapad", "notebook"],
        description: "Lenovo IdeaPad for students and professionals."
    },
    {
        name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", subcategory: "Headphones",
        price: "29990", mrp: "34990", minOrder: "1", stock: 40, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sony", "headphones", "headphone", "audio", "noise cancelling", "headset"],
        description: "Industry leading noise cancelling headphones."
    },
    {
        name: "Boat Rockerz 255 Earphones", brand: "Boat", category: "Electronics", subcategory: "Earphones",
        price: "1299", mrp: "2499", minOrder: "1", stock: 150, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 850,
        image: "https://images.unsplash.com/photo-1557825835-b243fc46b149?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["boat", "earphone", "earphones", "bluetooth", "audio", "headset"],
        description: "Boat wireless earphones with deep bass."
    },
    {
        name: "Apple Watch Series 9", brand: "Apple", category: "Electronics", subcategory: "Smart Watches",
        price: "41900", mrp: "41900", minOrder: "1", stock: 35, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["apple watch", "watch", "smartwatch", "fitness", "wearable"],
        description: "A smarter, brighter Apple Watch."
    },
    {
        name: "Anker 20000mAh Power Bank", brand: "Anker", category: "Electronics", subcategory: "Power Banks",
        price: "3499", mrp: "4999", minOrder: "1", stock: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["power bank", "charger", "battery", "anker", "portable"],
        description: "High capacity portable power bank."
    },
    {
        name: "JBL Flip 6 Bluetooth Speaker", brand: "JBL", category: "Electronics", subcategory: "Speakers",
        price: "8999", mrp: "11999", minOrder: "1", stock: 60, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 450,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["jbl", "speaker", "bluetooth speaker", "audio", "sound"],
        description: "Portable waterproof Bluetooth speaker."
    },
    {
        name: "20W USB-C Fast Charger", brand: "Apple", category: "Electronics", subcategory: "Chargers",
        price: "1899", mrp: "1900", minOrder: "1", stock: 200, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 890,
        image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["charger", "adapter", "usb c", "fast charger", "apple charger", "சார்ஜர்", "charg"],
        description: "20W USB-C Power Adapter for fast charging."
    },
    {
        name: "USB-C to Lightning Charging Cable", brand: "Apple", category: "Electronics", subcategory: "Cables",
        price: "1500", mrp: "1500", minOrder: "1", stock: 300, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 650,
        image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["cable", "charging cable", "usb cable", "lightning", "wire"],
        description: "Official Apple charging cable."
    },

    // Fashion (9 products)
    {
        name: "Men's Cotton Casual Shirt", brand: "Peter England", category: "Fashion", subcategory: "Shirts",
        price: "899", mrp: "1499", minOrder: "1", stock: 150, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 85,
        image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shirt", "men", "clothing", "cotton", "shirts", "சட்டை", "sattai"],
        description: "Comfortable regular fit cotton shirt."
    },
    {
        name: "Men's Graphic T-Shirt", brand: "Puma", category: "Fashion", subcategory: "T-Shirts",
        price: "699", mrp: "999", minOrder: "1", stock: 200, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["t-shirt", "tshirt", "tee", "men", "clothing"],
        description: "Stylish graphic print t-shirt for men."
    },
    {
        name: "Classic Blue Men's Jeans", brand: "Levi's", category: "Fashion", subcategory: "Jeans",
        price: "1999", mrp: "2999", minOrder: "1", stock: 120, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["jeans", "denim", "pants", "levis", "men"],
        description: "Original fit blue denim jeans."
    },
    {
        name: "Women's Cotton Kurti", brand: "Biba", category: "Fashion", subcategory: "Ethnic Wear",
        price: "999", mrp: "1499", minOrder: "1", stock: 90, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["kurti", "women", "ethnic", "dress", "clothing"],
        description: "Beautiful embroidered cotton kurti."
    },
    {
        name: "Women's Floral Maxi Dress", brand: "H&M", category: "Fashion", subcategory: "Dresses",
        price: "1499", mrp: "2499", minOrder: "1", stock: 80, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dress", "women", "floral", "clothing", "dresses"],
        description: "Elegant floral printed maxi dress."
    },
    {
        name: "Women's Casual T-Shirt", brand: "Zara", category: "Fashion", subcategory: "T-Shirts",
        price: "599", mrp: "899", minOrder: "1", stock: 180, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 95,
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["t-shirt", "tshirt", "women", "clothing", "tee"],
        description: "Comfortable everyday t-shirt."
    },
    {
        name: "Kids Graphic T-Shirt", brand: "Mothercare", category: "Fashion", subcategory: "Kids",
        price: "499", mrp: "699", minOrder: "1", stock: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 60,
        image: "https://images.unsplash.com/photo-1519238398275-520556272304?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["kids", "t-shirt", "tshirt", "children", "clothing"],
        description: "Cute graphic print t-shirt for kids."
    },
    {
        name: "Nike Running Sports Shoes", brand: "Nike", category: "Fashion", subcategory: "Footwear",
        price: "3499", mrp: "4999", minOrder: "1", stock: 90, unit: "pair",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 450,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shoes", "sneakers", "running", "footwear", "nike", "shoe"],
        description: "Lightweight running shoes for everyday comfort."
    },
    {
        name: "Puma Casual Slippers", brand: "Puma", category: "Fashion", subcategory: "Footwear",
        price: "499", mrp: "799", minOrder: "1", stock: 200, unit: "pair",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1621315271772-28b1f3a5950a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["slippers", "flip flops", "footwear", "sandals"],
        description: "Comfortable and durable daily wear slippers."
    },

    // Grocery (10 products)
    {
        name: "India Gate Basmati Rice 5kg", brand: "India Gate", category: "Grocery", subcategory: "Rice",
        price: "599", mrp: "750", minOrder: "1", stock: 300, unit: "bag",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["rice", "basmati", "arisi", "grocery", "அரிசி", "rice bag"],
        description: "Premium quality basmati rice."
    },
    {
        name: "Tata Sampann Toor Dal 1kg", brand: "Tata Sampann", category: "Grocery", subcategory: "Dal",
        price: "165", mrp: "190", minOrder: "1", stock: 200, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1585232986252-870098df2334?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dal", "toor dal", "paruppu", "lentils", "grocery"],
        description: "Unpolished, high-protein toor dal."
    },
    {
        name: "Tata Sampann Moong Dal 1kg", brand: "Tata Sampann", category: "Grocery", subcategory: "Dal",
        price: "145", mrp: "160", minOrder: "1", stock: 180, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 130,
        image: "https://images.unsplash.com/photo-1515543582370-4cff31e54e8b?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dal", "moong dal", "paruppu", "lentils", "grocery"],
        description: "Premium unpolished moong dal."
    },
    {
        name: "Madhur Pure & Hygienic Sugar 1kg", brand: "Madhur", category: "Grocery", subcategory: "Sugar",
        price: "45", mrp: "50", minOrder: "1", stock: 400, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sugar", "sarkkarai", "sweet", "grocery", "சீனி", "சர்க்கரை"],
        description: "Refined, pure white sugar crystals."
    },
    {
        name: "Tata Salt 1kg", brand: "Tata", category: "Grocery", subcategory: "Salt",
        price: "25", mrp: "28", minOrder: "1", stock: 500, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 800,
        image: "https://images.unsplash.com/photo-1627467615016-16f5bfbe9f0a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["salt", "uppu", "grocery", "உப்பு"],
        description: "Vacuum evaporated iodized salt."
    },
    {
        name: "Fortune Sunflower Cooking Oil 1L", brand: "Fortune", category: "Grocery", subcategory: "Cooking Oil",
        price: "125", mrp: "145", minOrder: "1", stock: 250, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["oil", "sunflower", "ennai", "cooking", "grocery", "எண்ணெய்"],
        description: "Light and healthy sunflower cooking oil."
    },
    {
        name: "Aashirvaad Whole Wheat Atta 5kg", brand: "Aashirvaad", category: "Grocery", subcategory: "Atta",
        price: "240", mrp: "260", minOrder: "1", stock: 400, unit: "bag",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["atta", "wheat", "flour", "grocery", "maavu", "மாவு"],
        description: "100% whole wheat chakki fresh atta."
    },
    {
        name: "Everest Turmeric Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "28", mrp: "30", minOrder: "1", stock: 300, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1615485925600-97237c4fa1eb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["turmeric", "powder", "spice", "haldi", "manjal", "மஞ்சள்"],
        description: "Pure and vibrant turmeric powder."
    },
    {
        name: "Everest Chilli Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "35", mrp: "40", minOrder: "1", stock: 300, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 160,
        image: "https://images.unsplash.com/photo-1596647900350-13f56ecb5ea8?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chilli", "powder", "spice", "milagai", "மிளகாய்"],
        description: "Spicy and bright red chilli powder."
    },
    {
        name: "Everest Coriander Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "30", mrp: "35", minOrder: "1", stock: 280, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 140,
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["coriander", "powder", "spice", "dhaniya", "மல்லி"],
        description: "Aromatic coriander powder."
    },

    // Snacks & Drinks (8 products)
    {
        name: "Oreo Original Biscuits", brand: "Oreo", category: "Snacks", subcategory: "Biscuits",
        price: "30", mrp: "30", minOrder: "2", stock: 400, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 600,
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["biscuit", "biscuits", "oreo", "cookie", "snacks", "biscut"],
        description: "Chocolate sandwich cookies."
    },
    {
        name: "Lay's Classic Salted Chips", brand: "Lay's", category: "Snacks", subcategory: "Chips",
        price: "20", mrp: "20", minOrder: "2", stock: 500, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1566478989037-e98748d56b46?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chips", "lays", "snacks", "potato"],
        description: "Classic salted potato chips."
    },
    {
        name: "Cadbury Dairy Milk Silk", brand: "Cadbury", category: "Snacks", subcategory: "Chocolates",
        price: "70", mrp: "70", minOrder: "1", stock: 250, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.9, reviewCount: 800,
        image: "https://images.unsplash.com/photo-1548880629-8735237887d1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chocolate", "sweet", "cadbury", "dairy milk", "chocolates"],
        description: "Smooth and creamy milk chocolate."
    },
    {
        name: "Coca-Cola 1.25L", brand: "Coca-Cola", category: "Drinks", subcategory: "Soft Drinks",
        price: "65", mrp: "65", minOrder: "1", stock: 300, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 550,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["coke", "coca cola", "drink", "beverage", "soft drink", "cool drink"],
        description: "Refreshing carbonated beverage."
    },
    {
        name: "Pepsi Black Zero Sugar 500ml", brand: "Pepsi", category: "Drinks", subcategory: "Soft Drinks",
        price: "40", mrp: "40", minOrder: "1", stock: 200, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["pepsi", "drink", "beverage", "soft drink", "zero sugar"],
        description: "Zero sugar cola."
    },
    {
        name: "Tropicana Mixed Fruit Juice 1L", brand: "Tropicana", category: "Drinks", subcategory: "Fruit Juice",
        price: "110", mrp: "120", minOrder: "1", stock: 150, unit: "carton",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["juice", "fruit juice", "drink", "tropicana"],
        description: "100% mixed fruit juice."
    },
    {
        name: "Sprite 750ml", brand: "Sprite", category: "Drinks", subcategory: "Soft Drinks",
        price: "40", mrp: "40", minOrder: "1", stock: 220, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 280,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sprite", "drink", "beverage", "soft drink"],
        description: "Clear lime flavored soft drink."
    },
    {
        name: "Kinley Packaged Drinking Water 1L", brand: "Kinley", category: "Drinks", subcategory: "Water",
        price: "20", mrp: "20", minOrder: "1", stock: 500, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["water", "thanni", "drinks", "thannir", "குடிநீர்", "தண்ணீர்"],
        description: "Purified packaged drinking water."
    },

    // Personal Care (6 products)
    {
        name: "Dove Intense Repair Shampoo 340ml", brand: "Dove", category: "Personal Care", subcategory: "Shampoo",
        price: "240", mrp: "260", minOrder: "1", stock: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1631730486784-5456119f69ae?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shampoo", "dove", "hair care", "personal care"],
        description: "Nourishing shampoo for damaged hair."
    },
    {
        name: "Clinic Plus Strong & Long Shampoo", brand: "Clinic Plus", category: "Personal Care", subcategory: "Shampoo",
        price: "180", mrp: "190", minOrder: "1", stock: 180, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 250,
        image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shampoo", "clinic plus", "hair care", "personal care"],
        description: "Health shampoo for strong hair."
    },
    {
        name: "Colgate Strong Teeth Toothpaste 200g", brand: "Colgate", category: "Personal Care", subcategory: "Toothpaste",
        price: "99", mrp: "110", minOrder: "1", stock: 250, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 420,
        image: "https://images.unsplash.com/photo-1559404285-d856037eecba?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["toothpaste", "colgate", "paste", "dental", "brush"],
        description: "Anti-cavity toothpaste for strong teeth."
    },
    {
        name: "Pears Pure & Gentle Soap 125g", brand: "Pears", category: "Personal Care", subcategory: "Soap",
        price: "60", mrp: "65", minOrder: "1", stock: 300, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 410,
        image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop",
        images: ["https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop"],
        searchKeywords: ["soap", "pears", "bath", "personal care", "soapu", "சோப்பு"],
        description: "Glycerin based gentle bathing soap."
    },
    {
        name: "Dettol Original Soap 4x125g", brand: "Dettol", category: "Personal Care", subcategory: "Soap",
        price: "185", mrp: "195", minOrder: "1", stock: 200, unit: "pack",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop",
        images: ["https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop"],
        searchKeywords: ["soap", "dettol", "bath", "personal care", "soapu", "சோப்பு"],
        description: "Germ protection bathing soap."
    },
    {
        name: "Lux Beauty Soap 100g", brand: "Lux", category: "Personal Care", subcategory: "Soap",
        price: "35", mrp: "40", minOrder: "2", stock: 300, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1584949514123-474cb0c6130c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["soap", "lux", "bath", "personal care", "soapu"],
        description: "Rose glowing skin soap."
    },
    {
        name: "Dettol Liquid Hand Wash 200ml", brand: "Dettol", category: "Personal Care", subcategory: "Hand Wash",
        price: "99", mrp: "99", minOrder: "1", stock: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 310,
        image: "https://images.unsplash.com/photo-1584483756284-90977271816e?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["hand wash", "dettol", "soap", "hygiene"],
        description: "Original germ protection hand wash."
    },

    // Household (6 products)
    {
        name: "Surf Excel Easy Wash Detergent 1kg", brand: "Surf Excel", category: "Household", subcategory: "Detergent",
        price: "135", mrp: "140", minOrder: "1", stock: 200, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1584824486509-112e4181f1b6?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["surf excel", "detergent", "washing powder", "soap", "household"],
        description: "Removes tough stains easily."
    },
    {
        name: "Vim Dishwash Liquid 500ml", brand: "Vim", category: "Household", subcategory: "Dishwash",
        price: "105", mrp: "115", minOrder: "1", stock: 180, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 250,
        image: "https://images.unsplash.com/photo-1585421514284-efa201b1c31f?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["vim", "dishwash", "liquid", "cleaning", "household"],
        description: "Lemon dishwash liquid for tough grease."
    },
    {
        name: "Harpic Toilet Cleaner 1L", brand: "Harpic", category: "Household", subcategory: "Cleaners",
        price: "185", mrp: "199", minOrder: "1", stock: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["harpic", "toilet cleaner", "cleaning", "bathroom"],
        description: "10x max clean power toilet cleaner."
    },
    {
        name: "Lizol Floor Cleaner Citrus 1L", brand: "Lizol", category: "Household", subcategory: "Cleaners",
        price: "195", mrp: "210", minOrder: "1", stock: 140, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1585421514336-d760773b1bb8?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["lizol", "floor cleaner", "cleaning", "disinfectant"],
        description: "Disinfectant surface cleaner."
    },
    {
        name: "Origami Tissue Paper Box", brand: "Origami", category: "Household", subcategory: "Tissues",
        price: "85", mrp: "99", minOrder: "1", stock: 300, unit: "box",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["tissue", "paper", "napkin", "origami"],
        description: "Soft and absorbent 2-ply facial tissues."
    },
    {
        name: "Medium Garbage Bags (Pack of 30)", brand: "Presto", category: "Household", subcategory: "Bags",
        price: "120", mrp: "150", minOrder: "1", stock: 250, unit: "pack",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["garbage", "trash bags", "dustbin", "waste"],
        description: "Durable oxo-biodegradable garbage bags."
    }
];

const QUICK_PRODUCTS = [
    {
        name: "Amul Taaza Milk 500ml", brand: "Amul", category: "Milk", subcategory: "Milk",
        price: "27", mrp: "27", minOrder: "1", stock: 50, unit: "packet",
        marketplaceType: "QUICK", rating: 4.8, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["milk", "paal", "amul", "dairy", "பால்"],
        description: "Fresh toned milk."
    },
    {
        name: "Aavin Premium Milk 500ml", brand: "Aavin", category: "Milk", subcategory: "Milk",
        price: "25", mrp: "25", minOrder: "1", stock: 60, unit: "packet",
        marketplaceType: "QUICK", rating: 4.7, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["milk", "paal", "aavin", "dairy", "பால்"],
        description: "Aavin full cream milk."
    },
    {
        name: "Arokya Curd 500g", brand: "Arokya", category: "Milk & Dairy", subcategory: "Curd",
        price: "35", mrp: "35", minOrder: "1", stock: 40, unit: "packet",
        marketplaceType: "QUICK", rating: 4.6, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1591535798993-9097e37b12d5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["curd", "thayir", "dairy", "tayir", "தயிர்"],
        description: "Thick and fresh curd."
    },
    {
        name: "Amul Fresh Paneer 200g", brand: "Amul", category: "Milk & Dairy", subcategory: "Paneer",
        price: "85", mrp: "90", minOrder: "1", stock: 30, unit: "packet",
        marketplaceType: "QUICK", rating: 4.8, reviewCount: 140,
        image: "https://images.unsplash.com/photo-1631387622941-8e40f9076f63?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["paneer", "dairy", "cheese", "பன்னீர்"],
        description: "Soft and fresh paneer."
    },
    {
        name: "Amul Butter 100g", brand: "Amul", category: "Bread & Butter", subcategory: "Butter",
        price: "56", mrp: "56", minOrder: "1", stock: 45, unit: "piece",
        marketplaceType: "QUICK", rating: 4.9, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["butter", "vennai", "dairy", "வெண்ணெய்"],
        description: "Delicious salted butter."
    },
    {
        name: "Farm Fresh Eggs 6pcs", brand: "Local", category: "Eggs", subcategory: "Eggs",
        price: "42", mrp: "45", minOrder: "1", stock: 100, unit: "tray",
        marketplaceType: "QUICK", rating: 4.6, reviewCount: 95,
        image: "https://images.unsplash.com/photo-1587486913049-53fc88980360?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["egg", "muttai", "முட்டை", "eggs"],
        description: "Fresh brown eggs."
    },
    {
        name: "Modern Sandwich Bread", brand: "Modern", category: "Bread & Butter", subcategory: "Bread",
        price: "45", mrp: "45", minOrder: "1", stock: 30, unit: "packet",
        marketplaceType: "QUICK", rating: 4.5, reviewCount: 80,
        image: "https://images.unsplash.com/photo-1598128558393-70ff21433be0?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["bread", "bakery", "sandwich", "பிரெட்"],
        description: "Soft and fresh sandwich bread."
    },
    {
        name: "Arun Vanilla Ice Cream 500ml", brand: "Arun", category: "Ice Cream", subcategory: "Ice Cream",
        price: "150", mrp: "160", minOrder: "1", stock: 20, unit: "tub",
        marketplaceType: "QUICK", rating: 4.7, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1570197781417-0c7f766e4a2d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["ice cream", "dessert", "vanilla", "arun", "sweet"],
        description: "Creamy vanilla ice cream."
    }
];

const MOCK_SHOP = {
    name: "GreenBond Quick Mart",
    ownerName: "Admin Quick Shop",
    mobile: "9000000001",
    email: "quickmart@greenbond.com",
    password: await bcrypt.hash("password123", 10),
    location: {
        lat: 13.0311,
        lng: 80.2783,
        address: "GreenBond Hub, Chennai, Tamil Nadu"
    },
    locationGeo: {
        type: 'Point',
        coordinates: [80.2783, 13.0311] // [lng, lat]
    },
    isActive: true,
    operatingHours: { start: "00:00", end: "23:59" },
    role: "shop"
};

const runSeeder = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        console.log("Clearing existing SHOPPING and QUICK products...");
        await Product.deleteMany({ marketplaceType: { $in: ["SHOPPING", "QUICK"] } });
        console.log("Cleared.");

        // Insert SHOPPING
        console.log("Seeding SHOPPING products...");
        const shoppingPayload = SHOPPING_PRODUCTS.map(p => {
            const price = parseFloat(p.price);
            const mrp = parseFloat(p.mrp);
            const discountPercentage = (mrp > price) ? Math.round(((mrp - price) / mrp) * 100) : 0;
            return {
                ...p,
                discountPercentage,
                location: "Pan India",
                contact: "support@greenbond.com",
                sourceType: "SHOP" // Using SHOP to bypass Farmer constraints, though sellerType is ADMIN
            };
        });
        await Product.insertMany(shoppingPayload);
        console.log(`Inserted ${SHOPPING_PRODUCTS.length} Shopping products.`);

        // Setup QUICK Shop
        console.log("Setting up Quick Shop...");
        let shop = await Shop.findOne({ email: MOCK_SHOP.email });
        if (!shop) {
            shop = await Shop.create(MOCK_SHOP);
        } else {
            shop.locationGeo = MOCK_SHOP.locationGeo;
            shop.location = MOCK_SHOP.location;
            await shop.save();
        }
        console.log("Quick Shop Ready. ID:", shop._id);

        // Insert QUICK
        console.log("Seeding QUICK products...");
        const quickPayload = [...QUICK_PRODUCTS, ...SHOPPING_PRODUCTS.filter(p => p.category !== 'Fashion')].map((p, index) => {
            const price = parseFloat(p.price);
            const mrp = parseFloat(p.mrp);
            const discountPercentage = (mrp > price) ? Math.round(((mrp - price) / mrp) * 100) : 0;
            
            let mappedCategory = p.category;
            if (mappedCategory === 'Drinks') mappedCategory = 'Cold Drinks';
            if (mappedCategory === 'Milk & Dairy') mappedCategory = 'Milk';
            if (p.subcategory === 'Eggs') mappedCategory = 'Eggs';
            if (p.subcategory === 'Bread' || p.subcategory === 'Butter') mappedCategory = 'Bread & Butter';
            
            return {
                ...p,
                category: mappedCategory,
                name: index < QUICK_PRODUCTS.length ? p.name : `${p.name}`,
                discountPercentage,
                marketplaceType: "QUICK",
                location: shop.location.address,
                contact: shop.mobile,
                sellerId: shop._id,
                sellerType: "SHOP_OWNER",
                sourceType: "SHOP"
            };
        });
        await Product.insertMany(quickPayload);
        console.log(`Inserted ${QUICK_PRODUCTS.length} Quick products.`);

        console.log("Total seeded successfully! Process completed.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

runSeeder();
