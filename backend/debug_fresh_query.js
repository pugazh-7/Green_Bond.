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
        
        console.log('--- Checking Farmers ---');
        const farmers = await Farmer.find({ verificationStatus: 'APPROVED' }).lean();
        console.log('Approved Farmers:', farmers.length);
        if (farmers.length === 0) {
            console.log('No approved farmers found!');
        } else {
            const farmerIds = farmers.map(f => f._id);
            console.log('Farmer IDs:', farmerIds);
            
            let baseQuery = {
                stock: { $gt: 0 },
                $or: [
                    { sellerId: { $in: farmerIds } },
                    { farmerId: { $in: farmerIds } }
                ],
                marketplaceType: 'FRESH'
            };
            
            const products = await Product.find(baseQuery).lean();
            console.log('Products matching Fresh query with stock:', products.length);

            let alternateQuery = {
                $or: [
                    { stock: { $gt: 0 } },
                    { availableQuantity: { $gt: 0 } }
                ],
                $and: [
                    { $or: [
                        { sellerId: { $in: farmerIds } },
                        { farmerId: { $in: farmerIds } }
                    ] }
                ]
            };
            const altProducts = await Product.find(alternateQuery).lean();
            console.log('Products matching alternate query:', altProducts.length);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
