require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Trust proxy for production (Heroku, AWS, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(compression());

// ---------- CORS Configuration (must come before rate limiters) ----------
const rawFrontendUrl = process.env.FRONTEND_URL;
const rawAdminUrl = process.env.ADMIN_URL;

// Start with hardcoded fallback origins (you can keep or remove)
let allowedOrigins = [
  'https://cryptosimia.com',
  'https://www.cryptosimia.com',
  'https://admin.cryptosimia.com',
  'https://www.admin.cryptosimia.com',
  'https://api.cryptosimia.com'
];

// Helper to add an origin and optionally its www variant
const addOriginWithWww = (origin) => {
  if (!origin) return;
  allowedOrigins.push(origin);
  // Add www version if it's a production HTTPS origin without www
  if (origin.startsWith('https://') && !origin.includes('www.') && !origin.includes('localhost')) {
    const wwwOrigin = origin.replace(/^https:\/\//, 'https://www.');
    allowedOrigins.push(wwwOrigin);
  }
};

// Process frontend URLs (comma‑separated)
if (rawFrontendUrl) {
  rawFrontendUrl.split(',').map(s => s.trim()).forEach(addOriginWithWww);
}

// Process admin URLs (comma‑separated)
if (rawAdminUrl) {
  rawAdminUrl.split(',').map(s => s.trim()).forEach(addOriginWithWww);
}

// Fallback for development if no env vars provided
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
}

// Remove duplicates (just in case)
allowedOrigins = [...new Set(allowedOrigins)];

// Log the allowed origins for debugging (remove after testing)
console.log('Allowed origins:', allowedOrigins);

// Apply CORS middleware for Express routes
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // In production, only allow explicit origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost in development mode only
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
    return callback(new Error(msg), false);
  },
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control']
}));

// Explicitly handle preflight requests for all routes
app.options('*', cors());
// ----------------------------------------

// ---------- Rate Limiters ----------
// Admin API – higher limit (adjust via environment variables)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.ADMIN_RATE_LIMIT || 500, // can be overridden in .env
  message: 'Too many admin requests, please slow down.'
});

// Public API – default limit (increased to 200 for many users)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.PUBLIC_RATE_LIMIT || 200, // adjustable via .env
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply admin limiter first (more specific)
app.use('/api/admin', adminLimiter);
// Apply public limiter to all other /api routes (must come after admin)
app.use('/api/', publicLimiter);
// ----------------------------------------

// Socket.IO with the same allowed origins
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to our router
app.set('io', io);

// After initializing socket.io
const chatSocket = require('./sockets/chat')(io);
const { startPriceFeed } = require('./utils/priceFeed');
startPriceFeed(io);

// Body Parser Middleware – MUST come before any route that needs req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
const path = require('path');
// Profile pictures: public (they're user avatars shown in the app)
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Chat attachments: public (they're shared in support chats)
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/kyc', 'uploads/chat'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// KYC documents: NOT served statically - served via authenticated endpoint in users.js

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('Successfully connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Socket.io for real-time data
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_admin', () => {
    socket.join('admin');
  });

  socket.on('leave_admin', () => {
    socket.leave('admin');
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('leave_user', (userId) => {
    socket.leave(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/market', require('./routes/market'));
app.use('/api/news', require('./routes/news'));
// Add chat routes
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/notifications', require('./routes/notifications'));

// Error Handling Middleware
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});