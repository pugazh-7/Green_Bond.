import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('Connected to DB');

        const totalProducts = await Product.countDocuments();
        const freshProducts = await Product.find({
            $or: [
                { marketplaceType: 'FRESH' },
                { sourceType: 'FARMER' },
                { sellerType: 'FARMER' },
                { farmer: { $exists: true, $ne: '' } }
            ]
        }).lean();

        const farmers = await Farmer.find({}).lean();

        console.log(`Total Products: ${totalProducts}`);
        console.log(`Total Farmers in DB: ${farmers.length}`);
        console.log(`Fresh / Farmer Products in DB: ${freshProducts.length}`);

        if (freshProducts.length > 0) {
            console.log('Sample Fresh Product:', {
                _id: freshProducts[0]._id,
                name: freshProducts[0].name,
                farmer: freshProducts[0].farmer,
                price: freshProducts[0].price,
                minOrder: freshProducts[0].minOrder,
                category: freshProducts[0].category,
                marketplaceType: freshProducts[0].marketplaceType,
                sourceType: freshProducts[0].sourceType,
                sellerId: freshProducts[0].sellerId
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
