/**
 * Migration Script: Add Facility Keys to Existing Facilities
 * 
 * This script updates existing facilities to use the new facility key system:
 * - Standard facility types get shared keys (facility_warehouse, facility_retail, etc.)
 * - Custom facilities get unique keys (custom_[objectId])
 */

const mongoose = require('mongoose');
const Facility = require('../core/facility/Facility');

async function migrateFacilityKeys() {
  try {
    console.log('🔄 Starting facility key migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/revolutionary_inventory');
    console.log('✅ Connected to database');
    
    // Find all facilities without facility keys
    const facilitiesToUpdate = await Facility.find({
      $or: [
        { facilityKey: { $exists: false } },
        { facilityKey: null },
        { facilityKey: '' }
      ]
    });
    
    console.log(`📊 Found ${facilitiesToUpdate.length} facilities to update`);
    
    for (const facility of facilitiesToUpdate) {
      console.log(`🔧 Updating facility: ${facility.name} (${facility.code})`);
      
      // Determine if this should be a custom facility
      const isCustom = facility.type === 'custom' || 
                      facility.isCustomFacility === true ||
                      !['warehouse', 'retail', 'distribution', 'manufacturing', 'hybrid'].includes(facility.type);
      
      if (isCustom) {
        // Custom facility gets unique key
        facility.facilityKey = `custom_${facility._id}`;
        facility.isCustomFacility = true;
        console.log(`  → Custom key: ${facility.facilityKey}`);
      } else {
        // Standard facility gets shared key
        facility.facilityKey = `facility_${facility.type}`;
        facility.isCustomFacility = false;
        console.log(`  → Standard key: ${facility.facilityKey}`);
      }
      
      await facility.save();
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Summary report
    const standardFacilities = await Facility.find({ isCustomFacility: false });
    const customFacilities = await Facility.find({ isCustomFacility: true });
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Standard facilities: ${standardFacilities.length}`);
    console.log(`   Custom facilities: ${customFacilities.length}`);
    
    // Group standard facilities by type
    const facilitiesByType = {};
    standardFacilities.forEach(facility => {
      facilitiesByType[facility.type] = (facilitiesByType[facility.type] || 0) + 1;
    });
    
    console.log('\n🏢 Standard Facilities by Type:');
    Object.entries(facilitiesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} facilities → facility_${type}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFacilityKeys();
}

module.exports = migrateFacilityKeys;
