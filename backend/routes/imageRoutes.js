import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for CDN storage
const CDN_BASE_PATH = path.join(__dirname, '../storage/cdn');

const POSSIBLE_EXTENSIONS = ['', '.webp', '.jpg', '.jpeg', '.png', '.avif', '.svg'];

/**
 * Finds a matching image file on disk for a given relative key.
 */
function findImageFile(key) {
    if (!key) return null;
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;

    for (const ext of POSSIBLE_EXTENSIONS) {
        const fullPath = path.join(CDN_BASE_PATH, `${cleanKey}${ext}`);
        // Prevent path traversal
        if (!fullPath.startsWith(CDN_BASE_PATH)) continue;
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return fullPath;
        }
    }
    return null;
}

/**
 * GET /api/images/health
 * Admin image health summary based on actual DB and storage inspection.
 */
router.get('/health', async (req, res) => {
    try {
        const products = await Product.find({}, { imageKey: 1, imageStatus: 1, marketplaceType: 1, name: 1, title: 1 }).lean();
        
        let ready = 0;
        let missing = 0;
        let failed = 0;
        let processing = 0;
        const keyMap = new Map();
        let duplicateCount = 0;

        for (const p of products) {
            const key = p.imageKey;
            if (key) {
                keyMap.set(key, (keyMap.get(key) || 0) + 1);
            }

            const filePath = findImageFile(key);
            if (filePath) {
                ready++;
            } else if (p.imageStatus === 'failed') {
                failed++;
            } else if (p.imageStatus === 'processing') {
                processing++;
            } else {
                missing++;
            }
        }

        for (const count of keyMap.values()) {
            if (count > 1) duplicateCount += (count - 1);
        }

        res.json({
            success: true,
            health: {
                totalProducts: products.length,
                imagesReady: ready,
                imagesMissing: missing,
                imagesFailed: failed,
                imagesProcessing: processing,
                duplicateImages: duplicateCount
            }
        });
    } catch (err) {
        console.error('[ImageAPI] Error in health check:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/images/product/:productId
 * Fetches the product, resolves the imageKey, and serves the image from CDN storage.
 * Supports imageVersion for caching.
 * If not found, returns a deterministic category fallback SVG.
 */
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const v = req.query.v || '1'; // imageVersion

        const product = await Product.findById(productId).lean();

        if (!product) {
            return serveFallback(res, 'unknown');
        }

        // If product has imageKey, try to locate it on disk
        if (product.imageKey) {
            const matchedFile = findImageFile(product.imageKey);
            
            if (matchedFile) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                res.setHeader('ETag', `"${v}"`);
                return res.sendFile(matchedFile);
            }
        }

        // If no file found, serve deterministic category fallback
        return serveFallback(res, product.category || product.marketplaceType || 'unknown');

    } catch (error) {
        console.error('[ImageAPI] Error serving product image:', error);
        return serveFallback(res, 'error');
    }
});

/**
 * GET /api/images/product/key/:key
 * Direct key lookup (supports subpaths like /products/fresh/tomato-1kg).
 */
router.get(/^\/product\/key\/(.+)$/, async (req, res) => {
    try {
        const key = req.params[0];
        const v = req.query.v || '1';

        const matchedFile = findImageFile(key);
        if (matchedFile) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('ETag', `"${v}"`);
            return res.sendFile(matchedFile);
        }

        return serveFallback(res, 'unknown');
    } catch (error) {
        console.error('[ImageAPI] Error serving image by key:', error);
        return serveFallback(res, 'error');
    }
});

/**
 * Helper to serve category-based SVGs from backend directly.
 */
function serveFallback(res, category) {
    const cat = (category || '').toLowerCase();
    
    // Set short cache for fallbacks in case a real image is uploaded soon
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'image/svg+xml');

    let svgData = '';

    if (cat.includes('milk') || cat.includes('dairy')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#eff6ff"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#3b82f6">Milk &amp; Dairy</text></svg>';
    } else if (cat.includes('grocery') || cat.includes('rice') || cat.includes('dal') || cat.includes('grain')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#fef3c7"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#d97706">Grocery</text></svg>';
    } else if (cat.includes('snack') || cat.includes('chocolate') || cat.includes('ice cream') || cat.includes('sweet')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#fce7f3"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#db2777">Snacks</text></svg>';
    } else if (cat.includes('drink') || cat.includes('beverage') || cat.includes('juice')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#e0f2fe"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#0284c7">Drinks</text></svg>';
    } else if (cat.includes('fresh') || cat.includes('veg') || cat.includes('fruit') || cat.includes('farmer')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#dcfce7"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#16a34a">Fresh Produce</text></svg>';
    } else if (cat.includes('electronic') || cat.includes('mobile') || cat.includes('phone') || cat.includes('laptop') || cat.includes('headphone')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3e8ff"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#9333ea">Electronics</text></svg>';
    } else if (cat.includes('fashion') || cat.includes('cloth') || cat.includes('men') || cat.includes('women') || cat.includes('kid') || cat.includes('shirt')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#ffedd5"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#ea580c">Fashion</text></svg>';
    } else if (cat.includes('beauty') || cat.includes('care') || cat.includes('soap') || cat.includes('shampoo')) {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#ffe4e6"/><text x="200" y="200" font-family="sans-serif" font-size="44" font-weight="600" text-anchor="middle" fill="#e11d48">Personal Care</text></svg>';
    } else {
        svgData = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="200" y="200" font-family="sans-serif" font-size="36" font-weight="500" text-anchor="middle" fill="#6b7280">GreenBond</text></svg>';
    }

    res.send(svgData);
}

export default router;
