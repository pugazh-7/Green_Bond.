import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MOCK_SHOP_EMAIL = "quickmart@greenbond.com";

const quickCategories = {
    'Daily Essentials': [
        { name: 'Nandini GoodLife Milk 500ml', price: '25', brand: 'Nandini', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' },
        { name: 'Heritage Curd 400g', price: '30', brand: 'Heritage', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' },
        { name: 'Britannia White Bread 400g', price: '45', brand: 'Britannia', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=200&auto=format&fit=crop' },
        { name: 'Amul Butter 100g', price: '58', brand: 'Amul', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Farm Fresh Brown Eggs (6 pcs)', price: '65', brand: 'Farm Fresh', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=200&auto=format&fit=crop' },
        { name: 'Tata Salt 1kg', price: '28', brand: 'Tata', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Madhur Sugar 1kg', price: '60', brand: 'Madhur', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c41463c?q=80&w=200&auto=format&fit=crop' },
        { name: 'Aashirvaad Atta 1kg', price: '65', brand: 'Aashirvaad', image: 'https://images.unsplash.com/photo-1627485937980-221c88ce049c?q=80&w=200&auto=format&fit=crop' }
    ],
    'Milk & Dairy': [
        { name: 'Amul Taaza Milk 500 ml', price: '32', brand: 'Amul', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' },
        { name: 'Milky Mist Paneer 200g', price: '95', brand: 'Milky Mist', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946cea?q=80&w=200&auto=format&fit=crop' },
        { name: 'Amul Cheese Slices (10 pcs)', price: '135', brand: 'Amul', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=200&auto=format&fit=crop' },
        { name: 'Nandini Ghee 500ml', price: '350', brand: 'Nandini', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946cea?q=80&w=200&auto=format&fit=crop' },
        { name: 'Epigamia Greek Yogurt (Blueberry)', price: '70', brand: 'Epigamia', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=200&auto=format&fit=crop' },
        { name: 'Amul Masti Buttermilk 200ml', price: '15', brand: 'Amul', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' },
        { name: 'Heritage Toned Milk 500ml', price: '30', brand: 'Heritage', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' },
        { name: 'Milky Mist Set Curd 500g', price: '45', brand: 'Milky Mist', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' }
    ],
    'Bakery': [
        { name: 'Modern Sweet Bread 400g', price: '40', brand: 'Modern', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=200&auto=format&fit=crop' },
        { name: 'Britannia Pav (6 pcs)', price: '35', brand: 'Britannia', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=200&auto=format&fit=crop' },
        { name: 'Elite Plum Cake 300g', price: '150', brand: 'Elite', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop' },
        { name: 'Britannia Good Day Cookies 75g', price: '10', brand: 'Britannia', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=200&auto=format&fit=crop' },
        { name: 'Parle Rusk 300g', price: '50', brand: 'Parle', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop' },
        { name: 'English Oven Burger Buns (4 pcs)', price: '45', brand: 'English Oven', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=200&auto=format&fit=crop' },
        { name: 'Britannia Muffins (Choco)', price: '60', brand: 'Britannia', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format&fit=crop' }
    ],
    'Snacks': [
        { name: 'Lay\'s Classic Salted 50g', price: '20', brand: 'Lays', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Kurkure Masala Munch 90g', price: '20', brand: 'Kurkure', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Haldiram\'s Bhujia Sev 200g', price: '55', brand: 'Haldiram', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=200&auto=format&fit=crop' },
        { name: 'ACT II Butter Popcorn 90g', price: '35', brand: 'ACT II', image: 'https://images.unsplash.com/photo-1572196284554-4e321b0e7e0b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Maggi 2-Minute Noodles 70g', price: '14', brand: 'Maggi', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=200&auto=format&fit=crop' },
        { name: 'Cadbury Dairy Milk Silk 60g', price: '80', brand: 'Cadbury', image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=200&auto=format&fit=crop' },
        { name: 'Snickers Peanut Bar 50g', price: '45', brand: 'Snickers', image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=200&auto=format&fit=crop' },
        { name: 'Bingo Mad Angles 90g', price: '20', brand: 'Bingo', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=200&auto=format&fit=crop' }
    ],
    'Drinks': [
        { name: 'Coca-Cola 750ml', price: '40', brand: 'Coca-Cola', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=200&auto=format&fit=crop' },
        { name: 'Sprite 750ml', price: '40', brand: 'Sprite', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
        { name: 'Bisleri Mineral Water 1L', price: '20', brand: 'Bisleri', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=200&auto=format&fit=crop' },
        { name: 'Red Bull Energy Drink 250ml', price: '125', brand: 'Red Bull', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
        { name: 'Gatorade Sports Drink 500ml', price: '50', brand: 'Gatorade', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
        { name: 'Paper Boat Coconut Water 200ml', price: '40', brand: 'Paper Boat', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=200&auto=format&fit=crop' },
        { name: 'Nescafe Cold Coffee 180ml', price: '35', brand: 'Nescafe', image: 'https://images.unsplash.com/photo-1461023058943-0708f52992e1?q=80&w=200&auto=format&fit=crop' },
        { name: 'Tropicana Orange Juice 200ml', price: '20', brand: 'Tropicana', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' }
    ],
    'Grocery': [
        { name: 'India Gate Basmati Rice 1kg', price: '120', brand: 'India Gate', image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=200&auto=format&fit=crop' },
        { name: 'Tata Sampann Toor Dal 500g', price: '85', brand: 'Tata Sampann', image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=200&auto=format&fit=crop' },
        { name: 'Fortune Sunflower Oil 1L', price: '145', brand: 'Fortune', image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=200&auto=format&fit=crop' },
        { name: 'Everest Garam Masala 100g', price: '75', brand: 'Everest', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=200&auto=format&fit=crop' },
        { name: 'MTR Rava Idli Mix 500g', price: '110', brand: 'MTR', image: 'https://images.unsplash.com/photo-1627485937980-221c88ce049c?q=80&w=200&auto=format&fit=crop' },
        { name: 'Saffola Gold Cooking Oil 1L', price: '190', brand: 'Saffola', image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=200&auto=format&fit=crop' },
        { name: 'MDH Chana Masala 100g', price: '65', brand: 'MDH', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=200&auto=format&fit=crop' },
        { name: 'Kellogg\'s Corn Flakes 475g', price: '160', brand: 'Kelloggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop' }
    ],
    'Personal Care': [
        { name: 'Dove Cream Beauty Bathing Bar 100g', price: '50', brand: 'Dove', image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=200&auto=format&fit=crop' },
        { name: 'Head & Shoulders Anti-Dandruff Shampoo 180ml', price: '160', brand: 'Head & Shoulders', image: 'https://images.unsplash.com/photo-1585232351009-287731f855de?q=80&w=200&auto=format&fit=crop' },
        { name: 'Colgate Strong Teeth Toothpaste 100g', price: '60', brand: 'Colgate', image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=200&auto=format&fit=crop' },
        { name: 'Oral-B CrossAction Toothbrush', price: '45', brand: 'Oral-B', image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=200&auto=format&fit=crop' },
        { name: 'Gillette Mach3 Razor', price: '299', brand: 'Gillette', image: 'https://images.unsplash.com/photo-1585232351009-287731f855de?q=80&w=200&auto=format&fit=crop' },
        { name: 'Whisper Ultra Clean Sanitary Pads (15 pcs)', price: '140', brand: 'Whisper', image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?q=80&w=200&auto=format&fit=crop' },
        { name: 'Himalaya Purifying Neem Face Wash 100ml', price: '120', brand: 'Himalaya', image: 'https://images.unsplash.com/photo-1585232351009-287731f855de?q=80&w=200&auto=format&fit=crop' },
        { name: 'Nivea Body Lotion 200ml', price: '210', brand: 'Nivea', image: 'https://images.unsplash.com/photo-1585232351009-287731f855de?q=80&w=200&auto=format&fit=crop' },
        { name: 'Dettol Hand Wash Liquid 200ml', price: '99', brand: 'Dettol', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' }
    ],
    'Household': [
        { name: 'Surf Excel Easy Wash Detergent 1kg', price: '130', brand: 'Surf Excel', image: 'https://images.unsplash.com/photo-1585220176885-3037eb9380f6?q=80&w=200&auto=format&fit=crop' },
        { name: 'Vim Dishwash Gel 500ml', price: '105', brand: 'Vim', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' },
        { name: 'Lizol Floor Cleaner 500ml', price: '99', brand: 'Lizol', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' },
        { name: 'Harpic Toilet Cleaner 500ml', price: '93', brand: 'Harpic', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' },
        { name: 'Origami Paper Towels (2 Rolls)', price: '120', brand: 'Origami', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' },
        { name: 'Good Knight Gold Flash Refill', price: '75', brand: 'Good Knight', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' },
        { name: 'Duracell AA Batteries (4 pcs)', price: '160', brand: 'Duracell', image: 'https://images.unsplash.com/photo-1585220176885-3037eb9380f6?q=80&w=200&auto=format&fit=crop' },
        { name: 'Odonil Room Freshener Block 50g', price: '45', brand: 'Odonil', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?q=80&w=200&auto=format&fit=crop' }
    ],
    'Mobile Accessories': [
        { name: 'Boat Type-C Cable 1.5m', price: '299', brand: 'Boat', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' },
        { name: 'Portronics 20W Fast Charger', price: '499', brand: 'Portronics', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' },
        { name: 'Realme Buds Classic Earphones', price: '399', brand: 'Realme', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop' },
        { name: 'Boat BassHeads 100 Wired Earphones', price: '399', brand: 'Boat', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop' },
        { name: 'Ambrane 10000mAh Power Bank', price: '999', brand: 'Ambrane', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=200&auto=format&fit=crop' },
        { name: 'Wayona Lightning to USB Cable', price: '349', brand: 'Wayona', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' },
        { name: 'Universal Phone Stand', price: '149', brand: 'Generic', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' },
        { name: 'SanDisk 64GB OTG Flash Drive', price: '699', brand: 'SanDisk', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' }
    ],
    'Electronics': [
        { name: 'Boat Airdopes 141 TWS', price: '1299', brand: 'Boat', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop' },
        { name: 'Noise ColorFit Pulse Smartwatch', price: '1499', brand: 'Noise', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop' },
        { name: 'Logitech B170 Wireless Mouse', price: '599', brand: 'Logitech', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=200&auto=format&fit=crop' },
        { name: 'HP K1500 Wired Keyboard', price: '499', brand: 'HP', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=200&auto=format&fit=crop' },
        { name: 'Boat Stone 190 Bluetooth Speaker', price: '999', brand: 'Boat', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=200&auto=format&fit=crop' },
        { name: 'Philips 9W LED Bulb', price: '99', brand: 'Philips', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=200&auto=format&fit=crop' },
        { name: 'Syska 4-Socket Extension Board', price: '349', brand: 'Syska', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=200&auto=format&fit=crop' },
        { name: 'Casio Basic Calculator', price: '399', brand: 'Casio', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' }
    ],
    'Gifts': [
        { name: 'Ferrero Rocher Chocolates (16 pcs)', price: '499', brand: 'Ferrero', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop' },
        { name: 'Birthday Greeting Card', price: '99', brand: 'Archies', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=200&auto=format&fit=crop' },
        { name: 'Red Rose Bouquet (6 pcs)', price: '299', brand: 'Ferns N Petals', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55ef6?q=80&w=200&auto=format&fit=crop' },
        { name: 'Premium Gift Wrapping Paper', price: '50', brand: 'Generic', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=200&auto=format&fit=crop' },
        { name: 'Happy Birthday Balloon Pack', price: '149', brand: 'Generic', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=200&auto=format&fit=crop' },
        { name: 'Cadbury Celebrations Box', price: '250', brand: 'Cadbury', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop' },
        { name: 'Scented Glass Candle (Vanilla)', price: '199', brand: 'Generic', image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=200&auto=format&fit=crop' },
        { name: 'Small Teddy Bear (Pink)', price: '299', brand: 'Generic', image: 'https://images.unsplash.com/photo-1584849611980-60b64d0d0812?q=80&w=200&auto=format&fit=crop' }
    ],
    'Mobiles': [
        { name: 'Redmi 13C 5G (4GB RAM, 128GB)', price: '10999', brand: 'Redmi', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200&auto=format&fit=crop' },
        { name: 'Samsung Galaxy M14 (4GB RAM, 128GB)', price: '12490', brand: 'Samsung', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200&auto=format&fit=crop' },
        { name: 'Nokia 105 Single SIM Keypad Phone', price: '1299', brand: 'Nokia', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200&auto=format&fit=crop' },
        { name: 'Apple iPhone 15 Silicone Case', price: '999', brand: 'Generic', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' },
        { name: 'Universal Tempered Glass Screen Protector', price: '199', brand: 'Generic', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=200&auto=format&fit=crop' }
    ],
    'Fashion Essentials': [
        { name: 'Jockey Men\'s Cotton Ankle Socks (Pack of 3)', price: '349', brand: 'Jockey', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Allen Solly Cotton Handkerchief (Pack of 3)', price: '199', brand: 'Allen Solly', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Puma Black Baseball Cap', price: '499', brand: 'Puma', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200&auto=format&fit=crop' },
        { name: 'Titan Genuine Leather Men\'s Wallet', price: '999', brand: 'Titan', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop' },
        { name: 'Basic White T-Shirt (Size M)', price: '399', brand: 'Generic', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop' },
        { name: 'Generic Hair Ties/Scrunchies (Pack of 6)', price: '99', brand: 'Generic', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200&auto=format&fit=crop' }
    ]
};

async function seedQuick() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('Connected to MongoDB');

        // Check for QuickMart shop or create one
        let quickMart = await Shop.findOne({ email: MOCK_SHOP_EMAIL });
        if (!quickMart) {
            quickMart = await Shop.create({
                name: "QuickMart Super Store",
                ownerName: "QuickMart Owner",
                email: MOCK_SHOP_EMAIL,
                mobile: "9876543210",
                password: "password123",
                location: {
                    address: "Central Market"
                },
                locationGeo: {
                    type: "Point",
                    coordinates: [77.2090, 28.6139] // Close to standard test coords
                },
                isActive: true,
                verificationStatus: 'APPROVED'
            });
            console.log('Created QuickMart mock shop');
        }

        const shopId = quickMart._id;

        // Clear existing quick items for this mock shop to avoid duplicates
        await Product.deleteMany({ sellerId: shopId, marketplaceType: 'QUICK' });
        console.log('Cleared old QuickMart products');

        let insertCount = 0;
        
        for (const [category, items] of Object.entries(quickCategories)) {
            const docs = items.map(item => ({
                name: item.name,
                brand: item.brand,
                category: category,
                mrp: `₹${item.price}`,
                price: item.price,
                stock: Math.floor(Math.random() * 50) + 10,
                image: item.image,
                images: [item.image],
                sellerId: shopId,
                sellerType: 'SHOP_OWNER',
                marketplaceType: 'QUICK',
                sourceType: 'SHOP',
                isActive: true,
                rating: (4 + Math.random()).toFixed(1),
                reviewCount: Math.floor(Math.random() * 500) + 10,
                searchKeywords: [item.name.split(' ')[0].toLowerCase(), item.brand.toLowerCase()],
                unit: item.name.match(/\b(\d+)\s*(kg|g|ml|l|L|pcs|Rolls|W|mAh|GB)\b/i) ? item.name.match(/\b(\d+)\s*(kg|g|ml|l|L|pcs|Rolls|W|mAh|GB)\b/i)[0] : '1 unit',
                minOrder: '1',
                contact: quickMart.mobile,
                location: quickMart.location?.address || 'Central Market'
            }));

            await Product.insertMany(docs);
            insertCount += docs.length;
        }

        console.log(`Successfully inserted ${insertCount} Quick products across ${Object.keys(quickCategories).length} categories.`);

        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedQuick();
