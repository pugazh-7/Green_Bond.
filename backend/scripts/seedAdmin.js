import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';

export const provisionAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
        }

        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@greenbond.com').trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            let updated = false;
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                updated = true;
            }
            if (!existingAdmin.isActive) {
                existingAdmin.isActive = true;
                updated = true;
            }
            // Update password hash if needed
            const isMatch = await bcrypt.compare(adminPassword, existingAdmin.password).catch(() => false);
            if (!isMatch) {
                existingAdmin.password = hashedPassword;
                updated = true;
            }
            if (updated) {
                await existingAdmin.save();
                console.log(`[ADMIN PROVISIONING] Admin user (${adminEmail}) updated with role 'admin'.`);
            } else {
                console.log(`[ADMIN PROVISIONING] Admin user (${adminEmail}) already exists with verified admin role.`);
            }
            return { action: 'updated', email: adminEmail };
        }

        const newAdmin = new User({
            name: 'Administrator',
            email: adminEmail,
            mobile: '0000000000',
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });

        await newAdmin.save();
        console.log(`[ADMIN PROVISIONING] Admin user (${adminEmail}) successfully created with role 'admin'.`);
        return { action: 'created', email: adminEmail };
    } catch (error) {
        console.error('[ADMIN PROVISIONING ERROR]:', error.message);
        throw error;
    }
};

// If invoked directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
    provisionAdmin()
        .then(() => {
            mongoose.connection.close();
            process.exit(0);
        })
        .catch(() => {
            mongoose.connection.close();
            process.exit(1);
        });
}
