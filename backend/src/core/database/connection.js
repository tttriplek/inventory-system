const mongoose = require('mongoose');
const logger = require('../../utils/logger');

/**
 * Professional Database Connection Manager
 * 
 * Handles MongoDB connection with proper error handling,
 * reconnection logic, and production-ready settings.
 */
class DatabaseManager {
  
  static async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/revolutionary_inventory';
      
      const options = {
        // Connection settings
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        
        // Indexing
        autoIndex: process.env.NODE_ENV !== 'production'
      };

      mongoose.set('strictQuery', false);
      
      await mongoose.connect(uri, options);
      
      logger.info('🗄️  Database connected successfully');
      logger.info(`📍 Database: ${mongoose.connection.name}`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  static setupEventListeners() {
    const db = mongoose.connection;

    db.on('connected', () => {
      logger.info('🔗 Mongoose connected to MongoDB');
    });

    db.on('error', (error) => {
      logger.error('🚨 Mongoose connection error:', error);
    });

    db.on('disconnected', () => {
      logger.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await db.close();
        logger.info('🔒 Database connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during database shutdown:', error);
        process.exit(1);
      }
    });
  }

  static async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('🔒 Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  static getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = DatabaseManager;
