import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import Shop from '../models/Shop.js';
import { verifyToken, isFarmer, isShop } from '../middleware/auth.js';
import { getProductImage } from '../services/image/imageResolver.js';

// Register a new product
router.post('/add', verifyToken, async (req, res) => {
    try {
        let { name, title, location, price, minOrder, category, contact, image, description, stock, availableQuantity, unit, orderType } = req.body;
        
        // Map legacy farmer schema fields
        if (!name && title) name = title;
        if (stock === undefined && availableQuantity !== undefined) stock = availableQuantity;
        
        // Ensure price is stored numerically for calculations
        const rawPrice = price;
        const numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 0);
        
        let sourceType = 'FARMER';
        let sellerId = req.user.id;
        let farmerName = '';

        if (req.user.role === 'client' || req.user.role === 'farmer') {
            const farmerRecord = await Farmer.findById(req.user.id);
            if (!farmerRecord || farmerRecord.verificationStatus !== 'APPROVED') {
                return res.status(403).json({ message: 'Only APPROVED farmers can add products.' });
            }
            farmerName = farmerRecord.name;
        } else if (req.user.role === 'shop') {
            const shopRecord = await Shop.findById(req.user.id);
            if (!shopRecord || !shopRecord.isActive) {
                return res.status(403).json({ message: 'Only active shops can add products.' });
            }
            sourceType = 'SHOP';
            farmerName = shopRecord.name; // Use shop name in farmer field for backward compatibility
        } else {
            return res.status(403).json({ message: 'Unauthorized role to add products.' });
        }

        const newProduct = new Product({
            name,
            farmer: farmerName,
            farmerId: req.user.role === 'shop' ? undefined : req.user.id,
            sellerId,
            sourceType,
            location,
            price: numericPrice.toString(),
            mrp: rawPrice, // Store the string version like ₹40/kg here just in case
            minOrder,
            category,
            contact,
            image,
            description,
            stock,
            unit,
            orderType
        });

        await newProduct.save();
        res.status(201).json({ message: 'Product listed successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all products (with optional filtering by sourceType and location)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sourceType = req.query.sourceType;
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);

        const filter = {};
        if (sourceType) {
            filter.sourceType = sourceType;
        }
        
        const q = req.query.q || req.query.search;
        if (q && q.trim() !== '') {
            // Very simple text search, same behavior as marketplace
            filter.$text = { $search: q };
        }
        
        // Very basic mock of location filtering if coords provided.
        // In reality, this requires an aggregation with $geoNear on Shop/Farmer collections,
        // because Product itself doesn't have a 2dsphere index (only location string).
        // Since schema doesn't have 2dsphere on Product, we just return based on sourceType for now.

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
            
        const mappedProducts = products.map(p => ({
            ...p,
            image: getProductImage(p),
            primaryImageUrl: getProductImage(p)
        }));
            
        res.set('X-Total-Count', total);
        res.set('X-Total-Pages', Math.ceil(total / limit));
        res.json(mappedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get my products (farmer or shop)
router.get('/my-products', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        let filter = {};
        if (req.user.role === 'shop') filter.sellerId = req.user.id;
        else filter.farmerId = req.user.id; // Legacy support or client role

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json(products);
    } catch (error) {
        console.error('Error fetching farmer products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update product stock (for farmers and shops)
router.put('/:id/stock', verifyToken, async (req, res) => {
    try {
        const { availableQuantity } = req.body;
        
        if (availableQuantity < 0) {
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }

        const product = await Product.findOne({ 
            _id: req.params.id, 
            $or: [{ farmerId: req.user.id }, { sellerId: req.user.id }]
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        product.availableQuantity = availableQuantity;
        await product.save();

        res.status(200).json({ message: 'Stock updated successfully', product });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Image Upload Pipeline using multer and sharp
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, '../storage/cdn/products');

// Ensure directory exists
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

router.post('/:id/upload-image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const product = await Product.findOne({ 
            _id: req.params.id, 
            $or: [{ farmerId: req.user.id }, { sellerId: req.user.id }]
        });

        if (!product && req.user.role !== 'admin') {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        // Optimize and save as WebP
        const filename = `${product._id}-${Date.now()}.webp`;
        const categoryFolder = product.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const categoryPath = path.join(storagePath, categoryFolder);
        
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }
        
        const outputPath = path.join(categoryPath, filename);

        await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);

        // Generate CDN URL (stored relative to CDN base)
        const imageUrl = `/cdn/products/${categoryFolder}/${filename}`;
        
        const prodToUpdate = product || await Product.findById(req.params.id);
        prodToUpdate.imageUrl = imageUrl;
        prodToUpdate.image = imageUrl; // Legacy support
        prodToUpdate.images.push(imageUrl);
        await prodToUpdate.save();

        res.status(200).json({ message: 'Image uploaded successfully', imageUrl, product: prodToUpdate });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Server error during image upload' });
    }
});

export default router;

