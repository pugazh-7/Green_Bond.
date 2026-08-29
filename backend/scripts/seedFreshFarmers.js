import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RAW_PRODUCTS = [
    // --- SPECIAL REQUEST ---
    { title: 'Fresh Banana Leaf', farmer: 'Madurai Green Farms', location: 'Madurai', price: '5', mrp: '₹5/piece', minOrder: '10 pcs', unit: 'piece', category: 'Greens' },
    { title: 'Large Banana Leaf (Thalaivazhai)', farmer: 'Theni Organic Groves', location: 'Theni', price: '8', mrp: '₹8/piece', minOrder: '5 pcs', unit: 'piece', category: 'Greens' },
    { title: 'Banana Leaf Bundle (100 pcs)', farmer: 'Kaveri Delta Farmers', location: 'Thanjavur', price: '400', mrp: '₹400/bundle', minOrder: '1 bundle', unit: 'bundle', category: 'Greens' },

    // --- VEGETABLES ---
    { title: 'Organic Tomatoes', farmer: 'Ramesh Kumar', location: 'Madurai', price: '40', mrp: '₹40/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Fresh Carrots', farmer: 'Lakshmi Devi', location: 'Ooty', price: '60', mrp: '₹60/kg', minOrder: '3 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Red Onions', farmer: 'Nashik Aggregators', location: 'Nashik', price: '35', mrp: '₹35/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Potatoes (New Harvest)', farmer: 'Agra Farms', location: 'Agra', price: '25', mrp: '₹25/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Green Beans', farmer: 'Nilgiri Veggies', location: 'Ooty', price: '55', mrp: '₹55/kg', minOrder: '2 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Brinjal (Eggplant)', farmer: 'Local Farmers', location: 'Dindigul', price: '30', mrp: '₹30/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Ladies Finger', farmer: 'Coimbatore Organics', location: 'Coimbatore', price: '40', mrp: '₹40/kg', minOrder: '3 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Beetroot', farmer: 'Hilltop Farms', location: 'Kodaikanal', price: '45', mrp: '₹45/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Cabbage', farmer: 'Green Valley', location: 'Munnar', price: '20', mrp: '₹20/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Cauliflower', farmer: 'Fresh Daily', location: 'Hosur', price: '35', mrp: '₹35/pc', minOrder: '5 pcs', unit: 'pc', category: 'Vegetables' },
    { title: 'Drumstick', farmer: 'Murugan Farms', location: 'Madurai', price: '60', mrp: '₹60/kg', minOrder: '2 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Pumpkin', farmer: 'Village Harvest', location: 'Tirunelveli', price: '15', mrp: '₹15/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Snake Gourd', farmer: 'Natural Farms', location: 'Trichy', price: '30', mrp: '₹30/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Bitter Gourd', farmer: 'Healthy Greens', location: 'Karur', price: '45', mrp: '₹45/kg', minOrder: '3 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Bottle Gourd', farmer: 'River Farms', location: 'Thanjavur', price: '20', mrp: '₹20/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'White Radish', farmer: 'Cool Climate Crops', location: 'Ooty', price: '25', mrp: '₹25/kg', minOrder: '5 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Green Capsicum', farmer: 'Greenhouse Growers', location: 'Hosur', price: '50', mrp: '₹50/kg', minOrder: '3 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Green Chilli', farmer: 'Spicy Fields', location: 'Guntur', price: '40', mrp: '₹40/kg', minOrder: '1 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Garlic', farmer: 'Ooty Spice', location: 'Ooty', price: '120', mrp: '₹120/kg', minOrder: '1 kg', unit: 'kg', category: 'Vegetables' },
    { title: 'Ginger', farmer: 'Kerala Spices', location: 'Wayanad', price: '80', mrp: '₹80/kg', minOrder: '1 kg', unit: 'kg', category: 'Vegetables' },

    // --- FRUITS ---
    { title: 'Shimla Apples', farmer: 'Himachal Farms', location: 'Shimla', price: '120', mrp: '₹120/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Robusta Banana', farmer: 'Theni Banana Co.', location: 'Theni', price: '30', mrp: '₹30/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Nagpur Oranges', farmer: 'Citrus Groves', location: 'Nagpur', price: '60', mrp: '₹60/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Black Grapes', farmer: 'Nashik Vineyards', location: 'Nashik', price: '90', mrp: '₹90/kg', minOrder: '3 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Alphonso Mango', farmer: 'Ratnagiri Farms', location: 'Ratnagiri', price: '200', mrp: '₹200/dz', minOrder: '2 dz', unit: 'dz', category: 'Fruits' },
    { title: 'Papaya', farmer: 'Tropical Fruits', location: 'Coimbatore', price: '30', mrp: '₹30/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Pomegranate', farmer: 'Ruby Red Farms', location: 'Solapur', price: '110', mrp: '₹110/kg', minOrder: '3 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Watermelon', farmer: 'Summer Harvest', location: 'Tindivanam', price: '15', mrp: '₹15/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Pineapple', farmer: 'Kerala Fresh', location: 'Kochi', price: '50', mrp: '₹50/pc', minOrder: '5 pcs', unit: 'pc', category: 'Fruits' },
    { title: 'Guava', farmer: 'Allahabad Farms', location: 'Allahabad', price: '50', mrp: '₹50/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Jackfruit', farmer: 'Panruti Jacks', location: 'Panruti', price: '200', mrp: '₹200/fruit', minOrder: '1 fruit', unit: 'fruit', category: 'Fruits' },
    { title: 'Sapota (Chikoo)', farmer: 'Dahanu Orchards', location: 'Dahanu', price: '40', mrp: '₹40/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Strawberry', farmer: 'Mahabaleshwar Berries', location: 'Mahabaleshwar', price: '250', mrp: '₹250/kg', minOrder: '1 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Kiwi', farmer: 'Arunachal Exotics', location: 'Itanagar', price: '300', mrp: '₹300/kg', minOrder: '1 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Dragon Fruit', farmer: 'Gujarat Drylands', location: 'Kutch', price: '120', mrp: '₹120/kg', minOrder: '2 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Muskmelon', farmer: 'Andhra Melons', location: 'Kadapa', price: '25', mrp: '₹25/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Avocado (Butter Fruit)', farmer: 'Kodai Estates', location: 'Kodaikanal', price: '150', mrp: '₹150/kg', minOrder: '1 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Custard Apple', farmer: 'Telangana Sitaphal', location: 'Hyderabad', price: '60', mrp: '₹60/kg', minOrder: '3 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Passion Fruit', farmer: 'Nilgiri Exotics', location: 'Coonoor', price: '100', mrp: '₹100/kg', minOrder: '1 kg', unit: 'kg', category: 'Fruits' },
    { title: 'Hill Banana', farmer: 'Dindigul Malai', location: 'Sirumalai', price: '60', mrp: '₹60/kg', minOrder: '5 kg', unit: 'kg', category: 'Fruits' },

    // --- GRAINS ---
    { title: 'Basmati Rice', farmer: 'Punjab Fields', location: 'Amritsar', price: '90', mrp: '₹90/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Ponni Rice', farmer: 'Kaveri Delta', location: 'Trichy', price: '55', mrp: '₹55/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Whole Wheat', farmer: 'MP Sharbati', location: 'Bhopal', price: '35', mrp: '₹35/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Ragi (Finger Millet)', farmer: 'Karnataka Millets', location: 'Mandya', price: '30', mrp: '₹30/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Bajra (Pearl Millet)', farmer: 'Rajasthan Crops', location: 'Jodhpur', price: '25', mrp: '₹25/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Toor Dal', farmer: 'Latur Pulses', location: 'Latur', price: '110', mrp: '₹110/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Moong Dal', farmer: 'Green Gram Co.', location: 'Vijayawada', price: '100', mrp: '₹100/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Chana Dal', farmer: 'Bengal Grams', location: 'Indore', price: '80', mrp: '₹80/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Urad Dal', farmer: 'Andhra Pulses', location: 'Guntur', price: '120', mrp: '₹120/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },
    { title: 'Corn / Maize', farmer: 'Karnataka Corn', location: 'Haveri', price: '20', mrp: '₹20/kg', minOrder: '5 kg', unit: 'kg', category: 'Grains' },

    // --- GREENS & OTHERS ---
    { title: 'Coriander Leaves', farmer: 'Fresh Herbs', location: 'Dindigul', price: '20', mrp: '₹20/bun', minOrder: '5 bun', unit: 'bun', category: 'Greens' },
    { title: 'Curry Leaves', farmer: 'Aroma Farms', location: 'Salem', price: '15', mrp: '₹15/bun', minOrder: '5 bun', unit: 'bun', category: 'Greens' },
    { title: 'Mint Leaves', farmer: 'Cool Herbs', location: 'Ooty', price: '20', mrp: '₹20/bun', minOrder: '5 bun', unit: 'bun', category: 'Greens' },
    { title: 'Spinach (Palak)', farmer: 'City Greens', location: 'Chennai', price: '25', mrp: '₹25/bun', minOrder: '5 bun', unit: 'bun', category: 'Greens' },
    { title: 'Coconut (Large)', farmer: 'Pollachi Coconuts', location: 'Pollachi', price: '25', mrp: '₹25/pc', minOrder: '10 pcs', unit: 'pc', category: 'Others' },
    { title: 'Tender Coconut', farmer: 'Coimbatore Farms', location: 'Coimbatore', price: '40', mrp: '₹40/pc', minOrder: '5 pcs', unit: 'pc', category: 'Others' },
    { title: 'Sugarcane', farmer: 'Sweet Stalks', location: 'Erode', price: '30', mrp: '₹30/pc', minOrder: '10 pcs', unit: 'pc', category: 'Others' },
    { title: 'Arecanut', farmer: 'Shimoga Nuts', location: 'Shimoga', price: '400', mrp: '₹400/kg', minOrder: '1 kg', unit: 'kg', category: 'Others' },
    { title: 'Black Pepper', farmer: 'Kerala Spices', location: 'Idukki', price: '500', mrp: '₹500/kg', minOrder: '0.5 kg', unit: 'kg', category: 'Spices' },
    { title: 'Cardamom', farmer: 'Cardamom Hills', location: 'Thekkady', price: '1500', mrp: '₹1500/kg', minOrder: '0.1 kg', unit: 'kg', category: 'Spices' },
    { title: 'Ghee (Pure Cow Ghee)', farmer: 'Dairy Farm', location: 'Uthukuli', price: '600', mrp: '₹600/lt', minOrder: '1 lt', unit: 'lt', category: 'Dairy' }
];

const LOCATION_COORDS = {
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Theni': { lat: 10.0104, lng: 77.4768 },
    'Thanjavur': { lat: 10.7870, lng: 79.1378 },
    'Ooty': { lat: 11.4102, lng: 76.6950 },
    'Nashik': { lat: 19.9975, lng: 73.7898 },
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Dindigul': { lat: 10.3673, lng: 77.9803 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Kodaikanal': { lat: 10.2381, lng: 77.4892 },
    'Munnar': { lat: 10.0889, lng: 77.0595 },
    'Hosur': { lat: 12.7409, lng: 77.8253 },
    'Tirunelveli': { lat: 8.7139, lng: 77.7567 },
    'Trichy': { lat: 10.7905, lng: 78.7047 },
    'Karur': { lat: 10.9601, lng: 78.0766 },
    'Guntur': { lat: 16.3067, lng: 80.4365 },
    'Wayanad': { lat: 11.6854, lng: 76.1320 },
    'Shimla': { lat: 31.1048, lng: 77.1734 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    'Ratnagiri': { lat: 16.9902, lng: 73.3120 },
    'Solapur': { lat: 17.6599, lng: 75.9064 },
    'Tindivanam': { lat: 12.2333, lng: 79.6500 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Allahabad': { lat: 25.4358, lng: 81.8463 },
    'Panruti': { lat: 11.7744, lng: 79.5536 },
    'Dahanu': { lat: 19.9723, lng: 72.7317 },
    'Mahabaleshwar': { lat: 17.9307, lng: 73.6477 },
    'Itanagar': { lat: 27.0844, lng: 93.6053 },
    'Kutch': { lat: 23.7337, lng: 69.8597 },
    'Kadapa': { lat: 14.4673, lng: 78.8241 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Coonoor': { lat: 11.3530, lng: 76.7959 },
    'Sirumalai': { lat: 10.1983, lng: 77.9942 },
    'Amritsar': { lat: 31.6340, lng: 74.8723 },
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Mandya': { lat: 12.5244, lng: 76.8958 },
    'Jodhpur': { lat: 26.2389, lng: 73.0243 },
    'Latur': { lat: 18.4088, lng: 76.5604 },
    'Vijayawada': { lat: 16.5062, lng: 80.6480 },
    'Indore': { lat: 22.7196, lng: 75.8577 },
    'Haveri': { lat: 14.7955, lng: 75.4002 },
    'Salem': { lat: 11.6643, lng: 78.1460 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Pollachi': { lat: 10.6609, lng: 77.0089 },
    'Erode': { lat: 11.3410, lng: 77.7172 },
    'Shimoga': { lat: 13.9299, lng: 75.5681 },
    'Idukki': { lat: 9.8494, lng: 76.9806 },
    'Thekkady': { lat: 9.6031, lng: 77.1615 },
    'Uthukuli': { lat: 11.1667, lng: 77.4500 }
};

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('Connected.');

        // Unique farmers
        const farmerMap = new Map();

        for (const item of RAW_PRODUCTS) {
            if (!farmerMap.has(item.farmer)) {
                farmerMap.set(item.farmer, {
                    name: item.farmer,
                    location: item.location,
                    coords: LOCATION_COORDS[item.location] || { lat: 13.0827, lng: 80.2707 }
                });
            }
        }

        console.log(`Setting up ${farmerMap.size} Verified Farmers...`);
        let phoneCounter = 9876543200;
        const farmerDocMap = new Map();

        for (const [name, fData] of farmerMap.entries()) {
            let farmer = await Farmer.findOne({ name });
            if (!farmer) {
                farmer = await Farmer.create({
                    name,
                    mobile: (phoneCounter++).toString(),
                    location: fData.location,
                    address: `${fData.location} Farm, Tamil Nadu`,
                    pin: '600001',
                    verificationStatus: 'APPROVED',
                    farmLocation: {
                        lat: fData.coords.lat,
                        lng: fData.coords.lng,
                        address: `${fData.location} Agricultural Zone`
                    },
                    farmLocationGeo: {
                        type: 'Point',
                        coordinates: [fData.coords.lng, fData.coords.lat]
                    },
                    serviceRadius: 50
                });
            } else {
                farmer.verificationStatus = 'APPROVED';
                farmer.farmLocationGeo = {
                    type: 'Point',
                    coordinates: [fData.coords.lng, fData.coords.lat]
                };
                await farmer.save();
            }
            farmerDocMap.set(name, farmer);
        }

        console.log('Seeding / updating 100 Fresh Farmer Products...');
        let inserted = 0;
        let updated = 0;

        for (const item of RAW_PRODUCTS) {
            const farmerDoc = farmerDocMap.get(item.farmer);
            const safeSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const imageKey = `products/fresh/${safeSlug}`;

            const productPayload = {
                name: item.title,
                farmer: item.farmer,
                farmerId: farmerDoc?._id,
                sellerId: farmerDoc?._id,
                sourceType: 'FARMER',
                sellerType: 'FARMER',
                marketplaceType: 'FRESH',
                category: item.category,
                price: item.price,
                mrp: item.mrp,
                minOrder: item.minOrder,
                unit: item.unit,
                stock: 100,
                location: item.location,
                contact: farmerDoc?.mobile || '9876543210',
                imageKey: imageKey,
                imageVersion: 1,
                imageStatus: 'READY',
                description: `Freshly harvested ${item.title} directly from ${item.farmer}'s farm in ${item.location}. Bulk inquiries accepted.`,
                searchKeywords: [item.title.toLowerCase(), item.category.toLowerCase(), item.location.toLowerCase(), 'fresh', 'farm', 'organic'],
                rating: 4.8,
                reviewCount: 45,
                isActive: true
            };

            const existing = await Product.findOne({ name: item.title, marketplaceType: 'FRESH' });
            if (existing) {
                await Product.updateOne({ _id: existing._id }, { $set: productPayload });
                updated++;
            } else {
                await Product.create(productPayload);
                inserted++;
            }
        }

        console.log('\n================ SEED REPORT ================');
        console.log(`Farmers Processed: ${farmerMap.size}`);
        console.log(`Fresh Products Inserted: ${inserted}`);
        console.log(`Fresh Products Updated:  ${updated}`);
        console.log('=============================================\n');

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
