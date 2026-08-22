import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import Farmer from './models/Farmer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        const farmers = await Farmer.find({});
        console.log('Farmers count:', farmers.length);
        const farmerProducts = await Product.find({ $or: [{ sourceType: 'FARMER' }, { sellerType: 'FARMER' }, { farmerId: { $exists: true } }] });
        console.log('Farmer Products count:', farmerProducts.length);
        if (farmerProducts.length > 0) {
            console.log('Sample Farmer Product:', JSON.stringify(farmerProducts[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
