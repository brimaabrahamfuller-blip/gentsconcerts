require('dotenv').config();

// Startup Check: Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('FATAL ERROR: Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

// Resend Warning: Email verification is critical for login
if (!process.env.RESEND_API_KEY) {
    console.warn('WARNING: RESEND_API_KEY is not configured. Email verification will fail, blocking user login.');
}

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize'); // NEW SECURITY REQUIRE
const path = require('path');
const { initializeTicketJanitorWorker } = require('./services/TicketJanitor');

const app = express();
app.set('trust proxy', 1);

// Security Middleware
// crossOriginResourcePolicy is set to "cross-origin" because our frontend
// (gentsconcerts.netlify.app) loads flyer images from this backend's
// /uploads route on a different origin - Helmet's default "same-origin"
// policy silently blocks the browser from displaying those images.
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
    'https://gentsconcerts.netlify.app',
    'https://gentsconcerts-backend.onrender.com',
    'http://localhost:19006', // Expo Web local
    'http://localhost:8081',  // Metro bundler
];

// FIXED: Changed '*' to use your strict array filter for production domain locking
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Rejected by structural backend CORS validation rule.'));
        }
    },
    credentials: true
}));

// ============================================================
// RATE LIMITING
// ============================================================
// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again in 20 minutes.' }
});

// Login endpoint limiter
const loginLimiter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 minutes
    max: 50, // limit each IP to 50 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again in 20 minutes.' }
});

// Registration limiter
const registerLimiter = rateLimit({
    windowMs: 20 * 60 * 1000, // 20 minutes
    max: 50, // limit each IP to 50 registrations per 20 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many account registrations. Please try again later.' }
});

// Email verification / password reset limiter
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 email sends per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many email requests. Please try again in 1 hour.' }
});

// Payment endpoint limiter
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 payment attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many payment attempts. Please try again later.' }
});

// API endpoint limiter (general)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Body Parser & Input Sanitization
app.use(express.json({ limit: '10kb' })); // NEW: Protects against buffer overflow Denial of Service attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize()); // NEW: Strips dangerous MongoDB operator keys ($gt, $ne) from request payloads

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection & Worker Hook
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected...');
        // NEW: Safely initialize background ticket sweep engine once DB connection is stable
        initializeTicketJanitorWorker(); 
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('GentsConcerts API is running...');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');

// Apply rate limiters to specific routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', emailLimiter);
app.use('/api/auth/resend-verification', emailLimiter);
app.use('/api/auth/verify', authLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
