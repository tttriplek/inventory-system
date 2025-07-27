require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const DatabaseManager = require('./core/database/connection');
const logger = require('./utils/logger');

/**
 * Revolutionary Inventory System - Professional Backend
 * 
 * A facility-first inventory management system built with
 * enterprise-grade architecture and professional standards.
 */

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ SECURITY MIDDLEWARE
app.use(helmet({
  contentSecurityPolicy: false, // Allow for API usage
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 🌐 CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL?.split(',') || []
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Facility-ID']
}));

// 📝 REQUEST PARSING
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📊 REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request completion
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
});

// 🏢 FACILITY HEADER MIDDLEWARE
app.use('/api/', (req, res, next) => {
  // Extract facility ID from headers for multi-tenant support
  const facilityId = req.headers['x-facility-id'];
  if (facilityId) {
    req.facilityId = facilityId;
  }
  next();
});

// 🎯 API ROUTES
// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = DatabaseManager.getConnectionStatus();
  
  res.json({
    success: true,
    service: 'Revolutionary Inventory System',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Core facility management
app.use('/api/facilities', require('./core/facility/facilityRoutes'));

// 🚀 DYNAMIC MODULE LOADING
// This will automatically register routes for enabled features
const moduleLoader = require('./utils/moduleLoader');
moduleLoader.loadModules(app);

// 🔍 API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Revolutionary Inventory System API',
    version: '1.0.0',
    documentation: {
      facilities: 'GET|POST /api/facilities',
      health: 'GET /health',
      features: 'Dynamic routes based on facility configuration'
    },
    architecture: 'Facility-First Design',
    contact: 'Revolutionary Inventory Team'
  });
});

// 🚫 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check /api for available endpoints'
  });
});

// 🚨 GLOBAL ERROR HANDLER
app.use((error, req, res, next) => {
  logger.error('Unhandled Error:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      details: error
    } : undefined
  });
});

// 🎬 SERVER STARTUP
async function startServer() {
  try {
    // Connect to database
    await DatabaseManager.connect();
    
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Revolutionary Inventory System started`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏢 Facility-First Architecture Enabled`);
      logger.info(`📖 API Documentation: http://localhost:${PORT}/api`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('🔄 SIGTERM received, shutting down gracefully');
      server.close(async () => {
        logger.info('🔒 HTTP server closed');
        await DatabaseManager.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚫 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
