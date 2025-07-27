// Simple test to check our system
console.log('🚀 Starting Revolutionary Inventory System...');

try {
  console.log('📁 Current directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  
  // Test logger import
  const logger = require('./utils/logger');
  console.log('✅ Logger loaded successfully');
  
  // Test database connection
  const DatabaseManager = require('./core/database/connection');
  console.log('✅ Database manager loaded successfully');
  
  console.log('🎯 All core modules loaded successfully!');
  console.log('🏢 Revolutionary Facility-First Architecture Ready!');
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
  console.error('Stack:', error.stack);
}
