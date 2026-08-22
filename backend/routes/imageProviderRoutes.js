import express from 'express';
import imageProvider from '../services/imageProvider.js';

const router = express.Router();

router.get('/search', async (req, res) => {
    try {
        const { brand, name, category, size, color } = req.query;

        if (!name && !brand && !category) {
            return res.status(400).json({ success: false, message: 'Missing search parameters' });
        }

        const result = await imageProvider.searchProductImage({ brand, name, category, size, color });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Error in image search route:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
