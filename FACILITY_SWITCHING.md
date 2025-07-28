# Facility Switching System

## Overview

The inventory system now includes a comprehensive facility switching mechanism that allows users to seamlessly switch between different facilities, each with their own configuration and enabled features.

## Current Facilities

After running the mock facility creation script, we now have 5 diverse facilities:

1. **Revolutionary Warehouse 1 (RW001)** - Warehouse
2. **Main Warehouse (MAIN01)** - Warehouse  
3. **Downtown Retail Store (RETAIL01)** - Retail
4. **Central Distribution Hub (DIST01)** - Distribution
5. **Cold Storage Facility (COLD01)** - Warehouse

## Features by Facility Type

### Retail Facilities (RETAIL01)
- ✅ Products Management
- ✅ Inventory Tracking
- ✅ Expiry Tracking (important for retail)
- ❌ Analytics
- ❌ Sections
- ❌ Temperature Monitoring

### Distribution Facilities (DIST01)  
- ✅ Products Management
- ✅ Inventory Tracking
- ✅ Analytics (for logistics optimization)
- ✅ Sections (for organized distribution)
- ✅ Temperature Monitoring (for cold chain)
- ❌ Expiry Tracking

### Warehouse Facilities (RW001, MAIN01, COLD01)
- ✅ Products Management  
- ✅ Inventory Tracking
- ✅ Analytics
- ✅ Sections
- ❌ Expiry Tracking
- ❌ Temperature Monitoring

## How to Use Facility Switching

### 1. Facility Switcher Component
- Located in the sidebar at the top
- Shows current facility with icon, name, and code
- Click to expand and see all available facilities
- Each facility shows:
  - Facility icon (based on type)
  - Name and code
  - Type badge
  - Enabled features as tags
  - Location (if available)

### 2. Dashboard Integration
- Dashboard now shows facility-specific information
- Current facility details with enabled features
- Statistics are filtered by selected facility
- Visual indicators show which features are available

### 3. Menu Items Adaptation
- Sidebar menu items automatically show/hide based on facility features
- For example:
  - "Temperature Monitor" only appears for facilities with temperature monitoring
  - "Expiry Tracking" only appears for facilities with expiry management
  - "Analytics" only appears for facilities with analytics enabled

## Technical Implementation

### Backend Components

1. **Facility Model** (`models/Facility.js`)
   - Complete facility schema with features, location, settings
   - Feature flags for each capability
   - Instance methods for feature checking

2. **Facility Routes** (`routes/facilityRoutes.js`)
   - CRUD operations for facilities
   - Feature configuration endpoints
   - Facility listing with filtering

3. **Mock Data Script** (`create-mock-facilities.js`)
   - Creates diverse facility types for testing
   - Configures appropriate features per facility type
   - Populates realistic facility data

### Frontend Components

1. **FacilitySwitcher Component** (`components/FacilitySwitcher.jsx`)
   - Dropdown facility selector
   - Visual feature indicators
   - Responsive design with proper styling

2. **FacilityContext** (`contexts/FacilityContext.jsx`)
   - Global state management for current facility
   - Feature checking helper functions
   - localStorage persistence of selection

3. **Updated Sidebar** (`components/Sidebar.jsx`)
   - Integration with facility switcher
   - Feature-based menu visibility
   - Dynamic menu items based on facility capabilities

## Testing Different Configurations

### Test Scenario 1: Retail Store
1. Switch to "Downtown Retail Store (RETAIL01)"
2. Notice that "Temperature Monitor" disappears from menu
3. "Expiry Tracking" becomes available
4. Dashboard shows retail-specific features

### Test Scenario 2: Distribution Hub
1. Switch to "Central Distribution Hub (DIST01)"
2. Full feature set including temperature monitoring
3. Analytics and sections are available
4. Optimized for logistics operations

### Test Scenario 3: Cold Storage
1. Switch to "Cold Storage Facility (COLD01)"
2. Standard warehouse features
3. Temperature monitoring would be available (when feature implemented)
4. Designed for temperature-sensitive inventory

## API Endpoints

- `GET /api/facilities` - List all facilities
- `GET /api/facilities/:id` - Get specific facility
- `GET /api/facilities/:id/features` - Get facility features
- `POST /api/facilities` - Create new facility
- `PUT /api/facilities/:id` - Update facility
- `DELETE /api/facilities/:id` - Delete facility

## Feature Flags System

Each facility has a `features` object that controls which capabilities are enabled:

```javascript
features: {
  products: true,        // Always enabled
  inventory: true,       // Core inventory management
  analytics: false,      // Advanced analytics and reporting
  sections: false,       // Section/zone management
  expiry: false,         // Expiry date tracking
  temperature: false,    // Temperature monitoring
  barcodeScanning: false,// Barcode/QR code scanning
  rfid: false,          // RFID tracking
  qualityControl: false, // Quality control processes
  shipping: false,       // Shipping management
  receiving: false       // Receiving management
}
```

## Development Benefits

1. **Easy Testing**: Switch between facility types to test different feature combinations
2. **Realistic Scenarios**: Each facility type reflects real-world usage patterns
3. **Feature Validation**: Ensures features only appear when they should
4. **User Experience**: Provides clear visual feedback about facility capabilities
5. **Scalability**: Easy to add new facility types and features

## Future Enhancements

1. **Facility Management UI**: Admin interface for creating/editing facilities
2. **Feature Migrations**: Tools for enabling/disabling features per facility
3. **Multi-Facility Views**: Aggregate reporting across multiple facilities
4. **Facility Templates**: Pre-configured facility types for quick setup
5. **Facility Hierarchies**: Parent/child facility relationships

This facility switching system transforms the inventory management system from a single-facility solution into a true multi-facility platform that can adapt to different business needs and operational requirements.
