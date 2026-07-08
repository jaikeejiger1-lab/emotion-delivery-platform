/**
 * server.js — Hardyy Platform Backend (Full-Stack)
 * Bootstraps Express + WebSocket, connects MongoDB, mounts all routes.
 */
require('dotenv').config();
const http       = require('http');
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const WebSocket  = require('ws');
const connectDB  = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Initialise Passport (Google OAuth) ───────────────────────────────
require('./config/passport');
const passport = require('passport');

// ── Route imports ─────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const memoryVaultRoutes  = require('./routes/memoryVaultRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const paymentRoutes      = require('./routes/paymentRoutes');
const mediaRoutes        = require('./routes/mediaRoutes');
const chatbotRoutes      = require('./routes/chatbotRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const trackingRoutes     = require('./routes/trackingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const productRoutes      = require('./routes/productRoutes');

// ── Connect DB ────────────────────────────────────────────────────────
connectDB();

const app = express();
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://emotion-delivery-platform.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5504',
  'http://127.0.0.1:5504',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^https:\/\/emotion-delivery-platform.*\.vercel\.app$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed by Hardyy Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Handle preflight OPTIONS requests for all routes BEFORE the main cors middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── Rate Limiting ─────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' })); // 50mb for Base64 video uploads
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Passport ─────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Static Files (uploaded videos) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🎁 Hardyy API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/memory-vault',    memoryVaultRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/orders',          orderRoutes);
app.use('/api/payments',        paymentRoutes);   // Dedicated Razorpay payment endpoints
app.use('/api/media',           mediaRoutes);
app.use('/api/chatbot',         chatbotRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/tracking',        trackingRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/reports',         reportRoutes);
app.use('/api/products',        productRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── HTTP Server (shared with WebSocket) ───────────────────────────────
const PORT   = process.env.PORT   || 5000;
const server = http.createServer(app);

// ── WebSocket Server ──────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws/tracking' });
const { setupWebSocket } = require('./controllers/trackingController');
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`\n🚀 Hardyy API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   REST API    : http://localhost:${PORT}/health`);
  console.log(`   WebSocket   : ws://localhost:${PORT}/ws/tracking\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
