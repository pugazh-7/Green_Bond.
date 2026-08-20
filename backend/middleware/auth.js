import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization required. Missing or invalid token.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded; // { id, role }
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export const isAdmin = async (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    next();
};

export const isFarmer = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'client' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied. Farmer privileges required.' });
    }
    next();
};

export const isDelivery = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'delivery' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied. Delivery privileges required.' });
    }
    next();
};

export const isCustomer = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'customer' && req.user.role !== 'user' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied. Customer privileges required.' });
    }
    next();
};

export const isShop = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'shop' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied. Shop Owner privileges required.' });
    }
    next();
};
