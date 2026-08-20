import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = (await import('../models/User.js')).default;
        
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log("No admin found to test. Generating a mock token.");
        }

        const token = jwt.sign(
            { id: admin ? admin._id : new mongoose.Types.ObjectId(), role: 'admin' }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '1h' }
        );

        console.log("Fetching /api/admin/audit...");
        const res = await fetch(`http://localhost:${process.env.PORT || 5000}/api/admin/audit`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        console.log("Audit Status:");
        console.log(JSON.stringify(data, null, 2));

        mongoose.disconnect();
    } catch (e) {
        console.error("Test failed", e);
        mongoose.disconnect();
    }
};

runTest();
