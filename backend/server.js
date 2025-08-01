const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const features = require('./config/features');

// Import routes
const productRoutes = require('./routes/productRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const storageRoutes = require('./routes/storageRoutes');
// const ruleRoutes = require('./routes/ruleRoutes');
// const suggestionRoutes = require('./routes/suggestionRoutes');
// const storagePlanRoutes = require('./routes/storagePlanRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const facilityConfigRoutes = require('./routes/facilityConfigRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const featureRoutes = require('./routes/featureRoutes');

// Import new enterprise module routes
const notificationsRoutes = require('./src/modules/notifications/notificationsRoutes');
const financialRoutes = require('./src/modules/financial/financialRoutes');
const auditRoutes = require('./src/modules/audit/auditRoutes');

const app = express();

// CORS configuration for frontend
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Facility-ID']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json());

app.use('/api/sections', sectionRoutes);
app.use('/api/storage', storageRoutes);
// app.use('/api/rules', ruleRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/suggestions', suggestionRoutes);
// app.use('/api/storage-plan', storagePlanRoutes);
app.use('/api/facility-config', facilityConfigRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/features', featureRoutes);

// Enterprise module routes
app.use('/api/notifications', notificationsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/features', (req, res) => {
  res.json(features);
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/revolutionary_inventory')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(5000, () => console.log('Server running on port 5000'));
