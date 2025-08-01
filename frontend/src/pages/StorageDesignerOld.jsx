import React, { useState, useEffect, useCallback } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';
import './StorageDesigner.css';

// Main Component
const StorageDesigner = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  // All hooks must be called before any early returns
  const [storageLayout, setStorageLayout] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [activeTab, setActiveTab] = useState('design'); // 'design', 'sections', 'placement', 'analytics'
  const [designMode, setDesignMode] = useState('view'); // 'view', 'edit', 'place'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Product placement state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  
  // Section management state
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  
  // Analytics state
  const [storageAnalytics, setStorageAnalytics] = useState({
    totalCapacity: 0,
    usedCapacity: 0,
    utilizationRate: 0,
    sectionsCount: 0,
    productsCount: 0
  });

  // Cleanup dialog state
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  // Define fetchStorageData function BEFORE useEffect using useCallback
  const fetchStorageData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      if (!facilityId) {
        throw new Error('No facility selected');
      }

      // Fetch storage layout from backend
      const layoutResponse = await fetch('http://localhost:5000/api/storage/layout', {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      let layoutData = null;
      if (!layoutResponse.ok) {
        console.warn('Storage layout API not available, creating empty layout');
        // Create minimal layout structure for Storage Designer to work
        layoutData = {
          facilityId,
          name: 'Storage Layout',
          dimensions: { width: 1000, height: 600 },
          warehouses: []
        };
      } else {
        const response = await layoutResponse.json();
        layoutData = response.data || response;
      }
      
      // Fetch storage utilization data
      const utilizationResponse = await fetch('http://localhost:5000/api/storage/utilization', {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      let utilizationData = null;
      if (utilizationResponse.ok) {
        utilizationData = await utilizationResponse.json();
      }

      // Fetch available products
      const productsResponse = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      let productsData = { data: [] };
      if (productsResponse.ok) {
        productsData = await productsResponse.json();
      }

      // Process and set the data
      setStorageLayout(layoutData);
      setAvailableProducts(productsData.data || []);
      
      // Create sections from layout data
      const sectionsFromLayout = layoutData.warehouses?.flatMap(warehouse => 
        warehouse.zones?.flatMap(zone => 
          zone.aisles?.flatMap(aisle => 
            aisle.shelves?.map(shelf => ({
              id: shelf.id,
              name: shelf.name,
              capacity: 100, // Default capacity, should come from backend
              used: Math.floor(Math.random() * 100), // Placeholder, should come from backend
              products: [], // Should come from backend
              zone: zone.name,
              aisle: aisle.name,
              coordinates: { x: shelf.x, y: shelf.y, width: shelf.width, height: shelf.height }
            })) || []
          ) || []
        ) || []
      ) || [];

      setSections(sectionsFromLayout);
      
      // Calculate analytics from real data
      const totalCapacity = sectionsFromLayout.reduce((sum, section) => sum + section.capacity, 0);
      const usedCapacity = sectionsFromLayout.reduce((sum, section) => sum + section.used, 0);
      const utilizationRate = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

      setStorageAnalytics({
        totalCapacity,
        usedCapacity,
        utilizationRate: Math.round(utilizationRate),
        sectionsCount: sectionsFromLayout.length,
        productsCount: productsData.data?.length || 0
      });

    } catch (err) {
      setError(`Failed to load storage data: ${err.message}`);
      console.error('Error fetching storage data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFacility, setLoading, setError, setStorageLayout, setAvailableProducts, setSections, setStorageAnalytics]);

  // Database cleanup function
  const handleDatabaseCleanup = async () => {
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      const response = await fetch('http://localhost:5000/api/storage/cleanup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup database');
      }

      const result = await response.json();
      alert(`Database cleanup successful! Sections cleared for facility.`);
      
      // Refresh data after cleanup
      await fetchStorageData();
      setShowCleanupDialog(false);
    } catch (error) {
      console.error('Error cleaning up database:', error);
      alert(`Failed to cleanup database: ${error.message}`);
    }
  };

  // Fetch storage layout and related data - NOW function is defined above
  useEffect(() => {
    if (currentFacility) {
      fetchStorageData();
    }
  }, [currentFacility, fetchStorageData]);

  // Show loading while features are loading
  if (featuresLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Storage Designer...</p>
        </div>
      </div>
    );
  }

  // Check if Storage Designer feature is enabled
  if (!isFeatureEnabled('storage-designer')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Storage Designer Disabled</h1>
          <p className="text-gray-600">The Storage Designer feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleProductPlacement = async (productId, locationData) => {
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      const response = await fetch(`http://localhost:5000/api/storage/products/${productId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        },
        body: JSON.stringify({
          warehouse: locationData.warehouse || 'Main Warehouse',
          zone: locationData.zone || '',
          aisle: locationData.aisle || '',
          shelf: locationData.shelf || '',
          bin: locationData.bin || '',
          coordinates: locationData.coordinates || { x: 0, y: 0, z: 0 }
        })
      });

      if (response.ok) {
        // Refresh storage data to reflect the change
        await fetchStorageData();
        alert('Product placed successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place product');
      }
    } catch (err) {
      console.error('Error placing product:', err);
      alert(`Failed to place product: ${err.message}`);
    }
  };

  const handleLayoutUpdate = async (updatedLayout) => {
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      const response = await fetch('http://localhost:5000/api/storage/layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        },
        body: JSON.stringify(updatedLayout)
      });

      if (response.ok) {
        setStorageLayout(updatedLayout);
        alert('Layout updated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update layout');
      }
    } catch (err) {
      console.error('Error updating layout:', err);
      alert(`Failed to update layout: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Storage Designer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Storage</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStorageData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Storage Designer</h1>
              <p className="text-gray-600">
                Design and manage your warehouse storage layout - {currentFacility?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Database Cleanup Button */}
              <button
                onClick={() => setShowCleanupDialog(true)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Cleanup DB</span>
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    viewMode === '2d' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2D View
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    viewMode === '3d' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3D View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('design')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'design'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎨 Layout Design
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📦 Section Management
            </button>
            <button
              onClick={() => setActiveTab('placement')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'placement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📍 Product Placement
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Storage Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Database Cleanup Confirmation Dialog */}
      {showCleanupDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h4 className="text-lg font-medium mb-4 text-red-600">⚠️ Database Cleanup</h4>
            <p className="text-sm text-gray-600 mb-4">
              This will remove all saved sections from the database for the current facility. 
              Products will be unassigned from their storage locations.
            </p>
            <p className="text-sm font-medium text-red-600 mb-4">
              This action cannot be undone!
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDatabaseCleanup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm Cleanup
              </button>
              <button
                onClick={() => setShowCleanupDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'design' && (
          <DesignTab 
            storageLayout={storageLayout}
            setStorageLayout={setStorageLayout}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            viewMode={viewMode}
            designMode={designMode}
            setDesignMode={setDesignMode}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            handleLocationClick={handleLocationClick}
            handleLayoutUpdate={handleLayoutUpdate}
          />
        )}
        
        {activeTab === 'sections' && (
          <SectionManagementTab 
            sections={sections}
            setSections={setSections}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            storageLayout={storageLayout}
            setStorageLayout={setStorageLayout}
            handleLayoutUpdate={handleLayoutUpdate}
          />
        )}
        
        {activeTab === 'placement' && (
          <ProductPlacementTab 
            availableProducts={availableProducts}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            storageLayout={storageLayout}
            sections={sections}
            handleProductPlacement={handleProductPlacement}
          />
        )}
        
        {activeTab === 'analytics' && (
          <StorageAnalyticsTab 
            storageAnalytics={storageAnalytics}
            storageLayout={storageLayout}
            availableProducts={availableProducts}
          />
        )}
      </div>
    </div>
  );
};

// Tab Components
const DesignTab = ({ 
  storageLayout, setStorageLayout, selectedLocation, setSelectedLocation, 
  viewMode, designMode, setDesignMode, selectedProduct, setSelectedProduct, 
  handleLocationClick, handleLayoutUpdate 
}) => {
  return (
    <div>
      {/* Design Mode Controls */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Layout Design</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDesignMode('view')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                designMode === 'view' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👁️ View
            </button>
            <button
              onClick={() => setDesignMode('edit')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                designMode === 'edit' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Side Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            {designMode === 'edit' ? (
              <LayoutEditPanel 
                layout={storageLayout}
                selectedLocation={selectedLocation}
                onLayoutChange={setStorageLayout}
              />
            ) : (
              <StorageInfoPanel 
                layout={storageLayout}
                selectedLocation={selectedLocation}
              />
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {viewMode === '2d' ? (
              <Storage2DCanvas 
                layout={storageLayout}
                selectedLocation={selectedLocation}
                onLocationClick={handleLocationClick}
                designMode={designMode}
                selectedProduct={selectedProduct}
              />
            ) : (
              <Storage3DCanvas 
                layout={storageLayout}
                selectedLocation={selectedLocation}
                onLocationClick={handleLocationClick}
                designMode={designMode}
                selectedProduct={selectedProduct}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionManagementTab = ({ sections, setSections, selectedSection, setSelectedSection, storageLayout, setStorageLayout, handleLayoutUpdate }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [viewingProducts, setViewingProducts] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionCapacity, setSectionCapacity] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionName(section.name);
    setSectionCapacity(section.capacity?.toString() || '100');
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    try {
      const updatedSection = {
        ...editingSection,
        name: sectionName,
        capacity: parseInt(sectionCapacity)
      };

      // Update sections array
      const updatedSections = sections.map(section => 
        section.id === editingSection.id ? updatedSection : section
      );
      setSections(updatedSections);

      // Update layout if needed
      if (handleLayoutUpdate) {
        const updatedLayout = { ...storageLayout };
        updatedLayout.warehouses = storageLayout.warehouses?.map(warehouse => ({
          ...warehouse,
          zones: warehouse.zones?.map(zone => ({
            ...zone,
            aisles: zone.aisles?.map(aisle => ({
              ...aisle,
              shelves: aisle.shelves?.map(shelf => 
                shelf.id === editingSection.id ? updatedSection : shelf
              )
            }))
          }))
        }));
        await handleLayoutUpdate(updatedLayout);
      }

      setEditingSection(null);
      setSectionName('');
      setSectionCapacity('');
      alert('Section updated successfully!');
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section');
    }
  };

  const handleViewProducts = (section) => {
    // For demo purposes, create mock products for the section
    const sectionProducts = [
      {
        _id: '1',
        name: 'Product A',
        sku: 'SKU-001',
        quantity: 25,
        price: 19.99,
        storageLocation: section.name
      },
      {
        _id: '2',
        name: 'Product B',
        sku: 'SKU-002',
        quantity: 15,
        price: 29.99,
        storageLocation: section.name
      }
    ];
    setViewingProducts({ section, products: sectionProducts });
  };

  const handleRemoveSection = async (section) => {
    if (!confirm(`Are you sure you want to remove section "${section.name}"?`)) return;

    try {
      // Remove from sections array
      const updatedSections = sections.filter(s => s.id !== section.id);
      setSections(updatedSections);

      // Update layout if needed
      if (handleLayoutUpdate) {
        const updatedLayout = { ...storageLayout };
        updatedLayout.warehouses = storageLayout.warehouses?.map(warehouse => ({
          ...warehouse,
          zones: warehouse.zones?.map(zone => ({
            ...zone,
            aisles: zone.aisles?.map(aisle => ({
              ...aisle,
              shelves: aisle.shelves?.filter(shelf => shelf.id !== section.id)
            }))
          }))
        }));
        await handleLayoutUpdate(updatedLayout);
      }

      if (selectedSection?.id === section.id) {
        setSelectedSection(null);
      }

      alert('Section removed successfully!');
    } catch (error) {
      console.error('Error removing section:', error);
      alert('Failed to remove section');
    }
  };

  const handleAddSection = async () => {
    if (!sectionName.trim()) {
      alert('Please enter a section name');
      return;
    }

    try {
      // Calculate proper grid position for new section
      const existingSections = sections || [];
      const gridSize = 80;
      const spacing = 20;
      const startX = 50;
      const startY = 50;
      const maxCols = 10;
      
      // Find next available position in grid
      let x = startX, y = startY;
      let row = 0, col = 0;
      
      while (true) {
        const testX = startX + (col * (gridSize + spacing));
        const testY = startY + (row * (gridSize + spacing));
        
        const occupied = existingSections.some(section => 
          Math.abs((section.x || 0) - testX) < gridSize && 
          Math.abs((section.y || 0) - testY) < gridSize
        );
        
        if (!occupied) {
          x = testX;
          y = testY;
          break;
        }
        
        col++;
        if (col >= maxCols) {
          col = 0;
          row++;
        }
        
        // Prevent infinite loop
        if (row > 20) break;
      }

      const newSection = {
        id: `section-${Date.now()}`,
        name: sectionName,
        capacity: parseInt(sectionCapacity) || 100,
        used: 0,
        zone: 'Zone A',
        aisle: 'Aisle A1',
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        products: []
      };

      // Add to sections array
      setSections(prev => [...prev, newSection]);

      // Update layout if needed
      if (handleLayoutUpdate) {
        const updatedLayout = { ...storageLayout };
        if (!updatedLayout.warehouses?.[0]?.zones?.[0]?.aisles?.[0]?.shelves) {
          // Create basic structure if it doesn't exist
          if (!updatedLayout.warehouses) updatedLayout.warehouses = [];
          if (!updatedLayout.warehouses[0]) {
            updatedLayout.warehouses[0] = {
              id: 'wh-001',
              name: 'Main Warehouse',
              x: 50, y: 50, width: 900, height: 500,
              zones: []
            };
          }
          if (!updatedLayout.warehouses[0].zones[0]) {
            updatedLayout.warehouses[0].zones[0] = {
              id: 'zone-a',
              name: 'Zone A',
              x: 50, y: 50, width: 400, height: 200,
              aisles: []
            };
          }
          if (!updatedLayout.warehouses[0].zones[0].aisles[0]) {
            updatedLayout.warehouses[0].zones[0].aisles[0] = {
              id: 'aisle-a1',
              name: 'Aisle A1',
              x: 20, y: 20, width: 360, height: 40,
              shelves: []
            };
          }
        }
        updatedLayout.warehouses[0].zones[0].aisles[0].shelves.push(newSection);
        await handleLayoutUpdate(updatedLayout);
      }

      setSectionName('');
      setSectionCapacity('100');
      setIsAddingSection(false);
      alert('Section added successfully!');
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Section Management</h2>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={() => setIsAddingSection(true)}
          >
            ➕ Add Section
          </button>
        </div>

        {/* Add Section Modal */}
        {isAddingSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h4 className="text-lg font-medium mb-4">Add New Section</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section Name</label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter section name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={sectionCapacity}
                    onChange={(e) => setSectionCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="100"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddSection}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Section
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingSection(false);
                      setSectionName('');
                      setSectionCapacity('100');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Section Modal */}
        {editingSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h4 className="text-lg font-medium mb-4">Edit Section</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section Name</label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={sectionCapacity}
                    onChange={(e) => setSectionCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveSection}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      setSectionName('');
                      setSectionCapacity('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Products Modal */}
        {viewingProducts && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-2/3 max-w-4xl max-h-3/4 overflow-y-auto">
              <h4 className="text-lg font-medium mb-4">
                Products in {viewingProducts.section.name}
              </h4>
              {viewingProducts.products.length > 0 ? (
                <div className="space-y-3">
                  {viewingProducts.products.map(product => (
                    <div key={product._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <h5 className="font-medium">{product.name}</h5>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Location: {product.storageLocation}</p>
                        <p className="text-sm text-gray-600">Price: ${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No products found in this section</p>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingProducts(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(section => (
            <div key={section.id} 
                 className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                   selectedSection?.id === section.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                 }`}
                 onClick={() => setSelectedSection(section)}>
              <h3 className="font-medium text-gray-900">{section.name}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Zone: {section.zone || 'N/A'}</p>
                <p>Aisle: {section.aisle || 'N/A'}</p>
                <p>Capacity: {section.used}/{section.capacity}</p>
                <p>Products: {section.products?.length || 0}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{width: `${Math.min((section.used/section.capacity)*100, 100)}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((section.used/section.capacity)*100)}% utilized
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Section Details Panel */}
        {selectedSection && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Section Details: {selectedSection.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Properties</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Zone:</span> {selectedSection.zone || 'N/A'}</p>
                  <p><span className="font-medium">Aisle:</span> {selectedSection.aisle || 'N/A'}</p>
                  <p><span className="font-medium">Capacity:</span> {selectedSection.capacity}</p>
                  <p><span className="font-medium">Current Usage:</span> {selectedSection.used}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleEditSection(selectedSection)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Edit Section
                  </button>
                  <button 
                    onClick={() => handleViewProducts(selectedSection)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    View Products
                  </button>
                  <button 
                    onClick={() => handleRemoveSection(selectedSection)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductPlacementTab = ({ 
  availableProducts, selectedProduct, setSelectedProduct, 
  productSearch, setProductSearch, storageLayout, sections, handleProductPlacement
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [placementMode, setPlacementMode] = useState('single'); // 'single', 'multi', 'batch'
  const [showPlacementDialog, setShowPlacementDialog] = useState(false);
  const [targetSection, setTargetSection] = useState(null);
  const [selectedBatches, setSelectedBatches] = useState([]);

  // Group products by batch
  const productBatches = availableProducts.reduce((batches, product) => {
    const batchKey = product.batchId || product.batch || (product.sku ? product.sku.split('-').slice(0, -1).join('-') : 'unknown');
    if (batchKey && batchKey !== 'unknown') {
      if (!batches[batchKey]) {
        batches[batchKey] = [];
      }
      batches[batchKey].push(product);
    }
    return batches;
  }, {});

  const filteredProducts = availableProducts.filter(product =>
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.batchId?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.batch?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleProductSelect = (product) => {
    if (placementMode === 'multi') {
      setSelectedProducts(prev => {
        const exists = prev.find(p => p._id === product._id);
        if (exists) {
          return prev.filter(p => p._id !== product._id);
        } else {
          return [...prev, product];
        }
      });
    } else {
      setSelectedProduct(product);
    }
  };

  const handleBatchSelect = (batchId) => {
    setSelectedBatches(prev => {
      if (prev.includes(batchId)) {
        return prev.filter(id => id !== batchId);
      } else {
        return [...prev, batchId];
      }
    });
  };

  const handleSectionClick = async (section) => {
    if (placementMode === 'multi' && selectedProducts.length > 0) {
      setTargetSection(section);
      setShowPlacementDialog(true);
    } else if (placementMode === 'batch' && selectedBatches.length > 0) {
      setTargetSection(section);
      setShowPlacementDialog(true);
    } else if (placementMode === 'single' && selectedProduct) {
      const locationData = {
        warehouse: 'Main Warehouse',
        zone: section.zone || '',
        aisle: section.aisle || '',
        shelf: section.name || section.id,
        bin: '',
        coordinates: section.coordinates || { x: 0, y: 0, z: 0 }
      };

      await handleProductPlacement(selectedProduct._id || selectedProduct.id, locationData);
    } else {
      alert('Please select products/batches first');
    }
  };

  const handlePlacement = async () => {
    if (!targetSection) return;

    try {
      const locationData = {
        warehouse: 'Main Warehouse',
        zone: targetSection.zone || '',
        aisle: targetSection.aisle || '',
        shelf: targetSection.name || targetSection.id,
        bin: '',
        coordinates: targetSection.coordinates || { x: 0, y: 0, z: 0 }
      };

      if (placementMode === 'multi') {
        // Place selected individual products
        for (const product of selectedProducts) {
          await handleProductPlacement(product._id || product.id, locationData);
        }
        setSelectedProducts([]);
        alert(`Successfully placed ${selectedProducts.length} products in ${targetSection.name}`);
      } else if (placementMode === 'batch') {
        // Place all products from selected batches
        let totalPlaced = 0;
        for (const batchId of selectedBatches) {
          const batchProducts = productBatches[batchId] || [];
          for (const product of batchProducts) {
            await handleProductPlacement(product._id || product.id, locationData);
            totalPlaced++;
          }
        }
        setSelectedBatches([]);
        alert(`Successfully placed ${totalPlaced} products from ${selectedBatches.length} batches in ${targetSection.name}`);
      }

      setShowPlacementDialog(false);
      setTargetSection(null);
    } catch (error) {
      console.error('Error placing products:', error);
      alert('Failed to place products');
    }
  };

  const clearSelections = () => {
    setSelectedProducts([]);
    setSelectedProduct(null);
    setSelectedBatches([]);
  };

  const getSelectedCount = () => {
    if (placementMode === 'single') return selectedProduct ? 1 : 0;
    if (placementMode === 'multi') return selectedProducts.length;
    if (placementMode === 'batch') {
      return selectedBatches.reduce((total, batchId) => {
        return total + (productBatches[batchId]?.length || 0);
      }, 0);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Placement Mode</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={placementMode === 'single'}
                onChange={() => {
                  setPlacementMode('single');
                  clearSelections();
                }}
                className="text-blue-600"
              />
              <span>Single Product</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={placementMode === 'multi'}
                onChange={() => {
                  setPlacementMode('multi');
                  clearSelections();
                }}
                className="text-blue-600"
              />
              <span>Multi-Select</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={placementMode === 'batch'}
                onChange={() => {
                  setPlacementMode('batch');
                  clearSelections();
                }}
                className="text-blue-600"
              />
              <span>Batch Mode</span>
            </label>
          </div>
        </div>

        {getSelectedCount() > 0 && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-800">
              {getSelectedCount()} {getSelectedCount() === 1 ? 'product' : 'products'} selected
            </p>
            <button
              onClick={clearSelections}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product/Batch Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {placementMode === 'batch' ? 'Select Batches' : 'Select Products'}
            </h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder={placementMode === 'batch' ? 'Search batches...' : 'Search products...'}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {placementMode === 'batch' ? (
                // Batch selection
                Object.entries(productBatches).map(([batchId, batchProducts]) => {
                  const isSelected = selectedBatches.includes(batchId);
                  return (
                    <div
                      key={batchId}
                      onClick={() => handleBatchSelect(batchId)}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Batch: {batchId}</h4>
                          <p className="text-sm text-gray-600">{batchProducts.length} products</p>
                          <p className="text-sm text-gray-500">
                            Total Qty: {batchProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="ml-2"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                // Product selection
                filteredProducts.map(product => {
                  const isSelected = placementMode === 'multi'
                    ? selectedProducts.find(p => p._id === product._id)
                    : selectedProduct?._id === product._id;
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                          {(product.batchId || product.batch) && (
                            <p className="text-sm text-purple-600">Batch: {product.batchId || product.batch}</p>
                          )}
                        </div>
                        {placementMode === 'multi' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="ml-2"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Storage Layout Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Storage Layout - {placementMode === 'single' ? 'Single Placement' : 
                             placementMode === 'multi' ? 'Multi Placement' : 'Batch Placement'}
            </h3>
            
            {getSelectedCount() > 0 ? (
              <div className="mb-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  Ready to place {getSelectedCount()} {getSelectedCount() === 1 ? 'product' : 'products'}. 
                  Click on a section below.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  Select {placementMode === 'batch' ? 'batches' : 'products'} to place them in storage.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sections.map(section => (
                <div
                  key={section.id}
                  onClick={() => handleSectionClick(section)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{section.name}</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Available: {(section.capacity || 0) - (section.used || 0)}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${Math.min(((section.used || 0)/(section.capacity || 1))*100, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Placement Confirmation Dialog */}
      {showPlacementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md">
            <h4 className="text-lg font-medium mb-4">Confirm Placement</h4>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to place {getSelectedCount()} {getSelectedCount() === 1 ? 'product' : 'products'} in "{targetSection?.name}"?
            </p>
            
            <div className="max-h-48 overflow-y-auto mb-4 border rounded-md p-3">
              {placementMode === 'multi' && selectedProducts.map(product => (
                <div key={product._id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{product.name}</span>
                  <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                </div>
              ))}
              {placementMode === 'batch' && selectedBatches.map(batchId => (
                <div key={batchId} className="py-1">
                  <div className="font-medium text-sm">Batch: {batchId}</div>
                  {productBatches[batchId]?.map(product => (
                    <div key={product._id} className="flex justify-between items-center py-1 ml-4">
                      <span className="text-xs">{product.name}</span>
                      <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePlacement}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm Placement
              </button>
              <button
                onClick={() => {
                  setShowPlacementDialog(false);
                  setTargetSection(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StorageAnalyticsTab = ({ storageAnalytics, storageLayout, availableProducts }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📦</div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500">Total Capacity</h3>
              <p className="text-2xl font-bold text-gray-900">{storageAnalytics.totalCapacity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📊</div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500">Used Capacity</h3>
              <p className="text-2xl font-bold text-gray-900">{storageAnalytics.usedCapacity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📈</div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500">Utilization Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{storageAnalytics.utilizationRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">🏗️</div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500">Sections</h3>
              <p className="text-2xl font-bold text-gray-900">{storageAnalytics.sectionsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Utilization Over Time</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ProductPlacementPanel = ({ products, selectedProduct, onProductSelect, searchQuery, onSearchChange }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Available Products</h3>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => onProductSelect(product)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedProduct?.id === product.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <h4 className="font-medium text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            <p className="text-sm text-gray-500">{product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const LayoutEditPanel = ({ layout, selectedLocation, onLayoutChange }) => {
  const [editingProperties, setEditingProperties] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationCapacity, setLocationCapacity] = useState('');

  useEffect(() => {
    if (selectedLocation) {
      setLocationName(selectedLocation.name || '');
      setLocationCapacity(selectedLocation.capacity || '100');
    }
  }, [selectedLocation]);

  const handleEditProperties = () => {
    setEditingProperties(true);
  };

  const handleSaveProperties = async () => {
    if (!selectedLocation) return;
    
    try {
      // Create updated location data
      const updatedLocation = {
        ...selectedLocation,
        name: locationName,
        capacity: parseInt(locationCapacity)
      };

      // Update the layout
      const updatedLayout = { ...layout };
      // Find and update the specific location in the layout structure
      updatedLayout.warehouses = layout.warehouses?.map(warehouse => ({
        ...warehouse,
        zones: warehouse.zones?.map(zone => ({
          ...zone,
          aisles: zone.aisles?.map(aisle => ({
            ...aisle,
            shelves: aisle.shelves?.map(shelf => 
              shelf.id === selectedLocation.id ? updatedLocation : shelf
            )
          }))
        }))
      }));

      await onLayoutChange(updatedLayout);
      setEditingProperties(false);
      alert('Properties updated successfully!');
    } catch (error) {
      console.error('Error updating properties:', error);
      alert('Failed to update properties');
    }
  };

  const handleAddSection = async () => {
    if (!layout) return;

    const sectionName = prompt('Enter section name:');
    if (!sectionName) return;

    const sectionCapacity = prompt('Enter section capacity:', '100');
    if (!sectionCapacity) return;

    try {
      const newSection = {
        id: `shelf-new-${Date.now()}`,
        name: sectionName,
        capacity: parseInt(sectionCapacity),
        used: 0,
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: 80,
        height: 40
      };

      // Add to the first zone's first aisle (or create structure if needed)
      const updatedLayout = { ...layout };
      if (!updatedLayout.warehouses?.[0]?.zones?.[0]?.aisles?.[0]?.shelves) {
        // Create basic structure if it doesn't exist
        if (!updatedLayout.warehouses) updatedLayout.warehouses = [];
        if (!updatedLayout.warehouses[0]) {
          updatedLayout.warehouses[0] = {
            id: 'wh-001',
            name: 'Main Warehouse',
            x: 50, y: 50, width: 900, height: 500,
            zones: []
          };
        }
        if (!updatedLayout.warehouses[0].zones[0]) {
          updatedLayout.warehouses[0].zones[0] = {
            id: 'zone-a',
            name: 'Zone A',
            x: 50, y: 50, width: 400, height: 200,
            aisles: []
          };
        }
        if (!updatedLayout.warehouses[0].zones[0].aisles[0]) {
          updatedLayout.warehouses[0].zones[0].aisles[0] = {
            id: 'aisle-a1',
            name: 'Aisle A1',
            x: 20, y: 20, width: 360, height: 40,
            shelves: []
          };
        }
      }

      updatedLayout.warehouses[0].zones[0].aisles[0].shelves.push(newSection);
      await onLayoutChange(updatedLayout);
      alert('Section added successfully!');
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section');
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation || !layout) return;

    if (!confirm(`Are you sure you want to delete "${selectedLocation.name}"?`)) return;

    try {
      // Remove the location from the layout
      const updatedLayout = { ...layout };
      updatedLayout.warehouses = layout.warehouses?.map(warehouse => ({
        ...warehouse,
        zones: warehouse.zones?.map(zone => ({
          ...zone,
          aisles: zone.aisles?.map(aisle => ({
            ...aisle,
            shelves: aisle.shelves?.filter(shelf => shelf.id !== selectedLocation.id)
          }))
        }))
      }));

      await onLayoutChange(updatedLayout);
      alert('Section deleted successfully!');
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Layout</h3>
      
      {selectedLocation ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Selected: {selectedLocation.name}</h4>
          
          {editingProperties ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  value={locationCapacity}
                  onChange={(e) => setLocationCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleSaveProperties}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingProperties(false)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={handleEditProperties}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Properties
              </button>
              <button 
                onClick={handleAddSection}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Section
              </button>
              <button 
                onClick={handleDelete}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>Select a location to edit</p>
          <button 
            onClick={handleAddSection}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add New Section
          </button>
        </div>
      )}
    </div>
  );
};

const StorageInfoPanel = ({ layout, selectedLocation }) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Information</h3>
      
      {selectedLocation ? (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-700">Name</h4>
            <p className="text-gray-600">{selectedLocation.name}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Type</h4>
            <p className="text-gray-600">{selectedLocation.type}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Capacity</h4>
            <p className="text-gray-600">{selectedLocation.used}/{selectedLocation.capacity}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Utilization</h4>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{width: `${(selectedLocation.used/selectedLocation.capacity)*100}%`}}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round((selectedLocation.used/selectedLocation.capacity)*100)}%
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>Click on a storage location to view details</p>
        </div>
      )}
    </div>
  );
};

const Storage2DCanvas = ({ layout, selectedLocation, onLocationClick, designMode, selectedProduct }) => {
  const renderStorageElements = () => {
    if (!layout?.warehouses) return null;

    const elements = [];
    
    layout.warehouses.forEach(warehouse => {
      // Render warehouse boundary
      elements.push(
        <div
          key={`warehouse-${warehouse.id}`}
          className="absolute border-2 border-gray-600 bg-gray-100 opacity-30"
          style={{
            left: `${(warehouse.x / layout.dimensions.width) * 100}%`,
            top: `${(warehouse.y / layout.dimensions.height) * 100}%`,
            width: `${(warehouse.width / layout.dimensions.width) * 100}%`,
            height: `${(warehouse.height / layout.dimensions.height) * 100}%`
          }}
        />
      );

      // Render zones
      warehouse.zones?.forEach(zone => {
        const zoneX = warehouse.x + zone.x;
        const zoneY = warehouse.y + zone.y;
        
        elements.push(
          <div
            key={`zone-${zone.id}`}
            className="absolute border border-blue-400 bg-blue-50 opacity-50"
            style={{
              left: `${(zoneX / layout.dimensions.width) * 100}%`,
              top: `${(zoneY / layout.dimensions.height) * 100}%`,
              width: `${(zone.width / layout.dimensions.width) * 100}%`,
              height: `${(zone.height / layout.dimensions.height) * 100}%`
            }}
            title={zone.name}
          />
        );

        // Render aisles and shelves
        zone.aisles?.forEach(aisle => {
          const aisleX = zoneX + aisle.x;
          const aisleY = zoneY + aisle.y;

          aisle.shelves?.forEach(shelf => {
            const shelfX = aisleX + shelf.x;
            const shelfY = aisleY + shelf.y;
            
            elements.push(
              <div
                key={`shelf-${shelf.id}`}
                onClick={() => onLocationClick({
                  ...shelf,
                  warehouse: warehouse.name,
                  zone: zone.name,
                  aisle: aisle.name,
                  type: 'shelf'
                })}
                className={`absolute border-2 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-colors ${
                  selectedLocation?.id === shelf.id
                    ? 'border-green-500 bg-green-100 text-green-900'
                    : 'border-gray-400 bg-white hover:bg-gray-100 hover:border-blue-400'
                }`}
                style={{
                  left: `${(shelfX / layout.dimensions.width) * 100}%`,
                  top: `${(shelfY / layout.dimensions.height) * 100}%`,
                  width: `${(shelf.width / layout.dimensions.width) * 100}%`,
                  height: `${(shelf.height / layout.dimensions.height) * 100}%`,
                  minWidth: '40px',
                  minHeight: '30px'
                }}
                title={`${shelf.name} (${zone.name} - ${aisle.name})`}
              >
                {shelf.name}
              </div>
            );
          });
        });
      });
    });

    return elements;
  };

  return (
    <div className="p-6 h-96">
      <h3 className="text-lg font-medium text-gray-900 mb-4">2D Storage Layout</h3>
      <div className="border border-gray-300 rounded-lg h-full relative bg-gray-50 overflow-hidden">
        {renderStorageElements()}
        
        {/* Legend */}
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-sm p-2 text-xs">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 border border-gray-400 bg-white mr-2"></div>
            <span>Shelf</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 border border-blue-400 bg-blue-50 mr-2"></div>
            <span>Zone</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-green-500 bg-green-100 mr-2"></div>
            <span>Selected</span>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-2 left-2 bg-white rounded-lg shadow-sm p-2 text-xs text-gray-600">
          {selectedProduct ? `Click on a shelf to place ${selectedProduct.name}` : 'Click on shelves to view details'}
        </div>
      </div>
    </div>
  );
};

const Storage3DCanvas = ({ layout, selectedLocation, onLocationClick, designMode, selectedProduct }) => {
  return (
    <div className="p-6 h-96">
      <h3 className="text-lg font-medium text-gray-900 mb-4">3D Storage Layout</h3>
      <div className="border border-gray-300 rounded-lg h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🏗️</div>
          <p>3D Visualization</p>
          <p className="text-sm">Interactive 3D layout would be rendered here</p>
        </div>
      </div>
    </div>
  );
};

export default StorageDesigner;
