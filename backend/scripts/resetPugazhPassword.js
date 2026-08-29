import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function reset() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond');
        console.log("Connected to MongoDB");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: 'pugazh@gmail.com' },
            { $set: { password: hashedPassword } }
        );

        console.log("Password reset result:", result.modifiedCount > 0 ? "SUCCESS (Password is 123456)" : "User not found or unchanged");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

reset();
