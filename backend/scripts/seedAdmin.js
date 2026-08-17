import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Adjust for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log('MongoDB connected for seeding...');

        const adminEmail = 'admin@greenbond.com';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists. Aborting seed process to maintain security.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt); // In production, pass this via env vars

        const adminUser = new User({
            name: 'Administrator',
            email: adminEmail,
            mobile: '0000000000',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user securely created!');
        
    } catch (error) {
        console.error('Error seeding admin user:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedAdmin();
