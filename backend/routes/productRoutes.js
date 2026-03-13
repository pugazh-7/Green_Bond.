import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';

// Register a new product
router.post('/add', async (req, res) => {
    try {
        const { title, farmer, location, price, minOrder, category, contact, image, description, availableQuantity, unit, orderType } = req.body;
        
        const newProduct = new Product({
            title,
            farmer,
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

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

