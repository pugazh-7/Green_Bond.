import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Farmer from '../models/Farmer.js';
import { verifyToken, isFarmer, isApprovedFarmer } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure private folder for land documents (never served publicly)
export const SECURE_DOCS_PATH = path.join(__dirname, '../storage/secure_documents/land_proofs');
if (!fs.existsSync(SECURE_DOCS_PATH)) {
    fs.mkdirSync(SECURE_DOCS_PATH, { recursive: true });
}

// Multer storage for secure documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SECURE_DOCS_PATH);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeId = req.user?.id || 'pending';
        cb(null, `farmer-${safeId}-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.'));
    }
};

export const secureDocUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});

const router = express.Router();

/**
 * GET /api/farmers/me/status
 * Returns current authenticated farmer's profile, verification status, and land details
 */
router.get('/me/status', verifyToken, isFarmer, async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.user.id).select('-pin');
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer account not found' });
        }

        res.status(200).json({
            id: farmer._id,
            name: farmer.name,
            mobile: farmer.mobile,
            email: farmer.email,
            verificationStatus: farmer.verificationStatus,
            farmerStatus: farmer.farmerStatus,
            landOwnerName: farmer.landOwnerName,
            surveyNumber: farmer.surveyNumber,
            landArea: farmer.landArea,
            village: farmer.village,
            taluk: farmer.taluk,
            district: farmer.district,
            state: farmer.state,
            pincode: farmer.pincode,
            landDocumentType: farmer.landDocumentType,
            landDocumentNumber: farmer.landDocumentNumber,
            landDocumentUploadedAt: farmer.landDocumentUploadedAt,
            landDocumentOriginalName: farmer.landDocumentOriginalName,
            landDocumentRejectionReason: farmer.landDocumentRejectionReason,
            hasLandDocument: Boolean(farmer.landDocumentReference)
        });
    } catch (error) {
        console.error('Error fetching farmer status:', error);
        res.status(500).json({ message: 'Server error fetching farmer status', error: error.message });
    }
});

/**
 * GET /api/farmers/me/document
 * Securely streams the farmer's own land proof document
 */
router.get('/me/document', verifyToken, isFarmer, async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.user.id);
        if (!farmer || !farmer.landDocumentReference) {
            return res.status(404).json({ message: 'No land proof document uploaded' });
        }

        const filePath = path.join(SECURE_DOCS_PATH, farmer.landDocumentReference);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Document file not found on server' });
        }

        const mimeType = farmer.landDocumentMimeType || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${farmer.landDocumentOriginalName || 'land-proof'}"`);

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        console.error('Error streaming farmer document:', error);
        res.status(500).json({ message: 'Server error streaming document', error: error.message });
    }
});

/**
 * POST /api/farmers/reupload-proof
 * Re-upload land proof document after rejection
 */
router.post('/reupload-proof', verifyToken, isFarmer, (req, res) => {
    secureDocUpload.single('landProof')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'File upload error' });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Please select a land document to upload.' });
            }

            const farmer = await Farmer.findById(req.user.id);
            if (!farmer) {
                return res.status(404).json({ message: 'Farmer account not found' });
            }

            // Remove old file if it exists
            if (farmer.landDocumentReference) {
                const oldFilePath = path.join(SECURE_DOCS_PATH, farmer.landDocumentReference);
                if (fs.existsSync(oldFilePath)) {
                    try { fs.unlinkSync(oldFilePath); } catch (e) { console.warn('Could not delete old file:', e.message); }
                }
            }

            const { landDocumentType, landDocumentNumber } = req.body;

            farmer.landDocumentReference = req.file.filename;
            farmer.landDocumentOriginalName = req.file.originalname;
            farmer.landDocumentMimeType = req.file.mimetype;
            farmer.landDocumentUploadedAt = new Date();
            if (landDocumentType) farmer.landDocumentType = landDocumentType;
            if (landDocumentNumber) farmer.landDocumentNumber = landDocumentNumber.trim();
            farmer.verificationStatus = 'PENDING';
            farmer.farmerStatus = 'PENDING';
            farmer.landDocumentRejectionReason = '';

            await farmer.save();

            res.status(200).json({
                message: 'Land document re-uploaded successfully. Your application is now under review.',
                verificationStatus: farmer.verificationStatus,
                landDocumentOriginalName: farmer.landDocumentOriginalName,
                landDocumentUploadedAt: farmer.landDocumentUploadedAt
            });
        } catch (dbErr) {
            console.error('Error saving re-uploaded document:', dbErr);
            res.status(500).json({ message: 'Server error updating land document', error: dbErr.message });
        }
    });
});

/**
 * GET /api/farmers/dashboard-data
 * Strictly protected endpoint: accessible ONLY if farmer is approved/active
 */
router.get('/dashboard-data', verifyToken, isFarmer, isApprovedFarmer, async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the Farmer Dashboard',
        farmerId: req.user.id
    });
});

export default router;
