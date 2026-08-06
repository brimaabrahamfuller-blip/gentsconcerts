const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');

// 1. HTTP Security Headers with strict Content Security Policy
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://cloudinary.com"], // CDN for flyers
            connectSrc: ["'self'", "https://onrender.com"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true
});

// 2. Specialized Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 15, // Max 15 attempts
    message: { error: 'Too many authentication attempts. Please retry in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const ticketLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 3, // Max 3 purchases/min per IP to eliminate scalping scripts
    message: { error: 'Transaction limit reached. Slow down to guarantee ticket availability.' },
    standardHeaders: true,
    legacyHeaders: false
});

// 3. Automated CORS handling mapping production and sandbox platforms
const allowedOrigins = ['https://netlify.app', 'http://localhost:8081', 'http://localhost:19006'];
const corsConfiguration = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Rejected by structural backend CORS validation rule.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
});

// 4. Input Protection Layer against NoSQL Payload injections ($ operators)
const sanitizePayloads = mongoSanitize({
    replaceWith: '_',
    dryRun: false
});

module.exports = {
    securityHeaders,
    authLimiter,
    ticketLimiter,
    corsConfiguration,
    sanitizePayloads
};
