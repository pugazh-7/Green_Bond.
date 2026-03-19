import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Static Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all for SPA
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

