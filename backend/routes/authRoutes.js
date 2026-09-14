import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const router = express.Router();

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Shop from '../models/Shop.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { isWithinServiceArea } from '../utils/locationUtils.js';
import { secureDocUpload } from './farmerRoutes.js';

const generateTokens = (payload) => {
    const secret = getJwtSecret();
    const accessToken = jwt.sign(payload, secret, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/'
    };
};

const setRefreshCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        ...getCookieOptions(),
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

const clearRefreshCookie = (res) => {
    const opts = getCookieOptions();
    res.clearCookie('refreshToken', { ...opts, expires: new Date(0), maxAge: 0 });
    res.cookie('refreshToken', '', { ...opts, expires: new Date(0), maxAge: 0 });
};

// Register User
router.post('/register-user', async (req, res) => {
    try {
        const { name, email, mobile, phone, password, confirmPassword, location } = req.body || {};

        // 1. Name validation
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return res.status(400).json({ message: 'Name must be at least 3 characters long.' });
        }

        // 2. Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        // 3. Password validation
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        // 4. Optional Phone/Mobile validation
        const rawPhone = (mobile || phone || '').toString().trim();
        let validMobile = undefined;
        if (rawPhone) {
            if (!/^[0-9]{10}$/.test(rawPhone)) {
                return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
            }
            validMobile = rawPhone;
        }

        const cleanEmail = email.trim().toLowerCase();

        // 5. Pre-check existing email
        const existingEmailUser = await User.findOne({ email: cleanEmail });
        if (existingEmailUser) {
            return res.status(400).json({ message: 'This email is already registered. Please login.' });
        }

        if (validMobile) {
            const existingMobileUser = await User.findOne({ mobile: validMobile });
            if (existingMobileUser) {
                return res.status(400).json({ message: 'Mobile number is already registered.' });
            }
        }

        // 6. Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 7. Optional Location handling (no fake coordinates)
        let userLocation = undefined;
        let userLocationGeo = undefined;
        if (location && typeof location === 'object' && !isNaN(Number(location.lat)) && !isNaN(Number(location.lng))) {
            const lat = Number(location.lat);
            const lng = Number(location.lng);
            userLocation = {
                lat,
                lng,
                address: location.address || ''
            };
            userLocationGeo = {
                type: 'Point',
                coordinates: [lng, lat]
            };
        }

        const newUser = new User({ 
            name: name.trim(), 
            email: cleanEmail, 
            mobile: validMobile, 
            password: hashedPassword, 
            location: userLocation,
            locationGeo: userLocationGeo,
            role: 'user'
        });
        await newUser.save();

        const hasValidLoc = newUser.location && !isNaN(Number(newUser.location.lat)) && !isNaN(Number(newUser.location.lng));
        const userData = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile || null,
            role: 'user',
            location: hasValidLoc ? newUser.location : null
        };

        const { accessToken, refreshToken } = generateTokens({ id: newUser._id, role: 'user' });
        setRefreshCookie(res, refreshToken);
        await User.updateOne({ _id: newUser._id }, { $set: { lastLogoutAt: null } });

        return res.status(201).json({ 
            success: true, 
            message: 'Account created successfully.', 
            user: userData,
            token: accessToken
        });
    } catch (error) {
        console.error("User registration error:", error);
        if (error.code === 11000) {
            const keyPattern = error.keyPattern || {};
            if (keyPattern.email) {
                return res.status(400).json({ message: 'This email is already registered. Please login.' });
            }
            if (keyPattern.mobile) {
                return res.status(400).json({ message: 'Mobile number is already registered.' });
            }
            return res.status(400).json({ message: 'Email or Mobile already registered.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unable to create your account. Please try again.',
            code: 'REGISTRATION_FAILED' 
        });
    }
});

