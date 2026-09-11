import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const toNumber = (value) => Number(value);

const serializeCart = (cart) => ({
    id: cart._id,
    items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        title: item.name, // legacy UI alias
        unitPrice: item.unitPrice,
        price: item.unitPrice, // legacy UI alias
        quantity: item.quantity,
        subtotal: item.subtotal,
        farmer: item.farmer,
        farmerId: item.farmerId,
        sellerId: item.sellerId,
        sellerType: item.sellerType,
        marketplaceType: item.marketplaceType,
        image: item.image,
        unit: item.unit
    })),
    totalAmount: cart.totalAmount,
    deliveryFee: cart.deliveryFee,
    grandTotal: cart.grandTotal
});

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });
    return cart;
};

const getActiveProduct = async (productId) => {
    if (!mongoose.isValidObjectId(productId)) return null;
    return Product.findOne({ _id: productId, isActive: { $ne: false } });
};

router.get('/', verifyToken, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        if (cart.isNew) await cart.save();
        return res.status(200).json({ success: true, cart: serializeCart(cart) });
    } catch (error) {
        console.error('Fetch cart error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching cart' });
    }
});

router.post('/add', verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const quantity = toNumber(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number.' });
        }

        const product = await getActiveProduct(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product is unavailable.' });

        const cart = await getOrCreateCart(req.user.id);
        const item = cart.items.find((entry) => entry.productId.toString() === product._id.toString());
        const nextQuantity = (item?.quantity || 0) + quantity;
        if (nextQuantity > product.stock) {
            return res.status(409).json({ success: false, message: `Only ${product.stock} unit(s) are available.`, availableStock: product.stock });
        }

        if (item) {
            item.quantity = nextQuantity;
            item.name = product.name;
            item.unitPrice = product.price;
            item.price = product.price;
            item.title = product.name;
            item.image = product.imageUrl || product.image || product.thumbnailUrl;
        } else {
            cart.items.push({
                productId: product._id,
                name: product.name,
                title: product.name,
                unitPrice: product.price,
                price: product.price,
                farmer: product.farmer,
                farmerId: product.farmerId,
                sellerId: product.sellerId,
                sellerType: product.sellerType,
                marketplaceType: product.marketplaceType,
                image: product.imageUrl || product.image || product.thumbnailUrl,
                quantity,
                unit: product.unit,
                subtotal: product.price * quantity
            });
        }

        await cart.save();
        return res.status(200).json({ success: true, cart: serializeCart(cart) });
    } catch (error) {
        console.error('Add to cart error:', error);
        return res.status(500).json({ success: false, message: 'Server error adding to cart' });
    }
});

router.put('/items/:productId', verifyToken, async (req, res) => {
    try {
        const quantity = toNumber(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be a non-negative whole number.' });
        }

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        const itemIndex = cart.items.findIndex((item) => item.productId.toString() === req.params.productId);
        if (itemIndex < 0) return res.status(404).json({ success: false, message: 'Item not found in cart' });

        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            const product = await getActiveProduct(req.params.productId);
            if (!product) return res.status(404).json({ success: false, message: 'Product is unavailable.' });
            if (quantity > product.stock) {
                return res.status(409).json({ success: false, message: `Only ${product.stock} unit(s) are available.`, availableStock: product.stock });
            }
            const item = cart.items[itemIndex];
            item.quantity = quantity;
            item.name = product.name;
            item.unitPrice = product.price;
            item.price = product.price;
            item.title = product.name;
            item.image = product.imageUrl || product.image || product.thumbnailUrl;
        }

        await cart.save();
        return res.status(200).json({ success: true, cart: serializeCart(cart) });
    } catch (error) {
        console.error('Update cart error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating cart' });
    }
});

router.delete('/items/:productId', verifyToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        const before = cart.items.length;
        cart.items = cart.items.filter((item) => item.productId.toString() !== req.params.productId);
        if (cart.items.length === before) return res.status(404).json({ success: false, message: 'Item not found in cart' });
        await cart.save();
        return res.status(200).json({ success: true, cart: serializeCart(cart) });
    } catch (error) {
        console.error('Remove cart item error:', error);
        return res.status(500).json({ success: false, message: 'Server error removing cart item' });
    }
});

export default router;
