require('dotenv').config();

// Startup Check: Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('FATAL ERROR: Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true
}));

// ============================================================
// RATE LIMITING
// ============================================================
const authLimiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many attempts. Please try again in 20 minutes.' }
});

const loginLimiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many login attempts. Please try again in 20 minutes.' }
});

const registerLimiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many account registrations. Please try again later.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('GentsConcerts Production API is running...');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Import Routes from backend folder
const authRoutes = require('./backend/routes/auth');
const userRoutes = require('./backend/routes/users');
const eventRoutes = require('./backend/routes/events');
const ticketRoutes = require('./backend/routes/tickets');
const adminRoutes = require('./backend/routes/admin');
const paymentRoutes = require('./backend/routes/payments');
const notificationRoutes = require('./backend/routes/notifications');

// Apply rate limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Production Server running on port ${PORT}`);
});
