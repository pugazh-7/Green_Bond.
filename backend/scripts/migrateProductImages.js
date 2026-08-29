import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../models/Product.js';
import fs from 'fs';

const CDN_BASE_PATH = path.join(__dirname, '../storage/cdn');

async function migrateImages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('Connected to MongoDB');

        const products = await Product.find({}).lean();
        console.log(`Found ${products.length} products to check/migrate.`);

        let updated = 0;
        let readyCount = 0;
        let missingCount = 0;

        for (const product of products) {
            const marketplace = (product.marketplaceType || 'fresh').toLowerCase();
            const safeName = (product.name || product.title || product._id.toString())
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const deterministicKey = product.imageKey || `products/${marketplace}/${safeName}`;

            // Check if file exists on disk
            let exists = false;
            const possibleExtensions = ['', '.webp', '.jpg', '.jpeg', '.png'];
            for (const ext of possibleExtensions) {
                const checkPath = path.join(CDN_BASE_PATH, `${deterministicKey}${ext}`);
                if (fs.existsSync(checkPath)) {
                    exists = true;
                    break;
                }
            }

            const status = exists ? 'READY' : 'MISSING';
            if (exists) readyCount++;
            else missingCount++;

            await Product.updateOne(
                { _id: product._id },
                {
                    $set: {
                        imageKey: deterministicKey,
                        imageVersion: product.imageVersion || 1,
                        imageStatus: status,
                        imageUpdatedAt: new Date(),
                        // Clear external/random Unsplash URLs from legacy image field
                        image: product.image && product.image.includes('unsplash.com') ? '' : (product.image || '')
                    }
                }
            );
            updated++;
        }

        console.log('\n================ MIGRATION REPORT ================');
        console.log(`Total Products Checked: ${products.length}`);
        console.log(`Products Updated:       ${updated}`);
        console.log(`Images READY on disk:   ${readyCount}`);
        console.log(`Images MISSING (SVG):   ${missingCount}`);
        console.log('==================================================\n');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

migrateImages();

