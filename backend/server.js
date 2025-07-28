const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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

const app = express();
app.use(cors());
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

app.get('/api/features', (req, res) => {
  res.json(features);
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/revolutionary_inventory')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(5000, () => console.log('Server running on port 5000'));
