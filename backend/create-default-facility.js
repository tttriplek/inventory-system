const mongoose = require('mongoose');
const Facility = require('./src/core/facility/Facility');

async function createDefaultFacility() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/revolutionary_inventory');
    console.log('✅ Connected to MongoDB');

    // Check if main-warehouse facility already exists
    const existingFacility = await Facility.findOne({ code: 'MAIN01' });
    if (existingFacility) {
      console.log('✅ Main warehouse facility already exists with ID:', existingFacility._id);
      console.log('Use this ID in your frontend:', existingFacility._id.toString());
      process.exit(0);
    }

    // Create the main warehouse facility
    const facility = new Facility({
      name: 'Main Warehouse',
      code: 'MAIN01',
      type: 'warehouse',
      location: {
        address: '123 Main St',
        city: 'Sample City',
        state: 'Sample State',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        email: 'warehouse@example.com',
        phone: '+1-555-0123'
      },
      features: {
        products: { enabled: true },
        inventory: { enabled: true },
        analytics: { enabled: true },
        rules: { enabled: true },
        notifications: { enabled: true }
      },
      businessRules: {
        lowStockThreshold: 20,
        reorderPoint: 50,
        maxOrderQuantity: 1000,
        allowNegativeStock: false
      }
    });

    await facility.save();
    console.log('✅ Created main warehouse facility with ID:', facility._id);
    console.log('Use this ID in your frontend:', facility._id.toString());

  } catch (error) {
    console.error('❌ Error creating facility:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createDefaultFacility();
