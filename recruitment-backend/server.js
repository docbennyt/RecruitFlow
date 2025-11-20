const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = require('./config/database');

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Routes - mount only if the module exports an Express router / middleware
function safeMount(path, modPath) {
  try {
    const route = require(modPath);
    // Express routers are functions with a 'stack' array; middleware is a function
    const isRouter = route && (typeof route === 'function' || Array.isArray(route.stack));
    if (isRouter) {
      app.use(path, route);
      console.log('Mounted', path, '->', modPath);
    } else {
      console.log('Skipping mount for', path, '- module did not export a router/middleware:', modPath);
    }
  } catch (err) {
    console.warn('Failed to mount', path, 'from', modPath, err && err.message);
  }
}

safeMount('/api/auth', './routes/auth');
safeMount('/api/cv', './routes/cv');
safeMount('/api/jobs', './routes/jobs');
safeMount('/api/matching', './routes/matching');
safeMount('/api/payments', './routes/payments');
safeMount('/api/admin', './routes/admin');

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Recruitment Backend API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;