import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Product from './models/Product.js';
import Shop from './models/Shop.js';

dotenv.config();

const SHOPPING_PRODUCTS = [
    // Electronics (14 products)
    {
        title: "iPhone 15 Pro Max 256GB", brand: "Apple", category: "Electronics", subcategory: "Mobiles",
        price: "159900", originalPrice: "169900", minOrder: "1", availableQuantity: 50, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.9, reviewCount: 245,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["iphone 15", "apple", "mobile", "phone", "smartphone", "cellphone", "ios", "போன்", "iphone"],
        description: "Latest iPhone 15 Pro Max with titanium body and A17 Pro chip."
    },
    {
        title: "Samsung Galaxy S24 Ultra 5G", brand: "Samsung", category: "Electronics", subcategory: "Mobiles",
        price: "129999", originalPrice: "134999", minOrder: "1", availableQuantity: 30, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["samsung", "galaxy s24", "mobile", "phone", "android", "smartphone", "போன்"],
        description: "Samsung Galaxy S24 Ultra with AI features and S Pen."
    },
    {
        title: "OnePlus Nord CE 3 5G", brand: "OnePlus", category: "Electronics", subcategory: "Mobiles",
        price: "24999", originalPrice: "27999", minOrder: "1", availableQuantity: 80, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1678911820864-e2c5ce217c46?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["oneplus", "nord", "mobile", "phone", "android", "smartphone"],
        description: "Fast and smooth OnePlus smartphone with 5G."
    },
    {
        title: "Redmi Note 13 Pro", brand: "Xiaomi", category: "Electronics", subcategory: "Mobiles",
        price: "19999", originalPrice: "22999", minOrder: "1", availableQuantity: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["redmi", "xiaomi", "mobile", "phone", "android", "smartphone"],
        description: "Feature-packed Redmi phone with excellent camera."
    },
    {
        title: "HP Pavilion 14 Laptop", brand: "HP", category: "Electronics", subcategory: "Laptops",
        price: "65000", originalPrice: "72000", minOrder: "1", availableQuantity: 25, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["hp", "laptop", "computer", "notebook", "pc"],
        description: "HP Pavilion thin and light laptop for everyday use."
    },
    {
        title: "Dell Inspiron 15", brand: "Dell", category: "Electronics", subcategory: "Laptops",
        price: "55000", originalPrice: "60000", minOrder: "1", availableQuantity: 30, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dell", "laptop", "computer", "notebook", "pc"],
        description: "Reliable Dell laptop with Intel Core i5 processor."
    },
    {
        title: "Lenovo IdeaPad Slim 3", brand: "Lenovo", category: "Electronics", subcategory: "Laptops",
        price: "45000", originalPrice: "52000", minOrder: "1", availableQuantity: 40, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 210,
        image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["lenovo", "laptop", "computer", "ideapad", "notebook"],
        description: "Lenovo IdeaPad for students and professionals."
    },
    {
        title: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", subcategory: "Headphones",
        price: "29990", originalPrice: "34990", minOrder: "1", availableQuantity: 40, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sony", "headphones", "headphone", "audio", "noise cancelling", "headset"],
        description: "Industry leading noise cancelling headphones."
    },
    {
        title: "Boat Rockerz 255 Earphones", brand: "Boat", category: "Electronics", subcategory: "Earphones",
        price: "1299", originalPrice: "2499", minOrder: "1", availableQuantity: 150, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 850,
        image: "https://images.unsplash.com/photo-1557825835-b243fc46b149?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["boat", "earphone", "earphones", "bluetooth", "audio", "headset"],
        description: "Boat wireless earphones with deep bass."
    },
    {
        title: "Apple Watch Series 9", brand: "Apple", category: "Electronics", subcategory: "Smart Watches",
        price: "41900", originalPrice: "41900", minOrder: "1", availableQuantity: 35, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["apple watch", "watch", "smartwatch", "fitness", "wearable"],
        description: "A smarter, brighter Apple Watch."
    },
    {
        title: "Anker 20000mAh Power Bank", brand: "Anker", category: "Electronics", subcategory: "Power Banks",
        price: "3499", originalPrice: "4999", minOrder: "1", availableQuantity: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["power bank", "charger", "battery", "anker", "portable"],
        description: "High capacity portable power bank."
    },
    {
        title: "JBL Flip 6 Bluetooth Speaker", brand: "JBL", category: "Electronics", subcategory: "Speakers",
        price: "8999", originalPrice: "11999", minOrder: "1", availableQuantity: 60, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 450,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["jbl", "speaker", "bluetooth speaker", "audio", "sound"],
        description: "Portable waterproof Bluetooth speaker."
    },
    {
        title: "20W USB-C Fast Charger", brand: "Apple", category: "Electronics", subcategory: "Chargers",
        price: "1899", originalPrice: "1900", minOrder: "1", availableQuantity: 200, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 890,
        image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["charger", "adapter", "usb c", "fast charger", "apple charger", "சார்ஜர்", "charg"],
        description: "20W USB-C Power Adapter for fast charging."
    },
    {
        title: "USB-C to Lightning Charging Cable", brand: "Apple", category: "Electronics", subcategory: "Cables",
        price: "1500", originalPrice: "1500", minOrder: "1", availableQuantity: 300, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 650,
        image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["cable", "charging cable", "usb cable", "lightning", "wire"],
        description: "Official Apple charging cable."
    },

    // Fashion (9 products)
    {
        title: "Men's Cotton Casual Shirt", brand: "Peter England", category: "Fashion", subcategory: "Shirts",
        price: "899", originalPrice: "1499", minOrder: "1", availableQuantity: 150, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 85,
        image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shirt", "men", "clothing", "cotton", "shirts", "சட்டை", "sattai"],
        description: "Comfortable regular fit cotton shirt."
    },
    {
        title: "Men's Graphic T-Shirt", brand: "Puma", category: "Fashion", subcategory: "T-Shirts",
        price: "699", originalPrice: "999", minOrder: "1", availableQuantity: 200, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["t-shirt", "tshirt", "tee", "men", "clothing"],
        description: "Stylish graphic print t-shirt for men."
    },
    {
        title: "Classic Blue Men's Jeans", brand: "Levi's", category: "Fashion", subcategory: "Jeans",
        price: "1999", originalPrice: "2999", minOrder: "1", availableQuantity: 120, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["jeans", "denim", "pants", "levis", "men"],
        description: "Original fit blue denim jeans."
    },
    {
        title: "Women's Cotton Kurti", brand: "Biba", category: "Fashion", subcategory: "Ethnic Wear",
        price: "999", originalPrice: "1499", minOrder: "1", availableQuantity: 90, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["kurti", "women", "ethnic", "dress", "clothing"],
        description: "Beautiful embroidered cotton kurti."
    },
    {
        title: "Women's Floral Maxi Dress", brand: "H&M", category: "Fashion", subcategory: "Dresses",
        price: "1499", originalPrice: "2499", minOrder: "1", availableQuantity: 80, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dress", "women", "floral", "clothing", "dresses"],
        description: "Elegant floral printed maxi dress."
    },
    {
        title: "Women's Casual T-Shirt", brand: "Zara", category: "Fashion", subcategory: "T-Shirts",
        price: "599", originalPrice: "899", minOrder: "1", availableQuantity: 180, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 95,
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["t-shirt", "tshirt", "women", "clothing", "tee"],
        description: "Comfortable everyday t-shirt."
    },
    {
        title: "Kids Graphic T-Shirt", brand: "Mothercare", category: "Fashion", subcategory: "Kids",
        price: "499", originalPrice: "699", minOrder: "1", availableQuantity: 100, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 60,
        image: "https://images.unsplash.com/photo-1519238398275-520556272304?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["kids", "t-shirt", "tshirt", "children", "clothing"],
        description: "Cute graphic print t-shirt for kids."
    },
    {
        title: "Nike Running Sports Shoes", brand: "Nike", category: "Fashion", subcategory: "Footwear",
        price: "3499", originalPrice: "4999", minOrder: "1", availableQuantity: 90, unit: "pair",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 450,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shoes", "sneakers", "running", "footwear", "nike", "shoe"],
        description: "Lightweight running shoes for everyday comfort."
    },
    {
        title: "Puma Casual Slippers", brand: "Puma", category: "Fashion", subcategory: "Footwear",
        price: "499", originalPrice: "799", minOrder: "1", availableQuantity: 200, unit: "pair",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.3, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1621315271772-28b1f3a5950a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["slippers", "flip flops", "footwear", "sandals"],
        description: "Comfortable and durable daily wear slippers."
    },

    // Grocery (10 products)
    {
        title: "India Gate Basmati Rice 5kg", brand: "India Gate", category: "Grocery", subcategory: "Rice",
        price: "599", originalPrice: "750", minOrder: "1", availableQuantity: 300, unit: "bag",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["rice", "basmati", "arisi", "grocery", "அரிசி", "rice bag"],
        description: "Premium quality basmati rice."
    },
    {
        title: "Tata Sampann Toor Dal 1kg", brand: "Tata Sampann", category: "Grocery", subcategory: "Dal",
        price: "165", originalPrice: "190", minOrder: "1", availableQuantity: 200, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1585232986252-870098df2334?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dal", "toor dal", "paruppu", "lentils", "grocery"],
        description: "Unpolished, high-protein toor dal."
    },
    {
        title: "Tata Sampann Moong Dal 1kg", brand: "Tata Sampann", category: "Grocery", subcategory: "Dal",
        price: "145", originalPrice: "160", minOrder: "1", availableQuantity: 180, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 130,
        image: "https://images.unsplash.com/photo-1515543582370-4cff31e54e8b?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["dal", "moong dal", "paruppu", "lentils", "grocery"],
        description: "Premium unpolished moong dal."
    },
    {
        title: "Madhur Pure & Hygienic Sugar 1kg", brand: "Madhur", category: "Grocery", subcategory: "Sugar",
        price: "45", originalPrice: "50", minOrder: "1", availableQuantity: 400, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sugar", "sarkkarai", "sweet", "grocery", "சீனி", "சர்க்கரை"],
        description: "Refined, pure white sugar crystals."
    },
    {
        title: "Tata Salt 1kg", brand: "Tata", category: "Grocery", subcategory: "Salt",
        price: "25", originalPrice: "28", minOrder: "1", availableQuantity: 500, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 800,
        image: "https://images.unsplash.com/photo-1627467615016-16f5bfbe9f0a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["salt", "uppu", "grocery", "உப்பு"],
        description: "Vacuum evaporated iodized salt."
    },
    {
        title: "Fortune Sunflower Cooking Oil 1L", brand: "Fortune", category: "Grocery", subcategory: "Cooking Oil",
        price: "125", originalPrice: "145", minOrder: "1", availableQuantity: 250, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["oil", "sunflower", "ennai", "cooking", "grocery", "எண்ணெய்"],
        description: "Light and healthy sunflower cooking oil."
    },
    {
        title: "Aashirvaad Whole Wheat Atta 5kg", brand: "Aashirvaad", category: "Grocery", subcategory: "Atta",
        price: "240", originalPrice: "260", minOrder: "1", availableQuantity: 400, unit: "bag",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["atta", "wheat", "flour", "grocery", "maavu", "மாவு"],
        description: "100% whole wheat chakki fresh atta."
    },
    {
        title: "Everest Turmeric Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "28", originalPrice: "30", minOrder: "1", availableQuantity: 300, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1615485925600-97237c4fa1eb?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["turmeric", "powder", "spice", "haldi", "manjal", "மஞ்சள்"],
        description: "Pure and vibrant turmeric powder."
    },
    {
        title: "Everest Chilli Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "35", originalPrice: "40", minOrder: "1", availableQuantity: 300, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 160,
        image: "https://images.unsplash.com/photo-1596647900350-13f56ecb5ea8?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chilli", "powder", "spice", "milagai", "மிளகாய்"],
        description: "Spicy and bright red chilli powder."
    },
    {
        title: "Everest Coriander Powder 100g", brand: "Everest", category: "Grocery", subcategory: "Spices",
        price: "30", originalPrice: "35", minOrder: "1", availableQuantity: 280, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 140,
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["coriander", "powder", "spice", "dhaniya", "மல்லி"],
        description: "Aromatic coriander powder."
    },

    // Snacks & Drinks (8 products)
    {
        title: "Oreo Original Biscuits", brand: "Oreo", category: "Snacks", subcategory: "Biscuits",
        price: "30", originalPrice: "30", minOrder: "2", availableQuantity: 400, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 600,
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["biscuit", "biscuits", "oreo", "cookie", "snacks", "biscut"],
        description: "Chocolate sandwich cookies."
    },
    {
        title: "Lay's Classic Salted Chips", brand: "Lay's", category: "Snacks", subcategory: "Chips",
        price: "20", originalPrice: "20", minOrder: "2", availableQuantity: 500, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1566478989037-e98748d56b46?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chips", "lays", "snacks", "potato"],
        description: "Classic salted potato chips."
    },
    {
        title: "Cadbury Dairy Milk Silk", brand: "Cadbury", category: "Snacks", subcategory: "Chocolates",
        price: "70", originalPrice: "70", minOrder: "1", availableQuantity: 250, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.9, reviewCount: 800,
        image: "https://images.unsplash.com/photo-1548880629-8735237887d1?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["chocolate", "sweet", "cadbury", "dairy milk", "chocolates"],
        description: "Smooth and creamy milk chocolate."
    },
    {
        title: "Coca-Cola 1.25L", brand: "Coca-Cola", category: "Drinks", subcategory: "Soft Drinks",
        price: "65", originalPrice: "65", minOrder: "1", availableQuantity: 300, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 550,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["coke", "coca cola", "drink", "beverage", "soft drink", "cool drink"],
        description: "Refreshing carbonated beverage."
    },
    {
        title: "Pepsi Black Zero Sugar 500ml", brand: "Pepsi", category: "Drinks", subcategory: "Soft Drinks",
        price: "40", originalPrice: "40", minOrder: "1", availableQuantity: 200, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 320,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["pepsi", "drink", "beverage", "soft drink", "zero sugar"],
        description: "Zero sugar cola."
    },
    {
        title: "Tropicana Mixed Fruit Juice 1L", brand: "Tropicana", category: "Drinks", subcategory: "Fruit Juice",
        price: "110", originalPrice: "120", minOrder: "1", availableQuantity: 150, unit: "carton",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["juice", "fruit juice", "drink", "tropicana"],
        description: "100% mixed fruit juice."
    },
    {
        title: "Sprite 750ml", brand: "Sprite", category: "Drinks", subcategory: "Soft Drinks",
        price: "40", originalPrice: "40", minOrder: "1", availableQuantity: 220, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 280,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["sprite", "drink", "beverage", "soft drink"],
        description: "Clear lime flavored soft drink."
    },
    {
        title: "Kinley Packaged Drinking Water 1L", brand: "Kinley", category: "Drinks", subcategory: "Water",
        price: "20", originalPrice: "20", minOrder: "1", availableQuantity: 500, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["water", "thanni", "drinks", "thannir", "குடிநீர்", "தண்ணீர்"],
        description: "Purified packaged drinking water."
    },

    // Personal Care (6 products)
    {
        title: "Dove Intense Repair Shampoo 340ml", brand: "Dove", category: "Personal Care", subcategory: "Shampoo",
        price: "240", originalPrice: "260", minOrder: "1", availableQuantity: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1631730486784-5456119f69ae?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shampoo", "dove", "hair care", "personal care"],
        description: "Nourishing shampoo for damaged hair."
    },
    {
        title: "Clinic Plus Strong & Long Shampoo", brand: "Clinic Plus", category: "Personal Care", subcategory: "Shampoo",
        price: "180", originalPrice: "190", minOrder: "1", availableQuantity: 180, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 250,
        image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["shampoo", "clinic plus", "hair care", "personal care"],
        description: "Health shampoo for strong hair."
    },
    {
        title: "Colgate Strong Teeth Toothpaste 200g", brand: "Colgate", category: "Personal Care", subcategory: "Toothpaste",
        price: "99", originalPrice: "110", minOrder: "1", availableQuantity: 250, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 420,
        image: "https://images.unsplash.com/photo-1559404285-d856037eecba?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["toothpaste", "colgate", "paste", "dental", "brush"],
        description: "Anti-cavity toothpaste for strong teeth."
    },
    {
        title: "Dettol Original Soap 4x125g", brand: "Dettol", category: "Personal Care", subcategory: "Soap",
        price: "185", originalPrice: "195", minOrder: "1", availableQuantity: 200, unit: "pack",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 500,
        image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["soap", "dettol", "bath", "personal care", "soapu", "சோப்பு"],
        description: "Germ protection bathing soap."
    },
    {
        title: "Lux Beauty Soap 100g", brand: "Lux", category: "Personal Care", subcategory: "Soap",
        price: "35", originalPrice: "40", minOrder: "2", availableQuantity: 300, unit: "piece",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1584949514123-474cb0c6130c?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["soap", "lux", "bath", "personal care", "soapu"],
        description: "Rose glowing skin soap."
    },
    {
        title: "Dettol Liquid Hand Wash 200ml", brand: "Dettol", category: "Personal Care", subcategory: "Hand Wash",
        price: "99", originalPrice: "99", minOrder: "1", availableQuantity: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 310,
        image: "https://images.unsplash.com/photo-1584483756284-90977271816e?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["hand wash", "dettol", "soap", "hygiene"],
        description: "Original germ protection hand wash."
    },

    // Household (6 products)
    {
        title: "Surf Excel Easy Wash Detergent 1kg", brand: "Surf Excel", category: "Household", subcategory: "Detergent",
        price: "135", originalPrice: "140", minOrder: "1", availableQuantity: 200, unit: "packet",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 400,
        image: "https://images.unsplash.com/photo-1584824486509-112e4181f1b6?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["surf excel", "detergent", "washing powder", "soap", "household"],
        description: "Removes tough stains easily."
    },
    {
        title: "Vim Dishwash Liquid 500ml", brand: "Vim", category: "Household", subcategory: "Dishwash",
        price: "105", originalPrice: "115", minOrder: "1", availableQuantity: 180, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.6, reviewCount: 250,
        image: "https://images.unsplash.com/photo-1585421514284-efa201b1c31f?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["vim", "dishwash", "liquid", "cleaning", "household"],
        description: "Lemon dishwash liquid for tough grease."
    },
    {
        title: "Harpic Toilet Cleaner 1L", brand: "Harpic", category: "Household", subcategory: "Cleaners",
        price: "185", originalPrice: "199", minOrder: "1", availableQuantity: 150, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.8, reviewCount: 300,
        image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["harpic", "toilet cleaner", "cleaning", "bathroom"],
        description: "10x max clean power toilet cleaner."
    },
    {
        title: "Lizol Floor Cleaner Citrus 1L", brand: "Lizol", category: "Household", subcategory: "Cleaners",
        price: "195", originalPrice: "210", minOrder: "1", availableQuantity: 140, unit: "bottle",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.7, reviewCount: 220,
        image: "https://images.unsplash.com/photo-1585421514336-d760773b1bb8?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["lizol", "floor cleaner", "cleaning", "disinfectant"],
        description: "Disinfectant surface cleaner."
    },
    {
        title: "Origami Tissue Paper Box", brand: "Origami", category: "Household", subcategory: "Tissues",
        price: "85", originalPrice: "99", minOrder: "1", availableQuantity: 300, unit: "box",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.5, reviewCount: 180,
        image: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["tissue", "paper", "napkin", "origami"],
        description: "Soft and absorbent 2-ply facial tissues."
    },
    {
        title: "Medium Garbage Bags (Pack of 30)", brand: "Presto", category: "Household", subcategory: "Bags",
        price: "120", originalPrice: "150", minOrder: "1", availableQuantity: 250, unit: "pack",
        marketplaceType: "SHOPPING", sellerType: "ADMIN", rating: 4.4, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["garbage", "trash bags", "dustbin", "waste"],
        description: "Durable oxo-biodegradable garbage bags."
    }
];

