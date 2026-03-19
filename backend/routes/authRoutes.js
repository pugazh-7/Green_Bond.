import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

// Register User
router.post('/register-user', async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body;

        // Basic validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { mobile }] 
        });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
            return res.status(400).json({ message: 'User with this mobile number already exists' });
        }

        const newUser = new User({ name, email, mobile, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
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
        const { name, mobile, location, pin } = req.body;

        const existingFarmer = await Farmer.findOne({ mobile });
        if (existingFarmer) {
            return res.status(400).json({ message: 'Farmer with this mobile number already exists' });
        }

        const newFarmer = new Farmer({ name, mobile, location, pin });
        await newFarmer.save();

        res.status(201).json({ message: 'Farmer registered successfully', farmer: newFarmer });
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
        const { name, email, mobile, password, confirmPassword } = req.body;

        // Basic validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingPartner = await DeliveryPartner.findOne({ 
            $or: [{ email }, { mobile }] 
        });
        if (existingPartner) {
            if (existingPartner.email === email) {
                return res.status(400).json({ message: 'Partner with this email already exists' });
            }
            return res.status(400).json({ message: 'Partner with this mobile number already exists' });
        }

        const newPartner = new DeliveryPartner({ name, email, mobile, password, role: 'delivery' });
        await newPartner.save();

        res.status(201).json({ message: 'Delivery Partner registered successfully', partner: newPartner });
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

        // Admin hardcoded check
        if (cleanEmail === 'admin@greenbond.com' && password === 'admin123') {
            return res.status(200).json({ 
                message: 'Admin login successful', 
                user: { name: 'Administrator', email: 'admin@greenbond.com', role: 'admin' } 
            });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error("User login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Login Farmer
router.post('/login-farmer', async (req, res) => {
    try {
        const { name, mobile, pin } = req.body;
        
        // Admin hardcoded check for Farmer portal
        if (name === 'Admin' && mobile === '0000000000' && pin === '1234') {
            return res.status(200).json({ 
                message: 'Admin login successful', 
                farmer: { name: 'Administrator', mobile: '0000000000', role: 'admin' } 
            });
        }

        const farmer = await Farmer.findOne({ 
            mobile, 
            pin,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (!farmer) {
            return res.status(401).json({ message: 'Invalid Name, Mobile Number or PIN' });
        }

        res.status(200).json({ message: 'Login successful', farmer });
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

        // Admin hardcoded check for Delivery portal
        if (cleanEmail === 'admin@greenbond.com' && password === 'admin123') {
            return res.status(200).json({ 
                message: 'Admin login successful', 
                partner: { name: 'Administrator', email: 'admin@greenbond.com', role: 'admin' } 
            });
        }

        const partner = await DeliveryPartner.findOne({ email: cleanEmail });
        if (!partner || partner.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', partner });
    } catch (error) {
        console.error("Delivery login error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
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

        user.password = newPassword;
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

        farmer.pin = newPin;
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

        partner.password = newPassword;
        await partner.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error("Delivery password reset error:", error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

export default router;

