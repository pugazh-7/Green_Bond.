import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Shop from '../models/Shop.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

/**
 * GreenBond Real Database-Backed Token Verification Middleware
 * Authenticates ONLY if the referenced user exists and is active in MongoDB.
 * Never allows ghost sessions or unverified tokens.
 */
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authorization required. Missing or invalid token.',
                code: 'TOKEN_MISSING'
            });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, getJwtSecret());
        } catch (jwtErr) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token.', 
                code: 'TOKEN_INVALID' 
            });
        }

        const { id, role } = decoded || {};
        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token payload.', 
                code: 'TOKEN_PAYLOAD_INVALID' 
            });
        }

        // Verify existence directly in MongoDB based on role
        let dbUser = null;
        let canonicalRole = null;

        if (role === 'user' || role === 'customer' || role === 'admin') {
            dbUser = await User.findById(id);
            if (dbUser) {
                canonicalRole = dbUser.role === 'customer' ? 'user' : dbUser.role;
            }
        } else if (role === 'client' || role === 'farmer') {
            dbUser = await Farmer.findById(id);
            if (dbUser) {
                canonicalRole = 'client';
            }
        } else if (role === 'delivery') {
            dbUser = await DeliveryPartner.findById(id);
            if (dbUser) {
                canonicalRole = 'delivery';
            }
        } else if (role === 'shop') {
            dbUser = await Shop.findById(id);
            if (dbUser) {
                canonicalRole = 'shop';
            }
        }

        // Fallback check across all collections in case of role mismatch/legacy token
        if (!dbUser) {
            dbUser = await User.findById(id);
            if (dbUser) {
                canonicalRole = dbUser.role === 'customer' ? 'user' : dbUser.role;
            } else {
                dbUser = await Farmer.findById(id);
                if (dbUser) canonicalRole = 'client';
                else {
                    dbUser = await DeliveryPartner.findById(id);
                    if (dbUser) canonicalRole = 'delivery';
                    else {
                        dbUser = await Shop.findById(id);
                        if (dbUser) canonicalRole = 'shop';
                    }
                }
            }
        }

        // If user record no longer exists in MongoDB -> Reject with 401
        if (!dbUser) {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verify account is active
        if (dbUser.isActive === false) {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.',
                code: 'USER_INACTIVE'
            });
        }

        // Verify token was not issued before or during user's latest logout (Rule 22 & 23)
        if (dbUser.lastLogoutAt && decoded.iat) {
            const logoutTimestamp = Math.floor(new Date(dbUser.lastLogoutAt).getTime() / 1000);
            if (decoded.iat <= logoutTimestamp) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Your session has ended. Please sign in again.',
                    code: 'SESSION_EXPIRED'
                });
            }
        }

        // Set verified user on request object
        req.user = {
            id: dbUser._id.toString(),
            role: canonicalRole,
            email: dbUser.email || null,
            name: dbUser.name,
            mobile: dbUser.mobile || null
        };
        req.dbUser = dbUser;

        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.',
            code: 'AUTH_VERIFICATION_FAILED'
        });
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

export const isApprovedFarmer = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'client' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied. Farmer privileges required.' });
    }
    if (req.user.role === 'client') {
        const farmer = await Farmer.findById(req.user.id);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer account not found.' });
        }
        const approvedStatuses = ['APPROVED', 'LAND_VERIFIED'];
        if (!approvedStatuses.includes(farmer.verificationStatus) && farmer.farmerStatus !== 'ACTIVE') {
            return res.status(403).json({ 
                success: false,
                code: 'FARMER_NOT_APPROVED',
                message: 'Access denied. Farmer land verification is pending or rejected.',
                verificationStatus: farmer.verificationStatus,
                rejectionReason: farmer.landDocumentRejectionReason || null
            });
        }
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