const QUICK_PRODUCTS = [
    {
        title: "Amul Taaza Milk 500ml", brand: "Amul", category: "Milk & Dairy", subcategory: "Milk",
        price: "27", originalPrice: "27", minOrder: "1", availableQuantity: 50, unit: "packet",
        marketplaceType: "QUICK", rating: 4.8, reviewCount: 120,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["milk", "paal", "amul", "dairy", "பால்"],
        description: "Fresh toned milk."
    },
    {
        title: "Aavin Premium Milk 500ml", brand: "Aavin", category: "Milk & Dairy", subcategory: "Milk",
        price: "25", originalPrice: "25", minOrder: "1", availableQuantity: 60, unit: "packet",
        marketplaceType: "QUICK", rating: 4.7, reviewCount: 150,
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["milk", "paal", "aavin", "dairy", "பால்"],
        description: "Aavin full cream milk."
    },
    {
        title: "Arokya Curd 500g", brand: "Arokya", category: "Milk & Dairy", subcategory: "Curd",
        price: "35", originalPrice: "35", minOrder: "1", availableQuantity: 40, unit: "packet",
        marketplaceType: "QUICK", rating: 4.6, reviewCount: 110,
        image: "https://images.unsplash.com/photo-1591535798993-9097e37b12d5?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["curd", "thayir", "dairy", "tayir", "தயிர்"],
        description: "Thick and fresh curd."
    },
    {
        title: "Amul Fresh Paneer 200g", brand: "Amul", category: "Milk & Dairy", subcategory: "Paneer",
        price: "85", originalPrice: "90", minOrder: "1", availableQuantity: 30, unit: "packet",
        marketplaceType: "QUICK", rating: 4.8, reviewCount: 140,
        image: "https://images.unsplash.com/photo-1631387622941-8e40f9076f63?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["paneer", "dairy", "cheese", "பன்னீர்"],
        description: "Soft and fresh paneer."
    },
    {
        title: "Amul Butter 100g", brand: "Amul", category: "Milk & Dairy", subcategory: "Butter",
        price: "56", originalPrice: "56", minOrder: "1", availableQuantity: 45, unit: "piece",
        marketplaceType: "QUICK", rating: 4.9, reviewCount: 200,
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["butter", "vennai", "dairy", "வெண்ணெய்"],
        description: "Delicious salted butter."
    },
    {
        title: "Farm Fresh Eggs 6pcs", brand: "Local", category: "Milk & Dairy", subcategory: "Eggs",
        price: "42", originalPrice: "45", minOrder: "1", availableQuantity: 100, unit: "tray",
        marketplaceType: "QUICK", rating: 4.6, reviewCount: 95,
        image: "https://images.unsplash.com/photo-1587486913049-53fc88980360?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["egg", "muttai", "முட்டை", "eggs"],
        description: "Fresh brown eggs."
    },
    {
        title: "Modern Sandwich Bread", brand: "Modern", category: "Bakery", subcategory: "Bread",
        price: "45", originalPrice: "45", minOrder: "1", availableQuantity: 30, unit: "packet",
        marketplaceType: "QUICK", rating: 4.5, reviewCount: 80,
        image: "https://images.unsplash.com/photo-1598128558393-70ff21433be0?q=80&w=1000&auto=format&fit=crop",
        searchKeywords: ["bread", "bakery", "sandwich", "பிரெட்"],
        description: "Soft and fresh sandwich bread."
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
        const shoppingPayload = SHOPPING_PRODUCTS.map(p => ({
            ...p,
            location: "Pan India",
            contact: "support@greenbond.com",
            sourceType: "SHOP" // Using SHOP to bypass Farmer constraints, though sellerType is ADMIN
        }));
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
        const quickPayload = QUICK_PRODUCTS.map(p => ({
            ...p,
            location: shop.location.address,
            contact: shop.mobile,
            sellerId: shop._id,
            sellerType: "SHOP_OWNER",
            sourceType: "SHOP"
        }));
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
