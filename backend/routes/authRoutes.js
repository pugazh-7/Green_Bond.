import express from 'express';
import bcrypt from 'bcryptjs';
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, mobile, password: hashedPassword }); // role automatically defaults to 'customer'
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
        const { name, mobile, location, pin } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        const newFarmer = new Farmer({ name, mobile, location, pin: hashedPin });
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
        const { name, email, mobile, password, confirmPassword } = req.body;

        // Basic validation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newPartner = new DeliveryPartner({ name, email, mobile, password: hashedPassword, role: 'delivery' });
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

        // Return the actual user data, omitting the password
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role
        };

        res.status(200).json({ message: 'Login successful', user: userData });
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

export default router;
