import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import imageProvider from './services/imageProvider.js';

dotenv.config({ path: '.env' });

const updateImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('MongoDB connected');

        const productsToUpdate = [
            { query: { title: /Pears Pure & Gentle Soap/i } },
            { query: { title: /India Gate Basmati Rice/i } },
            { query: { title: /WH-1000XM5/i } },
            { query: { title: /Men's Casual Cotton Shirt/i } }
        ];

        for (const item of productsToUpdate) {
            const product = await Product.findOne(item.query);
            if (product) {
                console.log(`Resolving image for: ${product.title}`);
                const result = await imageProvider.searchProductImage({
                    brand: product.brand,
                    name: product.title,
                    category: product.category
                });

                if (result.success) {
                    product.primaryImageUrl = result.image.url;
                    product.imageSource = result.image.source;
                    product.imageStatus = 'resolved';
                    product.imageUpdatedAt = new Date();
                    
                    product.images = [{
                        url: result.image.url,
                        source: result.image.source,
                        alt: result.image.alt
                    }];

                    await product.save();
                    console.log(`Updated ${product.title} with image URL: ${result.image.url}`);
                }
            } else {
                console.log(`Product not found for query:`, item.query);
            }
        }
        
        // Also ensure we remove any remaining icon fallbacks from other shopping products
        const otherProducts = await Product.find({ marketplaceType: 'SHOPPING', primaryImageUrl: { $exists: false } });
        for (const product of otherProducts) {
             const result = await imageProvider.searchProductImage({
                 brand: product.brand,
                 name: product.title,
                 category: product.category
             });
             
             if (result.success) {
                 product.primaryImageUrl = result.image.url;
                 product.imageSource = result.image.source;
                 product.imageStatus = 'resolved';
                 product.imageUpdatedAt = new Date();
                 await product.save();
                 console.log(`Auto-resolved ${product.title}`);
             }
        }

        console.log('Update complete');
        process.exit(0);
    } catch (err) {
        console.error('Error updating images:', err);
        process.exit(1);
    }
};

updateImages();
