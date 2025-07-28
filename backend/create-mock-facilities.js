const mongoose = require('mongoose');
const Facility = require('./src/core/facility/Facility');

async function createMockFacilities() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/revolutionary_inventory');
    console.log('✅ Connected to MongoDB');

    // Create different types of facilities for testing
    const mockFacilities = [
      {
        name: 'Downtown Retail Store',
        code: 'RETAIL01',
        type: 'retail',
        location: {
          address: '456 Commerce St',
          city: 'Downtown',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contact: {
          email: 'retail@example.com',
          phone: '+1-555-0124'
        }
      },
      {
        name: 'Central Distribution Hub',
        code: 'DIST01',
        type: 'distribution',
        location: {
          address: '789 Logistics Blvd',
          city: 'Central City',
          state: 'TX',
          zipCode: '75001',
          country: 'USA'
        },
        contact: {
          email: 'distribution@example.com',
          phone: '+1-555-0125'
        }
      },
      {
        name: 'Cold Storage Facility',
        code: 'COLD01',
        type: 'warehouse',
        location: {
          address: '321 Frozen Way',
          city: 'Cooltown',
          state: 'WA',
          zipCode: '98001',
          country: 'USA'
        },
        contact: {
          email: 'coldstorage@example.com',
          phone: '+1-555-0126'
        }
      }
    ];

    for (const facilityData of mockFacilities) {
      // Check if facility already exists
      const existing = await Facility.findOne({ code: facilityData.code });
      if (existing) {
        console.log(`✅ Facility ${facilityData.code} already exists`);
        continue;
      }

      // Get default features based on type
      const getDefaultFeatures = (type) => {
        const defaults = {
          warehouse: {
            products: { enabled: true },
            inventory: { enabled: true },
            analytics: { enabled: true },
            sections: { enabled: true },
            temperature: { enabled: false }
          },
          retail: {
            products: { enabled: true },
            inventory: { enabled: true },
            analytics: { enabled: true },
            expiry: { enabled: true },
            sections: { enabled: false }
          },
          distribution: {
            products: { enabled: true },
            inventory: { enabled: true },
            analytics: { enabled: true },
            temperature: { enabled: true },
            sections: { enabled: true }
          }
        };
        return defaults[type] || defaults.warehouse;
      };

      const facility = new Facility({
        ...facilityData,
        features: getDefaultFeatures(facilityData.type),
        businessRules: {
          lowStockThreshold: facilityData.type === 'retail' ? 5 : 20,
          reorderPoint: facilityData.type === 'retail' ? 10 : 50,
          maxOrderQuantity: 1000,
          allowNegativeStock: false
        }
      });

      await facility.save();
      console.log(`✅ Created ${facilityData.name} (${facilityData.code}) - ID: ${facility._id}`);
    }

    // List all facilities
    console.log('\n📋 All Facilities:');
    const allFacilities = await Facility.find({});
    allFacilities.forEach(f => {
      console.log(`- ${f.name} (${f.code}) - ${f.type} - ID: ${f._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createMockFacilities();
