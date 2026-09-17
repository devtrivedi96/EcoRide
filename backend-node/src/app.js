require('express-async-errors');           // patches Express to forward async errors automatically
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const logger      = require('./config/logger');

// ── Route Modules ─────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const rideRoutes      = require('./routes/rideRoutes');
const tripRoutes      = require('./routes/tripRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatRoutes      = require('./routes/chatRoutes');
const auditRoutes     = require('./routes/auditRoutes');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Trust proxy (required behind Nginx / load balancers) ─────────────────────
app.set('trust proxy', 1);

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,   // disable CSP in dev
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: !allowedOrigins.includes('*'),
  maxAge: 86400,   // preflight cache 24 h
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Response compression ──────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logging (Morgan → Winston) ───────────────────────────────────
const morganFormat = isProd ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.path === '/health',   // don't log health-check noise
}));

// ── Global rate limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: isProd ? 300 : 10000,  // relax in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Tighter limiter on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 10000,
  message: { message: 'Too many authentication attempts. Please wait 15 minutes.' },
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'carpooling-platform-node',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/rides',     rideRoutes);
app.use('/api/trips',     tripRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/audit',     auditRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isOperational = status < 500;

  // Always log 5xx errors; only log 4xx in dev
  if (status >= 500) {
    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  } else if (!isProd) {
    logger.warn({ message: err.message, path: req.path });
  }

  res.status(status).json({
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(isProd || isOperational ? {} : { stack: err.stack }),
  });
});

module.exports = app;
