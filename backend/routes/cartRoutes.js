import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user's cart
router.get('/', verifyToken, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user.id, items: [] });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error("Fetch cart error:", error);
        res.status(500).json({ message: "Server error fetching cart" });
    }
});

// Add item to cart
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.availableQuantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: product._id,
                title: product.title,
                price: parseFloat(product.price),
                farmer: product.farmer || 'GreenBond Hub',
                farmerId: product.farmerId,
                sellerId: product.sellerId,
                sellerType: product.sellerType,
                marketplaceType: product.marketplaceType,
                image: product.image,
                quantity: quantity,
                unit: product.unit
            });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ message: "Server error adding to cart" });
    }
});

// Update item quantity
router.put('/update/:productId', verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;

        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }
            await cart.save();
            return res.status(200).json(cart);
        } else {
            return res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.error("Update cart error:", error);
        res.status(500).json({ message: "Server error updating cart" });
    }
});

// Remove item from cart
router.delete('/remove/:productId', verifyToken, async (req, res) => {
    try {
        const productId = req.params.productId;
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ message: "Server error removing from cart" });
    }
});

export default router;
