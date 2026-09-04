import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

dotenv.config({ path: '.env' });

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import imageProviderRoutes from './routes/imageProviderRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import bulkOrderRoutes from './routes/bulkOrderRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (isDev || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With', 'Accept'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Limit body size

// Rate Limiting
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 2000 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);

// Performance logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`);
    });
    next();
});

// Expose io to all routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Clients can join rooms based on their user ID or role
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Health Check Route
app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
        success: isDbConnected,
        status: isDbConnected ? 'healthy' : 'degraded',
        database: isDbConnected ? 'connected' : 'disconnected',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-images', imageProviderRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);

// Return JSON 404 for unhandled API requests (prevents returning SPA HTML on missing API routes)
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `API route ${req.method} ${req.originalUrl} not found` });
});

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/cdn', express.static(path.join(__dirname, 'storage/cdn')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all for SPA
app.use((req, res) => {
    const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).send('GreenBond frontend build not found. Please build the frontend.');
        }
    });
});

// Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';
    if ((mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) && !mongoUri.includes('directConnection')) {
        mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
    }
    try {
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        });
        console.log('✓ MongoDB connected successfully');
    } catch (err) {
        console.error('✗ MongoDB connection error:', err.message);
    }
};

connectDB();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