// Register Farmer with Secure Land Proof Upload
router.post('/register-farmer', (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        return secureDocUpload.single('landProof')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: err.message || 'File upload error' });
            }
            next();
        });
    }
    next();
}, async (req, res) => {
    try {
        const { 
            name, mobile, email, pin, password,
            landOwnerName, surveyNumber, landArea, 
            village, taluk, district, state, pincode,
            landDocumentType, landDocumentNumber,
            address, location
        } = req.body || {};

        const effectivePin = pin || password;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ message: 'Please provide a valid name' });
        }
        if (!mobile || !/^[0-9]{10}$/.test(String(mobile).trim())) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
        }
        if (!effectivePin || String(effectivePin).trim().length < 4) {
            return res.status(400).json({ message: 'Password/PIN must be at least 4 characters long.' });
        }

        const cleanMobile = String(mobile).trim();
        const existingFarmer = await Farmer.findOne({ mobile: cleanMobile });
        if (existingFarmer) {
            return res.status(400).json({ message: 'Mobile number already registered. Please login.' });
        }

        const cleanEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : '';

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(String(effectivePin).trim(), salt);

        const newFarmer = new Farmer({ 
            name: name.trim(), 
            mobile: cleanMobile, 
            email: cleanEmail,
            pin: hashedPin,
            landOwnerName: landOwnerName ? String(landOwnerName).trim() : name.trim(),
            surveyNumber: surveyNumber ? String(surveyNumber).trim() : '',
            landArea: landArea ? String(landArea).trim() : '',
            village: village ? String(village).trim() : '',
            taluk: taluk ? String(taluk).trim() : '',
            district: district ? String(district).trim() : '',
            state: state ? String(state).trim() : 'Tamil Nadu',
            pincode: pincode ? String(pincode).trim() : '',
            landDocumentType: landDocumentType || 'Patta',
            landDocumentNumber: landDocumentNumber ? String(landDocumentNumber).trim() : '',
            address: address || village || '',
            location: location || village || '',
            landDocumentReference: req.file ? req.file.filename : '',
            landDocumentOriginalName: req.file ? req.file.originalname : '',
            landDocumentMimeType: req.file ? req.file.mimetype : '',
            landDocumentUploadedAt: req.file ? new Date() : null,
            verificationStatus: 'PENDING',
            farmerStatus: 'PENDING'
        });
        await newFarmer.save();

        const { accessToken, refreshToken } = generateTokens({ id: newFarmer._id, role: 'client' });
        setRefreshCookie(res, refreshToken);
        await Farmer.updateOne({ _id: newFarmer._id }, { $set: { lastLogoutAt: null } });

        const farmerData = {
            id: newFarmer._id,
            name: newFarmer.name,
            mobile: newFarmer.mobile,
            email: newFarmer.email,
            verificationStatus: newFarmer.verificationStatus,
            farmerStatus: newFarmer.farmerStatus,
            landOwnerName: newFarmer.landOwnerName,
            surveyNumber: newFarmer.surveyNumber,
            landArea: newFarmer.landArea,
            village: newFarmer.village,
            landDocumentType: newFarmer.landDocumentType,
            hasLandDocument: Boolean(newFarmer.landDocumentReference),
            location: null,
            role: 'client'
        };

        return res.status(201).json({ 
            success: true, 
            message: 'Farmer registered successfully. Your account is under verification.', 
            user: farmerData, 
            farmer: farmerData,
            token: accessToken 
        });
    } catch (error) {
        console.error("Farmer registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unable to create your account. Please try again.',
            code: 'REGISTRATION_FAILED' 
        });
    }
});

// Register Delivery Partner
router.post('/register-delivery', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body || {};

        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return res.status(400).json({ message: 'Name must be at least 3 characters long.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (!mobile || !/^[0-9]{10}$/.test(String(mobile).trim())) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanMobile = String(mobile).trim();

        const existingEmail = await DeliveryPartner.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(400).json({ message: 'This email is already registered. Please login.' });
        }
        const existingMobile = await DeliveryPartner.findOne({ mobile: cleanMobile });
        if (existingMobile) {
            return res.status(400).json({ message: 'Mobile number already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newPartner = new DeliveryPartner({ 
            name: name.trim(), 
            email: cleanEmail, 
            mobile: cleanMobile, 
            password: hashedPassword, 
            role: 'delivery',
            status: 'Offline'
        });
        await newPartner.save();

        const { accessToken, refreshToken } = generateTokens({ id: newPartner._id, role: 'delivery' });
        setRefreshCookie(res, refreshToken);
        await DeliveryPartner.updateOne({ _id: newPartner._id }, { $set: { lastLogoutAt: null } });

        const partnerData = {
            id: newPartner._id,
            name: newPartner.name,
            email: newPartner.email,
            mobile: newPartner.mobile,
            status: newPartner.status,
            role: 'delivery',
            location: null
        };

        return res.status(201).json({ 
            success: true, 
            message: 'Delivery Partner registered successfully', 
            user: partnerData, 
            partner: partnerData,
            token: accessToken 
        });
    } catch (error) {
        console.error("Delivery Partner registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email or Mobile already registered' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unable to create your account. Please try again.',
            code: 'REGISTRATION_FAILED' 
        });
    }
});

// Safe verification helper that never throws on legacy strings or null values
const verifySecret = async (input, storedHashOrPlain) => {
    if (!input || !storedHashOrPlain || typeof input !== 'string') return false;
    try {
        const isMatch = await bcrypt.compare(input, storedHashOrPlain);
        if (isMatch) return true;
    } catch {
        // Not a standard bcrypt hash, fallback to direct comparison
    }
    return String(input).trim() === String(storedHashOrPlain).trim();
};

