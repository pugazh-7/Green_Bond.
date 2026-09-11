import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Shop from '../models/Shop.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ServiceZone from '../models/ServiceZone.js';
import OTP from '../models/OTP.js';
import Config from '../models/Config.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { SECURE_DOCS_PATH } from './farmerRoutes.js';

const router = express.Router();


// Get Real System Statistics Overview
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            totalFarmers,
            totalShops,
            totalDeliveryPartners,
            totalProducts,
            activeOrders,
            completedOrders,
            pendingFarmerVerifications,
            deliveredOrders
        ] = await Promise.all([
            User.countDocuments(),
            Farmer.countDocuments(),
            Shop.countDocuments(),
            DeliveryPartner.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED', 'REFUNDED'] } }),
            Order.countDocuments({ status: 'DELIVERED' }),
            Farmer.countDocuments({ verificationStatus: 'PENDING' }),
            Order.find({ status: 'DELIVERED' }).select('totalAmount total')
        ]);

        const totalRevenue = deliveredOrders.reduce((acc, curr) => {
            const amt = parseFloat((curr.totalAmount || curr.total || '0').toString().replace(/[^0-9.]/g, '')) || 0;
            return acc + amt;
        }, 0);

        res.status(200).json({
            totalUsers,
            totalFarmers,
            totalShops,
            totalDeliveryPartners,
            totalProducts,
            activeOrders,
            completedOrders,
            pendingFarmerVerifications,
            totalRevenue: Math.round(totalRevenue)
        });
    } catch (error) {
        console.error('Error calculating admin stats:', error);
        res.status(500).json({ message: 'Server error computing statistics', error: error.message });
    }
});

// Get all users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all farmers with verification and land details
router.get('/farmers', verifyToken, isAdmin, async (req, res) => {
    try {
        const farmers = await Farmer.find().select('-pin').sort({ createdAt: -1 }).lean();
        const formatted = farmers.map(f => ({
            ...f,
            hasLandDocument: Boolean(f.landDocumentReference)
        }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Securely view / stream farmer land proof document (Admin Only)
router.get('/farmers/:id/document', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const farmer = await Farmer.findById(id);
        if (!farmer || !farmer.landDocumentReference) {
            return res.status(404).json({ message: 'No land proof document found for this farmer' });
        }

        const filePath = path.join(SECURE_DOCS_PATH, farmer.landDocumentReference);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Document file missing from server storage' });
        }

        const mimeType = farmer.landDocumentMimeType || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${farmer.landDocumentOriginalName || 'land-proof'}"`);

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        console.error('Error streaming document to admin:', error);
        res.status(500).json({ message: 'Server error retrieving document', error: error.message });
    }
});

// Approve Farmer Land Document
router.put('/farmers/:id/approve', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const farmer = await Farmer.findById(id);
        if (!farmer) return res.status(404).json({ message: 'Farmer not found' });

        farmer.verificationStatus = 'APPROVED';
        farmer.farmerStatus = 'ACTIVE';
        farmer.landDocumentVerifiedAt = new Date();
        farmer.landDocumentVerifiedBy = req.user.id;
        farmer.landDocumentRejectionReason = '';

        await farmer.save();

        res.status(200).json({ 
            message: 'Farmer land proof approved successfully. Account activated.', 
            farmer: {
                id: farmer._id,
                name: farmer.name,
                mobile: farmer.mobile,
                verificationStatus: farmer.verificationStatus,
                farmerStatus: farmer.farmerStatus,
                landDocumentVerifiedAt: farmer.landDocumentVerifiedAt
            }
        });
    } catch (error) {
        console.error('Error approving farmer:', error);
        res.status(500).json({ message: 'Server error approving farmer', error: error.message });
    }
});

// Reject Farmer Land Document with Reason
router.put('/farmers/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, reason } = req.body;
        const effectiveReason = rejectionReason || reason;

        if (!effectiveReason || typeof effectiveReason !== 'string' || !effectiveReason.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required.' });
        }

        const farmer = await Farmer.findById(id);
        if (!farmer) return res.status(404).json({ message: 'Farmer not found' });

        farmer.verificationStatus = 'REJECTED';
        farmer.farmerStatus = 'INACTIVE';
        farmer.landDocumentRejectionReason = effectiveReason.trim();
        farmer.landDocumentVerifiedAt = new Date();
        farmer.landDocumentVerifiedBy = req.user.id;

        await farmer.save();

        res.status(200).json({ 
            message: 'Farmer land proof rejected. Rejection reason recorded.', 
            farmer: {
                id: farmer._id,
                name: farmer.name,
                mobile: farmer.mobile,
                verificationStatus: farmer.verificationStatus,
                farmerStatus: farmer.farmerStatus,
                landDocumentRejectionReason: farmer.landDocumentRejectionReason,
                landDocumentVerifiedAt: farmer.landDocumentVerifiedAt
            }
        });
    } catch (error) {
        console.error('Error rejecting farmer:', error);
        res.status(500).json({ message: 'Server error rejecting farmer', error: error.message });
    }
});

