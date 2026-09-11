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
import farmerRoutes from './routes/farmerRoutes.js';

const app = express();

// Trust reverse proxy (Vercel, Render load balancers) so client IP is accurately recognized
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));

const normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    return url.trim().replace(/\/+$/, '');
};

const explicitAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
    normalizeUrl(process.env.CLIENT_URL),
    normalizeUrl(process.env.FRONTEND_URL),
    'https://green-bond.vercel.app',
    'https://greenbond.vercel.app'
].filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true; // allow mobile apps, curl, server-to-server
    const normalizedOrigin = normalizeUrl(origin);
    
    // Check explicit origins
    if (explicitAllowedOrigins.includes(normalizedOrigin)) {
        return true;
    }
    
    // In dev mode allow all localhost / 127.0.0.1
    if (isDev) {
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
            return true;
        }
    }
    
    // Allow any Vercel preview or production deployment domain (e.g. *.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin) || /^https:\/\/[a-zA-Z0-9_-]+-.*\.vercel\.app$/.test(origin)) {
        return true;
    }
    
    // Check if matches any configured prefix
    if (explicitAllowedOrigins.some(allowed => normalizedOrigin.startsWith(allowed))) {
        return true;
    }
    
    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Limit body size

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 2000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
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

// Fail-fast Database Readiness Check
// Prevents requests from hanging 10-15s and timing out with 504 when MongoDB is disconnected
app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/healthz') {
        return next();
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'GreenBond database is currently connecting. Please retry in a few moments.',
            code: 'DATABASE_DISCONNECTED'
        });
    }
    next();
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
app.use('/api/farmers', farmerRoutes);

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

// Database Connection with resilient retry & auto-reconnect
mongoose.set('bufferCommands', false);
let isConnecting = false;
const connectDB = async (retryCount = 0) => {
    if (mongoose.connection.readyState >= 1 || isConnecting) {
        return;
    }
    isConnecting = true;
    
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        if (!isDev) {
            console.error('⚠️ [CRITICAL CONFIG WARNING] MONGO_URI environment variable is missing in production!');
            console.error('⚠️ Please add MONGO_URI in your hosting dashboard (e.g. Render / MongoDB Atlas).');
        }
        mongoUri = 'mongodb://127.0.0.1:27017/green_bond?directConnection=true';
    }
    if ((mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) && !mongoUri.includes('directConnection')) {
        mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
    }
    try {
        const sanitizedHost = mongoUri.includes('@') 
            ? mongoUri.split('@')[1].split('/')[0] 
            : (mongoUri.split('://')[1] || '').split('/')[0];
        console.log(`Connecting to MongoDB (${sanitizedHost})... (attempt ${retryCount + 1})`);
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        });
        console.log('✓ MongoDB connected successfully to', sanitizedHost);
    } catch (err) {
        console.error(`✗ MongoDB connection error (attempt ${retryCount + 1}):`, err.message);
        // Automatically retry connecting with backoff
        const delay = Math.min(2000 * Math.pow(1.5, retryCount), 30000);
        console.log(`Retrying MongoDB connection in ${Math.round(delay / 1000)}s...`);
        setTimeout(() => {
            isConnecting = false;
            connectDB(retryCount + 1);
        }, delay);
    } finally {
        isConnecting = false;
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection lost. Reconnecting...');
    connectDB();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error event:', err.message);
});

connectDB();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

