import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Shop from '../models/Shop.js';
import { isWithinServiceArea } from '../utils/locationUtils.js';

// Register User
router.post('/register-user', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword, location } = req.body;

        // Basic validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, mobile, password: hashedPassword, location }); // role automatically defaults to 'customer'
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: { name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (error) {
        console.error("User registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email or Mobile already registered' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Register Farmer
router.post('/register-farmer', async (req, res) => {
    try {
        const { name, mobile, location, address, lat, lng, farmLocation, pin, idProofDoc, landProofDoc } = req.body;

        if (lat && lng && !isWithinServiceArea(lat, lng)) {
            return res.status(400).json({ message: 'Currently Green Bond service is not available outside the 10 KM launch zone.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        const newFarmer = new Farmer({ 
            name, mobile, location, address, lat, lng, farmLocation, pin: hashedPin,
            idProofDoc, landProofDoc,
            verificationStatus: 'PENDING_VERIFICATION'
        });
        await newFarmer.save();

        res.status(201).json({ message: 'Farmer registered successfully', farmer: { name: newFarmer.name, mobile: newFarmer.mobile, role: 'farmer' } });
    } catch (error) {
        console.error("Farmer registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Register Delivery Partner
router.post('/register-delivery', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword, location } = req.body;

        // Basic validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newPartner = new DeliveryPartner({ 
            name, 
            email, 
            mobile, 
            password: hashedPassword, 
            role: 'delivery', 
            location,
            locationGeo: location && location.lng && location.lat ? {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            } : undefined
        });
        await newPartner.save();

        res.status(201).json({ message: 'Delivery Partner registered successfully', partner: { name: newPartner.name, email: newPartner.email, role: 'delivery' } });
    } catch (error) {
        console.error("Delivery Partner registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email or Mobile already registered' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Login User
router.post('/login-user', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password (with fallback for legacy plaintext)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Auto-upgrade legacy password
        if (user.password === password) {
             const salt = await bcrypt.genSalt(10);
             user.password = await bcrypt.hash(password, salt);
             await user.save();
        }

        const canonicalRole = user.role === 'customer' ? 'user' : user.role;

        // Return the actual user data, omitting the password
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: canonicalRole
        };

        const token = jwt.sign({ id: user._id, role: canonicalRole }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ message: 'Login successful', user: userData, token });
    } catch (error) {
        console.error("User login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Login Farmer
router.post('/login-farmer', async (req, res) => {
    try {
        const { name, mobile, pin } = req.body;

        const farmer = await Farmer.findOne({ 
            mobile, 
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (!farmer) {
            return res.status(401).json({ message: 'Invalid Name, Mobile Number or PIN' });
        }
        
        const isMatch = await bcrypt.compare(pin, farmer.pin);
        if (!isMatch && farmer.pin !== pin) {
             return res.status(401).json({ message: 'Invalid Name, Mobile Number or PIN' });
        }
        
        // Auto-upgrade legacy pin
        if (farmer.pin === pin) {
             const salt = await bcrypt.genSalt(10);
             farmer.pin = await bcrypt.hash(pin, salt);
             await farmer.save();
        }

        const token = jwt.sign({ id: farmer._id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });

        // Include verificationStatus in login response, but omit sensitive info
        const farmerData = {
            id: farmer._id,
            name: farmer.name,
            mobile: farmer.mobile,
            verificationStatus: farmer.verificationStatus,
            location: farmer.location,
            address: farmer.address,
            role: 'client'
        };

        res.status(200).json({ message: 'Login successful', farmer: farmerData, token });
    } catch (error) {
        console.error("Farmer login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Login Delivery Partner
router.post('/login-delivery', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const partner = await DeliveryPartner.findOne({ email: cleanEmail });
        if (!partner) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, partner.password);
        if (!isMatch && partner.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Auto-upgrade legacy password
        if (partner.password === password) {
             const salt = await bcrypt.genSalt(10);
             partner.password = await bcrypt.hash(password, salt);
             await partner.save();
        }

        const token = jwt.sign({ id: partner._id, role: 'delivery' }, JWT_SECRET, { expiresIn: '7d' });

        const partnerData = {
            id: partner._id,
            name: partner.name,
            email: partner.email,
            mobile: partner.mobile,
            status: partner.status,
            role: partner.role
        };

        res.status(200).json({ message: 'Login successful', partner: partnerData, token });
    } catch (error) {
        console.error("Delivery login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Register Shop
router.post('/register-shop', async (req, res) => {
    try {
        const { name, ownerName, email, mobile, password, confirmPassword, location } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newShop = new Shop({ 
            name, ownerName, email, mobile, password: hashedPassword, location,
            locationGeo: location && location.lng && location.lat ? {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            } : undefined
        });
        await newShop.save();

        res.status(201).json({ message: 'Shop registered successfully', shop: { name: newShop.name, email: newShop.email, role: 'shop' } });
    } catch (error) {
        console.error("Shop registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email or Mobile already registered' });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Login Shop
router.post('/login-shop', async (req, res) => {
    try {
        const { mobile, password } = req.body;
        const shop = await Shop.findOne({ mobile });
        if (!shop) {
            return res.status(401).json({ message: 'Invalid mobile or password' });
        }
        
        const isMatch = await bcrypt.compare(password, shop.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid mobile or password' });
        }

        const token = jwt.sign({ id: shop._id, role: 'shop' }, JWT_SECRET, { expiresIn: '7d' });

        const shopData = {
            id: shop._id,
            name: shop.name,
            ownerName: shop.ownerName,
            mobile: shop.mobile,
            role: shop.role,
            isActive: shop.isActive
        };

        res.status(200).json({ message: 'Login successful', shop: shopData, token });
    } catch (error) {
        console.error("Shop login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

import { verifyToken, isDelivery } from '../middleware/auth.js';

// Validate Token
router.get('/validate-token', verifyToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        let userData = null;

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id).select('-password');
            if (user) {
                const canonicalRole = user.role === 'customer' ? 'user' : user.role;
                userData = { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: canonicalRole };
            }
        } else if (role === 'client' || role === 'farmer') { // Note: existing role for farmer is 'client' in token
            const farmer = await Farmer.findById(id).select('-pin');
            if (farmer) userData = { id: farmer._id, name: farmer.name, mobile: farmer.mobile, verificationStatus: farmer.verificationStatus, role: 'client' };
        } else if (role === 'shop') {
            const shop = await Shop.findById(id).select('-password');
            if (shop) userData = { id: shop._id, name: shop.name, ownerName: shop.ownerName, mobile: shop.mobile, role: 'shop', isActive: shop.isActive };
        } else if (role === 'delivery') {
            const partner = await DeliveryPartner.findById(id).select('-password');
            if (partner) userData = { id: partner._id, name: partner.name, email: partner.email, mobile: partner.mobile, status: partner.status, role: 'delivery' };
        }

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user: userData });
    } catch (error) {
        res.status(500).json({ message: 'Server error validating token' });
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

// Reset Password - User
router.post('/reset-password-user', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error("User password reset error:", error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

// Reset PIN - Farmer
router.post('/reset-pin-farmer', async (req, res) => {
    try {
        const { mobile, newPin } = req.body;

        const farmer = await Farmer.findOne({ mobile });
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer with this mobile number not found' });
        }

        const salt = await bcrypt.genSalt(10);
        farmer.pin = await bcrypt.hash(newPin, salt);
        await farmer.save();

        res.status(200).json({ message: 'PIN reset successful' });
    } catch (error) {
        console.error("Farmer PIN reset error:", error);
        res.status(500).json({ message: 'Server error during PIN reset' });
    }
});

// Reset Password - Delivery Partner
router.post('/reset-password-delivery', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const partner = await DeliveryPartner.findOne({ email: cleanEmail });
        if (!partner) {
            return res.status(404).json({ message: 'Delivery Partner with this email not found' });
        }

        const salt = await bcrypt.genSalt(10);
        partner.password = await bcrypt.hash(newPassword, salt);
        await partner.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error("Delivery password reset error:", error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
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

// POST saved address
router.post('/user/addresses', verifyToken, async (req, res) => {
    try {
        const { label, name, address, city, state, pin, lat, lng, isDefault } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }

        user.addresses.push({ label, name, address, city, state, pin, lat, lng, isDefault });
        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error saving address' });
    }
});

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

export default router;
