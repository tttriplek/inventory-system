# Facility Key System Documentation

## Overview
The new facility key system groups facilities by type instead of using individual facility IDs for feature management. This provides better scalability and easier management of features across similar facilities.

## How It Works

### 1. Facility Keys
- **Standard Facilities**: Share the same key based on their type
  - `facility_warehouse` - All warehouse facilities
  - `facility_retail` - All retail facilities  
  - `facility_distribution` - All distribution facilities
  - `facility_manufacturing` - All manufacturing facilities
  - `facility_hybrid` - All hybrid facilities

- **Custom Facilities**: Get unique keys
  - `custom_{objectId}` - Each custom facility gets its own key

### 2. Feature Management

#### Standard Facilities
```javascript
// All warehouse facilities share the same features
PUT /api/features/standard/warehouse/features
{
  "features": {
    "productManagement": { "enabled": true },
    "storageDesigner": { "enabled": true }
  }
}
```

#### Custom Facilities  
```javascript
// Individual facility features (existing API)
PUT /api/features/facility/{facilityId}/toggles
{
  "features": {
    "productManagement": { "enabled": true }
  }
}
```

### 3. Database Schema Changes

#### Facility Model
```javascript
{
  // ... existing fields ...
  
  type: {
    type: String,
    enum: ['warehouse', 'retail', 'distribution', 'manufacturing', 'hybrid', 'custom']
  },
  
  // NEW: Facility key for feature grouping
  facilityKey: {
    type: String,
    required: true,
    index: true
  },
  
  // NEW: Whether this is a custom facility
  isCustomFacility: {
    type: Boolean,
    default: false
  }
}
```

### 4. Benefits

1. **Scalability**: Features can be managed for thousands of facilities of the same type
2. **Consistency**: All warehouses get the same feature set automatically
3. **Flexibility**: Custom facilities can still have unique configurations
4. **Performance**: Faster feature lookups using shared keys
5. **Management**: Easier to enable/disable features across facility types

### 5. Migration

Run the migration script to update existing facilities:
```bash
node src/scripts/migrateFacilityKeys.js
```

This will:
- Add `facilityKey` and `isCustomFacility` fields to existing facilities
- Group standard facilities by type
- Create unique keys for any custom facilities

### 6. API Endpoints

#### New Endpoints
- `GET /api/features/standard/{facilityType}/features` - Get features for a facility type
- `PUT /api/features/standard/{facilityType}/features` - Update features for all facilities of a type

#### Existing Endpoints (still work)
- `GET /api/features/facility/{facilityId}/toggles` - Get individual facility features
- `PUT /api/features/facility/{facilityId}/toggles` - Update individual facility features

### 7. Example Usage

```javascript
// Enable storage designer for all warehouse facilities
await fetch('/api/features/standard/warehouse/features', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    features: {
      storageDesigner: { enabled: true }
    }
  })
});

// This affects ALL warehouse facilities instantly
```

### 8. Backward Compatibility

The system maintains full backward compatibility:
- Existing API endpoints continue to work
- Individual facility feature overrides still function
- Current frontend code requires no changes

### 9. Feature Resolution Priority

1. **Custom Facility**: Uses its own unique feature configuration
2. **Standard Facility**: Uses the shared configuration for its type
3. **Fallback**: Uses default features if no configuration exists