// Login User
router.post('/login-user', async (req, res) => {
    const loginStart = Date.now();
    try {
        const { email, password } = req.body || {};
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const cleanEmail = email.trim().toLowerCase();
        console.log(`[AUTH_LOGIN_START] Attempting login`);

        const user = await User.findOne({ email: cleanEmail });
        console.log(`[AUTH_USER_LOOKUP_COMPLETE] User exists: ${!!user}`);

        if (!user || !user.password) {
            console.warn(`[AUTH_LOGIN_FAILED] User not found or missing credentials`);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.isActive === false) {
            console.warn(`[AUTH_LOGIN_FAILED] User account disabled/inactive`);
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.',
                code: 'USER_INACTIVE'
            });
        }

        const isMatch = await verifySecret(password, user.password);
        console.log(`[AUTH_PASSWORD_VERIFY_COMPLETE] Password matches: ${isMatch}`);

        if (!isMatch) {
            console.warn(`[AUTH_LOGIN_FAILED] Password mismatch`);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        
        // Auto-upgrade legacy plaintext password if applicable
        if (user.password === password) {
             try {
                 const salt = await bcrypt.genSalt(10);
                 const hashedPassword = await bcrypt.hash(password, salt);
                 await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
             } catch (upgradeErr) {
                 console.warn("User password upgrade notice:", upgradeErr.message);
             }
        }

        const canonicalRole = user.role === 'customer' ? 'user' : user.role;

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: canonicalRole,
            location: user.location || null
        };

        const { accessToken, refreshToken } = generateTokens({ id: user._id, role: canonicalRole });
        setRefreshCookie(res, refreshToken);
        console.log(`[AUTH_TOKEN_CREATED] Tokens created for user`);
        await User.updateOne({ _id: user._id }, { $set: { lastLogoutAt: null } });

        return res.status(200).json({ success: true, message: 'Login successful', user: userData, token: accessToken });
    } catch (error) {
        console.error("User login error:", error);
        console.warn(`[AUTH_LOGIN_FAILED] Server error during login: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.', 
            code: 'AUTH_SERVICE_ERROR' 
        });
    }
});

// Login Admin - Strictly authenticates administrator accounts with role === 'admin'
router.post('/login-admin', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }

        // Strict role validation: Only 'admin' role is allowed
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied: Administrator privileges required.' 
            });
        }

        if (user.isActive === false) {
            return res.status(401).json({ 
                success: false, 
                message: 'Administrator account is deactivated.' 
            });
        }

        const isMatch = await verifySecret(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }

        const adminData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: 'admin'
        };

        const { accessToken, refreshToken } = generateTokens({ id: user._id, role: 'admin' });
        setRefreshCookie(res, refreshToken);
        await User.updateOne({ _id: user._id }, { $set: { lastLogoutAt: null } });

        return res.status(200).json({ 
            success: true, 
            message: 'Admin login successful', 
            user: adminData, 
            token: accessToken 
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.' 
        });
    }
});

// Login Farmer
router.post('/login-farmer', async (req, res) => {
    try {
        const { name, mobile, pin } = req.body || {};
        if (!mobile || !pin) {
            return res.status(400).json({ success: false, message: 'Please provide Mobile Number and PIN' });
        }

        const cleanMobile = String(mobile).trim();
        const query = { mobile: cleanMobile };
        if (name && typeof name === 'string' && name.trim()) {
            query.name = { $regex: new RegExp(`^${name.trim()}$`, 'i') };
        }

        const farmer = await Farmer.findOne(query);
        if (!farmer || !farmer.pin) {
            return res.status(401).json({ success: false, message: 'Invalid Name, Mobile Number or PIN' });
        }
        
        const isMatch = await verifySecret(String(pin), farmer.pin);
        if (!isMatch) {
             return res.status(401).json({ success: false, message: 'Invalid Name, Mobile Number or PIN' });
        }
        
        // Auto-upgrade legacy plaintext pin
        if (farmer.pin === pin) {
             try {
                 const salt = await bcrypt.genSalt(10);
                 const hashedPin = await bcrypt.hash(String(pin), salt);
                 await Farmer.updateOne({ _id: farmer._id }, { $set: { pin: hashedPin } });
             } catch (upgradeErr) {
                 console.warn("Farmer PIN upgrade notice:", upgradeErr.message);
             }
        }

        const { accessToken, refreshToken } = generateTokens({ id: farmer._id, role: 'client' });
        setRefreshCookie(res, refreshToken);

        const farmerData = {
            id: farmer._id,
            name: farmer.name,
            mobile: farmer.mobile,
            email: farmer.email,
            verificationStatus: farmer.verificationStatus,
            farmerStatus: farmer.farmerStatus,
            landDocumentRejectionReason: farmer.landDocumentRejectionReason,
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
            hasLandDocument: Boolean(farmer.landDocumentReference),
            location: farmer.location,
            address: farmer.address,
            role: 'client'
        };

        await Farmer.updateOne({ _id: farmer._id }, { $set: { lastLogoutAt: null } });

        return res.status(200).json({ success: true, message: 'Login successful', user: farmerData, farmer: farmerData, token: accessToken });
    } catch (error) {
        console.error("Farmer login error:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.', 
            code: 'AUTH_SERVICE_ERROR' 
        });
    }
});

// Login Delivery Partner
router.post('/login-delivery', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Please provide Email and Password' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const partner = await DeliveryPartner.findOne({ email: cleanEmail });
        if (!partner || !partner.password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const isMatch = await verifySecret(password, partner.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Auto-upgrade legacy plaintext password
        if (partner.password === password) {
             try {
                 const salt = await bcrypt.genSalt(10);
                 const hashedPassword = await bcrypt.hash(password, salt);
                 await DeliveryPartner.updateOne({ _id: partner._id }, { $set: { password: hashedPassword } });
             } catch (upgradeErr) {
                 console.warn("Delivery partner password upgrade notice:", upgradeErr.message);
             }
        }

        const { accessToken, refreshToken } = generateTokens({ id: partner._id, role: 'delivery' });
        setRefreshCookie(res, refreshToken);

        const partnerData = {
            id: partner._id,
            name: partner.name,
            email: partner.email,
            mobile: partner.mobile,
            status: partner.status,
            role: partner.role,
            location: partner.location || null
        };

        await DeliveryPartner.updateOne({ _id: partner._id }, { $set: { lastLogoutAt: null } });

        return res.status(200).json({ success: true, message: 'Login successful', user: partnerData, partner: partnerData, token: accessToken });
    } catch (error) {
        console.error("Delivery login error:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.', 
            code: 'AUTH_SERVICE_ERROR' 
        });
    }
});

// Register Shop
router.post('/register-shop', async (req, res) => {
    try {
        const { name, ownerName, email, mobile, password, confirmPassword } = req.body || {};
        
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Shop name must be at least 3 characters long.' });
        }
        if (!ownerName || typeof ownerName !== 'string' || ownerName.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Owner name must be at least 2 characters long.' });
        }
        if (!mobile || !/^[0-9]{10}$/.test(String(mobile).trim())) {
            return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(String(email).trim())) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        const cleanMobile = String(mobile).trim();
        const cleanEmail = email ? email.trim().toLowerCase() : undefined;

        const existingMobile = await Shop.findOne({ mobile: cleanMobile });
        if (existingMobile) {
            return res.status(400).json({ success: false, message: 'Mobile number already registered. Please login.' });
        }
        if (cleanEmail) {
            const existingEmail = await Shop.findOne({ email: cleanEmail });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newShop = new Shop({ 
            name: name.trim(), 
            ownerName: ownerName.trim(), 
            email: cleanEmail, 
            mobile: cleanMobile, 
            password: hashedPassword, 
            role: 'shop',
            isActive: true
        });
        await newShop.save();

        const { accessToken, refreshToken } = generateTokens({ id: newShop._id, role: 'shop' });
        setRefreshCookie(res, refreshToken);
        await Shop.updateOne({ _id: newShop._id }, { $set: { lastLogoutAt: null } });

        const shopData = {
            id: newShop._id,
            name: newShop.name,
            ownerName: newShop.ownerName,
            email: newShop.email,
            mobile: newShop.mobile,
            role: 'shop',
            isActive: newShop.isActive,
            location: null
        };

        return res.status(201).json({ 
            success: true, 
            message: 'Shop registered successfully', 
            user: shopData, 
            shop: shopData, 
            token: accessToken 
        });
    } catch (error) {
        console.error("Shop registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or Mobile already registered' });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unable to create your account. Please try again.',
            code: 'REGISTRATION_FAILED' 
        });
    }
});

// Unified Register endpoint
router.post('/register', async (req, res, next) => {
    const { role } = req.body || {};
    const canonicalRole = (role || 'user').toLowerCase();
    if (canonicalRole === 'farmer' || canonicalRole === 'client') {
        req.url = '/register-farmer';
        return router.handle(req, res, next);
    }
    if (canonicalRole === 'delivery') {
        req.url = '/register-delivery';
        return router.handle(req, res, next);
    }
    if (canonicalRole === 'shop') {
        req.url = '/register-shop';
        return router.handle(req, res, next);
    }
    req.url = '/register-user';
    return router.handle(req, res, next);
});

// Unified Login endpoint supporting role dispatch and auto-detection
router.post('/login', async (req, res, next) => {
    const { role } = req.body || {};
    if (role) {
        const canonicalRole = role.toLowerCase();
        if (canonicalRole === 'farmer' || canonicalRole === 'client') {
            req.url = '/login-farmer';
            return router.handle(req, res, next);
        }
        if (canonicalRole === 'delivery') {
            req.url = '/login-delivery';
            return router.handle(req, res, next);
        }
        if (canonicalRole === 'shop') {
            req.url = '/login-shop';
            return router.handle(req, res, next);
        }
        req.url = '/login-user';
        return router.handle(req, res, next);
    }

    // If no explicit role, auto-detect by credential structure
    const { email, mobile, pin } = req.body || {};
    if (pin && mobile) {
        req.url = '/login-farmer';
        return router.handle(req, res, next);
    }
    if (mobile && !email) {
        req.url = '/login-shop';
        return router.handle(req, res, next);
    }
    req.url = '/login-user';
    return router.handle(req, res, next);
});

// Login Shop
router.post('/login-shop', async (req, res) => {
    try {
        const { mobile, password } = req.body || {};
        if (!mobile || !password) {
            return res.status(400).json({ success: false, message: 'Please provide Mobile Number and Password' });
        }

        const cleanMobile = String(mobile).trim();
        const shop = await Shop.findOne({ mobile: cleanMobile });
        if (!shop || !shop.password) {
            return res.status(401).json({ success: false, message: 'Invalid mobile or password' });
        }

        if (shop.isActive === false) {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.', 
                code: 'USER_INACTIVE' 
            });
        }
        
        const isMatch = await verifySecret(password, shop.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid mobile or password' });
        }

        // Auto-upgrade legacy plaintext password
        if (shop.password === password) {
             try {
                 const salt = await bcrypt.genSalt(10);
                 const hashedPassword = await bcrypt.hash(password, salt);
                 await Shop.updateOne({ _id: shop._id }, { $set: { password: hashedPassword } });
             } catch (upgradeErr) {
                 console.warn("Shop password upgrade notice:", upgradeErr.message);
             }
        }

        const { accessToken, refreshToken } = generateTokens({ id: shop._id, role: 'shop' });
        setRefreshCookie(res, refreshToken);

        const shopData = {
            id: shop._id,
            name: shop.name,
            ownerName: shop.ownerName,
            mobile: shop.mobile,
            role: shop.role,
            isActive: shop.isActive,
            location: shop.location || null
        };

        await Shop.updateOne({ _id: shop._id }, { $set: { lastLogoutAt: null } });

        return res.status(200).json({ success: true, message: 'Login successful', user: shopData, shop: shopData, token: accessToken });
    } catch (error) {
        console.error("Shop login error:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.', 
            code: 'AUTH_SERVICE_ERROR' 
        });
    }
});

// Refresh Token
router.get('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, getJwtSecret());
        const { id, role } = decoded;

        let userData = null;

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id).select('-password');
            if (user) {
                const canonicalRole = user.role === 'customer' ? 'user' : user.role;
                userData = { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: canonicalRole, isActive: user.isActive, lastLogoutAt: user.lastLogoutAt, location: user.location || null };
            }
        } else if (role === 'client' || role === 'farmer') {
            const farmer = await Farmer.findById(id).select('-pin');
            if (farmer) {
                const loc = farmer.farmLocation || (farmer.lat ? { lat: farmer.lat, lng: farmer.lng, address: farmer.address } : (farmer.location ? { address: farmer.location } : null));
                userData = { 
                    id: farmer._id, 
                    name: farmer.name, 
                    mobile: farmer.mobile, 
                    email: farmer.email,
                    verificationStatus: farmer.verificationStatus, 
                    farmerStatus: farmer.farmerStatus,
                    landDocumentRejectionReason: farmer.landDocumentRejectionReason,
                    surveyNumber: farmer.surveyNumber,
                    landDocumentType: farmer.landDocumentType,
                    hasLandDocument: Boolean(farmer.landDocumentReference),
                    location: loc, 
                    address: farmer.address, 
                    role: 'client', 
                    lastLogoutAt: farmer.lastLogoutAt 
                };
            }
        } else if (role === 'shop') {
            const shop = await Shop.findById(id).select('-password');
            if (shop) userData = { id: shop._id, name: shop.name, ownerName: shop.ownerName, mobile: shop.mobile, role: 'shop', isActive: shop.isActive, lastLogoutAt: shop.lastLogoutAt, location: shop.location || null };
        } else if (role === 'delivery') {
            const partner = await DeliveryPartner.findById(id).select('-password');
            if (partner) userData = { id: partner._id, name: partner.name, email: partner.email, mobile: partner.mobile, status: partner.status, role: 'delivery', lastLogoutAt: partner.lastLogoutAt, location: partner.location || null };
        }

        if (!userData) {
            clearRefreshCookie(res);
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.', 
                code: 'USER_NOT_FOUND' 
            });
        }

        if (userData.isActive === false) {
            clearRefreshCookie(res);
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.', 
                code: 'USER_INACTIVE' 
            });
        }

        // Verify token was not issued before or during user's latest logout
        if (userData.lastLogoutAt && decoded.iat) {
            const logoutTimestamp = Math.floor(new Date(userData.lastLogoutAt).getTime() / 1000);
            if (decoded.iat <= logoutTimestamp) {
                clearRefreshCookie(res);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Your session has ended. Please sign in again.', 
                    code: 'SESSION_EXPIRED' 
                });
            }
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens({ id, role: userData.role });
        setRefreshCookie(res, newRefreshToken); // Rotate refresh token

        res.status(200).json({ success: true, user: userData, token: accessToken });
    } catch (error) {
        clearRefreshCookie(res);
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

// Logout (Rule 3, 4, 5, 22)
router.post('/logout', async (req, res) => {
    try {
        clearRefreshCookie(res);

        // Invalidate database session by recording lastLogoutAt
        let tokenToInvalidate = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokenToInvalidate = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.refreshToken) {
            tokenToInvalidate = req.cookies.refreshToken;
        }

        if (tokenToInvalidate) {
            try {
                const decoded = jwt.verify(tokenToInvalidate, getJwtSecret());
                const { id, role } = decoded || {};
                if (id) {
                    const now = new Date();
                    if (role === 'user' || role === 'customer' || role === 'admin') {
                        await User.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'client' || role === 'farmer') {
                        await Farmer.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'shop') {
                        await Shop.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'delivery') {
                        await DeliveryPartner.findByIdAndUpdate(id, { lastLogoutAt: now });
                    }
                }
            } catch (jwtErr) {
                // Token invalid or expired, continue
            }
        }

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        clearRefreshCookie(res);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
});

import { verifyToken, isDelivery } from '../middleware/auth.js';

// Validate Token
router.get('/validate-token', verifyToken, async (req, res) => {
    try {
        console.log('[AUTH_VALIDATE_START] Validating token with MongoDB');
        const { id, role } = req.user;
        let userData = null;

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id).select('-password');
            if (user) {
                const canonicalRole = user.role === 'customer' ? 'user' : user.role;
                userData = { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: canonicalRole, isActive: user.isActive, location: user.location || null };
            }
        } else if (role === 'client' || role === 'farmer') {
            const farmer = await Farmer.findById(id).select('-pin');
            if (farmer) {
                const loc = farmer.farmLocation || (farmer.lat ? { lat: farmer.lat, lng: farmer.lng, address: farmer.address } : (farmer.location ? { address: farmer.location } : null));
                userData = { 
                    id: farmer._id, 
                    name: farmer.name, 
                    mobile: farmer.mobile, 
                    email: farmer.email,
                    verificationStatus: farmer.verificationStatus, 
                    farmerStatus: farmer.farmerStatus,
                    landDocumentRejectionReason: farmer.landDocumentRejectionReason,
                    surveyNumber: farmer.surveyNumber,
                    landDocumentType: farmer.landDocumentType,
                    hasLandDocument: Boolean(farmer.landDocumentReference),
                    role: 'client', 
                    location: loc 
                };
            }
        } else if (role === 'shop') {
            const shop = await Shop.findById(id).select('-password');
            if (shop) userData = { id: shop._id, name: shop.name, ownerName: shop.ownerName, mobile: shop.mobile, role: 'shop', isActive: shop.isActive, location: shop.location || null };
        } else if (role === 'delivery') {
            const partner = await DeliveryPartner.findById(id).select('-password');
            if (partner) userData = { id: partner._id, name: partner.name, email: partner.email, mobile: partner.mobile, status: partner.status, role: 'delivery', location: partner.location || null };
        }

        console.log(`[AUTH_VALIDATE_USER_LOOKUP] Found in DB: ${!!userData}`);

        if (!userData) {
            console.warn('[AUTH_VALIDATE_USER_NOT_FOUND] Token validation failed: user not found');
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.', 
                code: 'USER_NOT_FOUND' 
            });
        }

        if (userData.isActive === false) {
            console.warn('[AUTH_VALIDATE_USER_NOT_FOUND] Token validation failed: user account inactive');
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer available. Please contact support.', 
                code: 'USER_INACTIVE' 
            });
        }

        console.log('[AUTH_VALIDATE_SUCCESS] Token validated successfully against MongoDB');
        res.status(200).json({ success: true, user: userData });
    } catch (error) {
        console.error("Token validation error:", error);
        res.status(401).json({ success: false, message: 'Invalid or expired token.', code: 'VALIDATE_FAILED' });
    }
});

// Update Location for Authenticated Account (User, Farmer, Delivery Partner, Shop)
router.put('/update-location', verifyToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        const { 
            lat, 
            lng, 
            latitude, 
            longitude, 
            address, 
            city, 
            state, 
            pincode, 
            postalCode, 
            area, 
            country, 
            placeId 
        } = req.body || {};

        const latitudeVal = lat !== undefined ? lat : latitude;
        const longitudeVal = lng !== undefined ? lng : longitude;

        if (latitudeVal === undefined || longitudeVal === undefined || isNaN(Number(latitudeVal)) || isNaN(Number(longitudeVal))) {
            return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
        }

        const numLat = Number(latitudeVal);
        const numLng = Number(longitudeVal);
        const cleanAddress = (address || '').trim() || `${numLat.toFixed(4)}, ${numLng.toFixed(4)}`;
        const cleanPincode = String(pincode || postalCode || '').trim();
        const cleanCity = String(city || '').trim();
        const cleanState = String(state || '').trim();
        const cleanCountry = String(country || 'India').trim();
        const cleanArea = String(area || '').trim();
        const cleanPlaceId = placeId ? String(placeId).trim() : null;

        let updatedUser = null;
        const responseLocation = {
            lat: numLat,
            lng: numLng,
            latitude: numLat,
            longitude: numLng,
            address: cleanAddress,
            city: cleanCity,
            state: cleanState,
            pincode: cleanPincode,
            country: cleanCountry,
            area: cleanArea,
            placeId: cleanPlaceId
        };

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            user.location = responseLocation;
            user.locationGeo = {
                type: 'Point',
                coordinates: [numLng, numLat]
            };

            if (!user.addresses) user.addresses = [];
            const existingDefault = user.addresses.find(a => a.isDefault);
            if (existingDefault) {
                existingDefault.address = cleanAddress;
                existingDefault.lat = numLat;
                existingDefault.lng = numLng;
                if (cleanCity) existingDefault.city = cleanCity;
                if (cleanState) existingDefault.state = cleanState;
                if (cleanPincode) existingDefault.pin = cleanPincode;
            } else {
                user.addresses.push({
                    label: 'HOME',
                    name: user.name,
                    address: cleanAddress,
                    city: cleanCity,
                    state: cleanState,
                    pin: cleanPincode,
                    lat: numLat,
                    lng: numLng,
                    isDefault: true
                });
            }

            await user.save();
            const canonicalRole = user.role === 'customer' ? 'user' : user.role;
            updatedUser = {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: canonicalRole,
                location: responseLocation,
                addresses: user.addresses
            };
        } else if (role === 'client' || role === 'farmer') {
            const farmer = await Farmer.findById(id);
            if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

            farmer.location = cleanAddress;
            farmer.address = cleanAddress;
            farmer.lat = numLat;
            farmer.lng = numLng;
            farmer.farmLocation = responseLocation;
            farmer.farmLocationGeo = {
                type: 'Point',
                coordinates: [numLng, numLat]
            };

            await farmer.save();
            updatedUser = {
                id: farmer._id,
                name: farmer.name,
                mobile: farmer.mobile,
                verificationStatus: farmer.verificationStatus,
                role: 'client',
                location: responseLocation
            };
        } else if (role === 'delivery') {
            const partner = await DeliveryPartner.findById(id);
            if (!partner) return res.status(404).json({ success: false, message: 'Delivery partner not found' });

            partner.location = {
                ...responseLocation,
                updatedAt: new Date()
            };
            partner.locationGeo = {
                type: 'Point',
                coordinates: [numLng, numLat]
            };

            await partner.save();
            updatedUser = {
                id: partner._id,
                name: partner.name,
                email: partner.email,
                mobile: partner.mobile,
                status: partner.status,
                role: 'delivery',
                location: responseLocation
            };
        } else if (role === 'shop') {
            const shop = await Shop.findById(id);
            if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

            shop.location = responseLocation;
            shop.locationGeo = {
                type: 'Point',
                coordinates: [numLng, numLat]
            };

            await shop.save();
            updatedUser = {
                id: shop._id,
                name: shop.name,
                ownerName: shop.ownerName,
                email: shop.email,
                mobile: shop.mobile,
                role: 'shop',
                isActive: shop.isActive,
                location: responseLocation
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Location saved successfully',
            user: updatedUser,
            location: responseLocation
        });
    } catch (error) {
        console.error('Update location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to save your location. Please try again.',
            error: error.message
        });
    }
});

// Update Delivery Partner Status
router.put('/delivery/status', verifyToken, isDelivery, async (req, res) => {
    console.log("==> PUT /delivery/status CALLED with body:", req.body, "user:", req.user);
    try {
        const { status } = req.body;
        if (!['Available', 'Offline'].includes(status)) {
            console.log("==> Invalid status:", status);
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const partner = await DeliveryPartner.findByIdAndUpdate(
            req.user.id,
            { status },
            { new: true }
        );
        
        res.status(200).json({ message: 'Status updated successfully', partner });
    } catch (error) {
        console.error("Delivery status update error:", error);
        res.status(500).json({ message: 'Server error updating status', error: error.message });
    }
});

// ==========================================
// PRODUCTION-READY PASSWORD RECOVERY SYSTEM
// ==========================================

// 1. Request Password Reset OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, identifier } = req.body || {};
        const rawEmail = (email || identifier || '').toString().trim();

        if (!rawEmail) {
            return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
        }

        const cleanEmail = rawEmail.toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        // Check if account exists in any role collection
        let user = await User.findOne({ email: cleanEmail });
        let role = user ? user.role : null;

        if (!user) {
            const partner = await DeliveryPartner.findOne({ email: cleanEmail });
            if (partner) {
                user = partner;
                role = 'delivery';
            }
        }
        if (!user) {
            const farmer = await Farmer.findOne({ email: cleanEmail });
            if (farmer) {
                user = farmer;
                role = 'client';
            }
        }
        if (!user) {
            const shop = await Shop.findOne({ email: cleanEmail });
            if (shop) {
                user = shop;
                role = 'shop';
            }
        }

        // If user does not exist, return generic success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account is associated with this email, a verification code has been sent.'
            });
        }

        // Generate cryptographically secure 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Clear any prior unused reset requests for this email
        await PasswordReset.deleteMany({ email: cleanEmail });

        // Save reset record with 10-minute expiration
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await PasswordReset.create({
            email: cleanEmail,
            role: role || 'user',
            otpHash,
            attempts: 0,
            verified: false,
            used: false,
            expiresAt
        });

        // Send OTP via email
        await sendPasswordResetEmail(cleanEmail, otp);

        return res.status(200).json({
            success: true,
            message: 'If an account is associated with this email, a verification code has been sent.'
        });
    } catch (error) {
        console.error('[FORGOT PASSWORD ERROR]:', error.message);
        return res.status(500).json({
            success: false,
            message: 'GreenBond password recovery is temporarily unavailable. Please try again.'
        });
    }
});

// 2. Verify Password Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body || {};
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanOtp = String(otp).trim();

        if (!/^\d{6}$/.test(cleanOtp)) {
            return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
        }

        const resetRecord = await PasswordReset.findOne({
            email: cleanEmail,
            used: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired or is invalid. Please request a new one.'
            });
        }

        if (resetRecord.attempts >= 5) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Too many incorrect attempts. Please request a new verification code.'
            });
        }

        resetRecord.attempts += 1;

        const isMatch = await bcrypt.compare(cleanOtp, resetRecord.otpHash);
        if (!isMatch) {
            await resetRecord.save();
            const remaining = Math.max(0, 5 - resetRecord.attempts);
            return res.status(400).json({
                success: false,
                message: `Invalid verification code. ${remaining} attempt(s) remaining.`
            });
        }

        // Generate cryptographically secure single-use reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        resetRecord.resetTokenHash = resetTokenHash;
        resetRecord.verified = true;
        await resetRecord.save();

        return res.status(200).json({
            success: true,
            message: 'Verification code confirmed.',
            resetToken
        });
    } catch (error) {
        console.error('[VERIFY OTP ERROR]:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error during OTP verification.'
        });
    }
});

// 3. Set New Password using verified Reset Token
router.post('/reset-password', async (req, res) => {
    try {
        const { email, resetToken, newPassword, confirmPassword } = req.body || {};

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset token, and new password are required.'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(String(resetToken).trim()).digest('hex');

        const resetRecord = await PasswordReset.findOne({
            email: cleanEmail,
            resetTokenHash: tokenHash,
            verified: true,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid, expired, or previously used reset session. Please request a new verification code.'
            });
        }

        // Find the account without altering role
        let account = await User.findOne({ email: cleanEmail });
        let isFarmerAccount = false;

        if (!account) {
            account = await DeliveryPartner.findOne({ email: cleanEmail });
        }
        if (!account) {
            account = await Farmer.findOne({ email: cleanEmail });
            if (account) isFarmerAccount = true;
        }
        if (!account) {
            account = await Shop.findOne({ email: cleanEmail });
        }

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (isFarmerAccount && account.pin !== undefined) {
            account.pin = hashedPassword;
        } else {
            account.password = hashedPassword;
        }

        // Invalidate all prior active JWT sessions
        account.lastLogoutAt = new Date();
        await account.save();

        // Mark reset token as used and purge active tokens
        resetRecord.used = true;
        await resetRecord.save();
        await PasswordReset.deleteMany({ email: cleanEmail });

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully. Please log in with your new password.'
        });
    } catch (error) {
        console.error('[RESET PASSWORD ERROR]:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error during password reset.'
        });
    }
});

// Legacy backward-compatibility routes
router.post('/reset-password-user', async (req, res) => {
    // Forward to secure reset-password if resetToken is present, otherwise reject insecure direct reset
    if (req.body && req.body.resetToken) {
        req.url = '/reset-password';
        return router.handle(req, res);
    }
    return res.status(400).json({
        success: false,
        message: 'Password reset requires verification. Please use the Forgot Password flow.'
    });
});

router.post('/reset-password-delivery', async (req, res) => {
    if (req.body && req.body.resetToken) {
        req.url = '/reset-password';
        return router.handle(req, res);
    }
    return res.status(400).json({
        success: false,
        message: 'Password reset requires verification. Please use the Forgot Password flow.'
    });
});

// GET saved addresses
router.get('/user/addresses', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching addresses' });
    }
});

// POST saved address (support both plural and singular)
const handleSaveAddress = async (req, res) => {
    try {
        const { label, name, address, city, state, pin, lat, lng, isDefault } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }

        user.addresses.push({ label, name, address, city, state, pin, lat, lng, isDefault });
        if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
            user.location = { lat: Number(lat), lng: Number(lng), address: address || '' };
            user.locationGeo = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
        }
        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error saving address' });
    }
};

router.post('/user/addresses', verifyToken, handleSaveAddress);
router.post('/user/address', verifyToken, handleSaveAddress);

// DELETE saved address
router.delete('/user/addresses/:addressId', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting address' });
    }
});

// UPDATE saved address
router.put('/user/addresses/:addressId', verifyToken, async (req, res) => {
    try {
        const { label, name, address, city, state, pin, lat, lng, isDefault } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) return res.status(404).json({ message: 'Address not found' });

        if (isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
            addr.isDefault = true;
        }

        if (label !== undefined) addr.label = label;
        if (name !== undefined) addr.name = name;
        if (address !== undefined) addr.address = address;
        if (city !== undefined) addr.city = city;
        if (state !== undefined) addr.state = state;
        if (pin !== undefined) addr.pin = pin;
        if (lat !== undefined && !isNaN(Number(lat))) addr.lat = Number(lat);
        if (lng !== undefined && !isNaN(Number(lng))) addr.lng = Number(lng);

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating address' });
    }
});

// SET default address
router.patch('/user/addresses/:addressId/default', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const target = user.addresses.id(req.params.addressId);
        if (!target) return res.status(404).json({ message: 'Address not found' });

        user.addresses.forEach(a => a.isDefault = false);
        target.isDefault = true;

        if (target.lat && target.lng) {
            user.location = { lat: target.lat, lng: target.lng, address: target.address || '' };
            user.locationGeo = { type: 'Point', coordinates: [target.lng, target.lat] };
        }

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error setting default address' });
    }
});

export default router;