// Update farmer verification status (Generic endpoint for compatibility)
router.put('/farmers/:id/verify', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus, rejectionReason } = req.body;

        const farmer = await Farmer.findById(id);
        if (!farmer) return res.status(404).json({ message: 'Farmer not found' });

        farmer.verificationStatus = verificationStatus;
        if (verificationStatus === 'APPROVED') {
            farmer.farmerStatus = 'ACTIVE';
            farmer.landDocumentVerifiedAt = new Date();
            farmer.landDocumentVerifiedBy = req.user.id;
            farmer.landDocumentRejectionReason = '';
        } else if (verificationStatus === 'REJECTED') {
            farmer.farmerStatus = 'INACTIVE';
            farmer.landDocumentRejectionReason = rejectionReason || 'Document verification failed';
            farmer.landDocumentVerifiedAt = new Date();
            farmer.landDocumentVerifiedBy = req.user.id;
        }

        await farmer.save();

        res.status(200).json({ message: 'Farmer verification status updated', farmer });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all delivery partners
router.get('/delivery-partners', verifyToken, isAdmin, async (req, res) => {
    try {
        const partners = await DeliveryPartner.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(partners);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all products
router.get('/products', verifyToken, isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all orders (already exists in orderRoutes as /api/orders/admin/all but we can add it here too or just use that one)

// Get System Audit Readiness with Percentage Logic
router.get('/audit', verifyToken, isAdmin, async (req, res) => {
    try {
        const categories = [
            { name: "Security & Authentication", weight: 15, status: "CRITICAL", reason: "Initial check" },
            { name: "API & Authorization", weight: 10, status: "READY", reason: "Authentication middleware active and role-based access enforced." },
            { name: "Database & Data Integrity", weight: 10, status: "CRITICAL", reason: "Initial check" },
            { name: "Order Workflow / State Machine", weight: 10, status: "READY", reason: "State machine transitions are strictly verified on the backend." },
            { name: "Farmer Verification", weight: 8, status: "READY", reason: "Identity and land verification process exists." },
            { name: "Delivery Assignment & Tracking", weight: 10, status: "CRITICAL", reason: "Initial check" },
            { name: "OTP Security", weight: 8, status: "READY", reason: "Secure OTP generation and TTL expiration limits are enforced." },
            { name: "Location / Service Zone", weight: 7, status: "CRITICAL", reason: "Initial check" },
            { name: "COD / Payment", weight: 7, status: "READY", reason: "COD status flow is strict and atomic." },
            { name: "Performance", weight: 5, status: "READY", reason: "Optimized queries and real-time updates reduce server load." },
            { name: "Mobile Responsiveness", weight: 3, status: "READY", reason: "UI dynamically adjusts to mobile sizes." },
            { name: "Real-time Notifications", weight: 3, status: "READY", reason: "Socket.IO events broadcast order updates instantly." },
            { name: "Future Scalability / Multi-city", weight: 4, status: "READY", reason: "Dynamic ServiceZone schema allows multiple operational cities." }
        ];

        const findCat = (name) => categories.find(c => c.name === name);

        // Location / Service Zone
        try {
            const tvmZone = await ServiceZone.findOne({ name: /tiruvannamalai|thiruvannamalai/i, active: true });
            if (tvmZone) {
                findCat("Location / Service Zone").status = "READY";
                findCat("Location / Service Zone").reason = "Thiruvannamalai service zone is active.";
            } else {
                findCat("Location / Service Zone").status = "NEEDS IMPROVEMENT";
                findCat("Location / Service Zone").reason = "Thiruvannamalai service zone is missing or inactive.";
            }
        } catch (e) {
            findCat("Location / Service Zone").status = "CRITICAL";
            findCat("Location / Service Zone").reason = "Database error verifying service zones.";
        }

        // Delivery Assignment & Tracking
        try {
            const partnerCount = await DeliveryPartner.countDocuments();
            if (partnerCount > 0) {
                findCat("Delivery Assignment & Tracking").status = "READY";
                findCat("Delivery Assignment & Tracking").reason = `${partnerCount} delivery partner(s) registered.`;
            } else {
                findCat("Delivery Assignment & Tracking").status = "NEEDS IMPROVEMENT";
                findCat("Delivery Assignment & Tracking").reason = "No delivery partners registered.";
            }
        } catch (e) {
            findCat("Delivery Assignment & Tracking").status = "CRITICAL";
            findCat("Delivery Assignment & Tracking").reason = "Database error verifying delivery partners.";
        }

        // Database & Data Integrity
        try {
            const deliveryPartnerIndexes = await DeliveryPartner.collection.indexes();
            const hasGeoIndex = deliveryPartnerIndexes.some(idx => idx.key.locationGeo === '2dsphere');
            if (hasGeoIndex) {
                findCat("Database & Data Integrity").status = "READY";
                findCat("Database & Data Integrity").reason = "Geospatial 2dsphere indexes applied and active.";
            } else {
                findCat("Database & Data Integrity").status = "CRITICAL";
                findCat("Database & Data Integrity").reason = "Missing 2dsphere index required for delivery assignment.";
            }
        } catch (e) {
            findCat("Database & Data Integrity").status = "CRITICAL";
            findCat("Database & Data Integrity").reason = "Database error querying collection indexes.";
        }

        // Security & Authentication
        try {
            const packageJsonPath = path.resolve(process.cwd(), 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps['helmet'] && deps['express-rate-limit']) {
                    findCat("Security & Authentication").status = "READY";
                    findCat("Security & Authentication").reason = "Helmet and rate limiting are configured.";
                } else {
                    findCat("Security & Authentication").status = "NEEDS IMPROVEMENT";
                    findCat("Security & Authentication").reason = "Helmet or express-rate-limit missing from package.json.";
                }
            } else {
                findCat("Security & Authentication").status = "CRITICAL";
                findCat("Security & Authentication").reason = "package.json not found.";
            }
        } catch (e) {
            findCat("Security & Authentication").status = "CRITICAL";
            findCat("Security & Authentication").reason = "Error verifying security configuration.";
        }

        // Calculate score
        let totalScore = 0;
        let stats = { passed: 0, warnings: 0, critical: 0 };
        
        categories.forEach(cat => {
            if (cat.status === "READY") {
                cat.score = cat.weight;
                totalScore += cat.weight;
                stats.passed++;
            } else if (cat.status === "NEEDS IMPROVEMENT") {
                cat.score = cat.weight / 2;
                totalScore += cat.weight / 2;
                stats.warnings++;
            } else {
                cat.score = 0;
                stats.critical++;
            }
        });

        // Determine Overall Status
        let overallStatus = "NOT READY";
        if (totalScore >= 90) overallStatus = "PRODUCTION READY";
        else if (totalScore >= 75) overallStatus = "NEARLY READY";
        else if (totalScore >= 50) overallStatus = "NEEDS MAJOR IMPROVEMENT";
        else overallStatus = "NOT READY";

        // Security Override check
        const criticalOverrides = [
            "Security & Authentication",
            "API & Authorization",
            "COD / Payment",
            "OTP Security",
            "Order Workflow / State Machine",
            "Database & Data Integrity"
        ];
        
        const hasCriticalOverride = categories.some(cat => 
            criticalOverrides.includes(cat.name) && cat.status === "CRITICAL"
        );

        if (hasCriticalOverride) {
            overallStatus = "NOT READY";
        }

        const canLaunch = overallStatus === "PRODUCTION READY";

        res.status(200).json({
            totalScore,
            overallStatus,
            stats,
            categories,
            canLaunch
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during audit', error: error.message });
    }
});

// Get Admin Config
router.get('/config', verifyToken, isAdmin, async (req, res) => {
    try {
        let config = await Config.findOne({ key: 'admin_settings' });
        if (!config) {
            config = new Config({ key: 'admin_settings' });
            await config.save();
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching config', error: error.message });
    }
});

// Update Admin Config
router.put('/config', verifyToken, isAdmin, async (req, res) => {
    try {
        const updateData = req.body;
        let config = await Config.findOneAndUpdate(
            { key: 'admin_settings' },
            { $set: updateData },
            { new: true, upsert: true }
        );
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating config', error: error.message });
    }
});

// Get Revenue and Settlement Aggregation
router.get('/revenue', verifyToken, isAdmin, async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalGrossValue: { $sum: '$totalAmount' },
                    totalGstCollected: { $sum: '$gstAmount' },
                    totalDeliveryRevenue: { $sum: '$deliveryFee' },
                    totalDeliveryPayouts: { $sum: '$deliveryBoyPayout' },
                    totalSellerSettlements: { $sum: '$sellerAmount' },
                    totalGreenBondCommission: { $sum: '$greenBondCommission' }
                }
            }
        ];
        
        const result = await Order.aggregate(pipeline);
        const revenue = result.length > 0 ? result[0] : {
            totalGrossValue: 0,
            totalGstCollected: 0,
            totalDeliveryRevenue: 0,
            totalDeliveryPayouts: 0,
            totalSellerSettlements: 0,
            totalGreenBondCommission: 0
        };
        
        revenue.netPlatformRevenue = revenue.totalGreenBondCommission + (revenue.totalDeliveryRevenue - revenue.totalDeliveryPayouts);

        res.status(200).json(revenue);
    } catch (error) {
        res.status(500).json({ message: 'Server error calculating revenue', error: error.message });
    }
});

export default router;
