import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import Farmer from '../models/Farmer.js';
import Shop from '../models/Shop.js';
import { verifyToken, isFarmer, isShop } from '../middleware/auth.js';

// Register a new product
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { title, location, price, minOrder, category, contact, image, description, availableQuantity, unit, orderType } = req.body;
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
            title,
            farmer: farmerName,
            farmerId: req.user.role === 'shop' ? undefined : req.user.id,
            sellerId,
            sourceType,
            location,
            price,
            minOrder,
            category,
            contact,
            image,
            description,
            availableQuantity,
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
        
        // Very basic mock of location filtering if coords provided.
        // In reality, this requires an aggregation with $geoNear on Shop/Farmer collections,
        // because Product itself doesn't have a 2dsphere index (only location string).
        // Since schema doesn't have 2dsphere on Product, we just return based on sourceType for now.

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json(products);
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

export default router;

