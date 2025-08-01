import React, { useState, useEffect, useCallback } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const StorageDesigner = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  // Main state
  const [activeTab, setActiveTab] = useState('design');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Layout state
  const [storageLayout, setStorageLayout] = useState({
    warehouses: [],
    zones: [],
    aisles: [],
    bins: []
  });
  
  // Products state
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  
  // Section management state
  const [sections, setSections] = useState([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    type: 'bin', // warehouse, zone, aisle, bin
    capacity: 100,
    parentId: null
  });

  // Lazy load products - only when needed
  const fetchProducts = useCallback(async () => {
    if (availableProducts.length > 0) return; // Already loaded
    
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      if (!facilityId) return;

      const productsResponse = await fetch('http://localhost:5000/api/products/grouped', {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setAvailableProducts(productsData.data || []);
        
        // Extract batches from products
        const allBatches = [];
        (productsData.data || []).forEach(product => {
          if (product.batches && Array.isArray(product.batches)) {
            product.batches.forEach(batch => {
              allBatches.push({
                ...batch,
                productId: product._id,
                productName: product.name,
                sku: product.sku
              });
            });
          }
        });
        setAvailableBatches(allBatches);
      }
    } catch (err) {
      console.warn('Failed to fetch products:', err);
    }
  }, [currentFacility, availableProducts.length]);

  // Fetch essential data only
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      if (!facilityId) {
        throw new Error('No facility selected');
      }

      // Only fetch layout initially
      try {
        const layoutResponse = await fetch('http://localhost:5000/api/storage/layout', {
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          }
        });

        if (layoutResponse.ok) {
          const layoutData = await layoutResponse.json();
          if (layoutData.data) {
            setStorageLayout(layoutData.data);
            
            // Initialize sections from layout
            const initialSections = [];
            if (layoutData.data.warehouses) {
              layoutData.data.warehouses.forEach(warehouse => {
                initialSections.push({ id: warehouse.id, name: warehouse.name, type: 'warehouse', capacity: warehouse.capacity || 1000 });
                if (warehouse.zones) {
                  warehouse.zones.forEach(zone => {
                    initialSections.push({ id: zone.id, name: zone.name, type: 'zone', capacity: zone.capacity || 500, parentId: warehouse.id });
                    if (zone.aisles) {
                      zone.aisles.forEach(aisle => {
                        initialSections.push({ id: aisle.id, name: aisle.name, type: 'aisle', capacity: aisle.capacity || 100, parentId: zone.id });
                      });
                    }
                  });
                }
              });
            }
            setSections(initialSections);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch layout:', err);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentFacility]);

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      fetchData();
    }
  }, [currentFacility, featuresLoading, fetchData]);

  // Add section handler
  const handleAddSection = async () => {
    try {
      const sectionId = `${newSection.type}-${Date.now()}`;
      const section = {
        id: sectionId,
        name: newSection.name,
        type: newSection.type,
        capacity: parseInt(newSection.capacity),
        parentId: newSection.parentId,
        items: [],
        utilization: 0
      };

      // Add to local state
      setSections(prev => [...prev, section]);
      
      // Update layout based on section type
      const updatedLayout = { ...storageLayout };
      
      if (newSection.type === 'warehouse') {
        if (!updatedLayout.warehouses) updatedLayout.warehouses = [];
        updatedLayout.warehouses.push({
          id: sectionId,
          name: newSection.name,
          capacity: newSection.capacity,
          zones: []
        });
      } else if (newSection.type === 'zone' && newSection.parentId) {
        const warehouse = updatedLayout.warehouses?.find(w => w.id === newSection.parentId);
        if (warehouse) {
          if (!warehouse.zones) warehouse.zones = [];
          warehouse.zones.push({
            id: sectionId,
            name: newSection.name,
            capacity: newSection.capacity,
            aisles: []
          });
        }
      } else if (newSection.type === 'aisle' && newSection.parentId) {
        // Find zone by parentId
        let targetZone = null;
        updatedLayout.warehouses?.forEach(warehouse => {
          const zone = warehouse.zones?.find(z => z.id === newSection.parentId);
          if (zone) targetZone = zone;
        });
        
        if (targetZone) {
          if (!targetZone.aisles) targetZone.aisles = [];
          targetZone.aisles.push({
            id: sectionId,
            name: newSection.name,
            capacity: newSection.capacity,
            bins: []
          });
        }
      } else if (newSection.type === 'bin' && newSection.parentId) {
        // Find aisle by parentId
        let targetAisle = null;
        updatedLayout.warehouses?.forEach(warehouse => {
          warehouse.zones?.forEach(zone => {
            const aisle = zone.aisles?.find(a => a.id === newSection.parentId);
            if (aisle) targetAisle = aisle;
          });
        });
        
        if (targetAisle) {
          if (!targetAisle.bins) targetAisle.bins = [];
          targetAisle.bins.push({
            id: sectionId,
            name: newSection.name,
            capacity: newSection.capacity,
            items: []
          });
        }
      }

      setStorageLayout(updatedLayout);
      
      // Reset form
      setNewSection({ name: '', type: 'bin', capacity: 100, parentId: null });
      setIsAddingSection(false);
      
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section: ' + error.message);
    }
  };

  // Get hierarchy options for parent selection
  const getParentOptions = () => {
    const options = [];
    
    if (newSection.type === 'zone') {
      sections.filter(s => s.type === 'warehouse').forEach(warehouse => {
        options.push({ id: warehouse.id, name: warehouse.name, type: 'warehouse' });
      });
    } else if (newSection.type === 'aisle') {
      sections.filter(s => s.type === 'zone').forEach(zone => {
        options.push({ id: zone.id, name: zone.name, type: 'zone' });
      });
    } else if (newSection.type === 'bin') {
      sections.filter(s => s.type === 'aisle').forEach(aisle => {
        options.push({ id: aisle.id, name: aisle.name, type: 'aisle' });
      });
    }
    
    return options;
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Storage Designer...</span>
      </div>
    );
  }

  if (!isFeatureEnabled('storageDesigner')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Storage Designer Not Available
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The Storage Designer feature is not enabled for this facility.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storage Designer</h1>
            <p className="text-gray-600 mt-1">Design and manage your facility storage layout</p>
          </div>
          <div className="text-sm text-gray-500">
            Facility: {currentFacility?.name}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'design', name: 'Layout Design', icon: '🏗️' },
              { id: 'sections', name: 'Section Management', icon: '📦' },
              { id: 'rules', name: 'Storage Rules', icon: '📋' },
              { id: 'placement', name: 'Product Placement', icon: '📍' },
              { id: 'analytics', name: 'Storage Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Layout Design Tab */}
          {activeTab === 'design' && (
            <LayoutDesignTab storageLayout={storageLayout} setStorageLayout={setStorageLayout} />
          )}

          {/* Section Management Tab */}
          {activeTab === 'sections' && (
            <SectionManagementTab 
              sections={sections}
              setSections={setSections}
              isAddingSection={isAddingSection}
              setIsAddingSection={setIsAddingSection}
              newSection={newSection}
              setNewSection={setNewSection}
              handleAddSection={handleAddSection}
              getParentOptions={getParentOptions}
            />
          )}

          {/* Storage Rules Tab */}
          {activeTab === 'rules' && (
            <StorageRulesTab sections={sections} storageLayout={storageLayout} />
          )}

          {/* Product Placement Tab */}
          {activeTab === 'placement' && (
            <ProductPlacementTab 
              availableProducts={availableProducts}
              availableBatches={availableBatches}
              sections={sections}
              storageLayout={storageLayout}
              fetchProducts={fetchProducts}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab sections={sections} storageLayout={storageLayout} availableProducts={availableProducts} availableBatches={availableBatches} />
          )}
        </div>
      </div>
    </div>
  );
};

// Layout Design Tab Component
const LayoutDesignTab = ({ storageLayout, setStorageLayout }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update position logic here
      console.log('Dropped at:', x, y);
      setDraggedItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Layout Design</h2>
        <div className="space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            ➕ Add Warehouse
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            💾 Save Layout
          </button>
        </div>
      </div>

      {/* Design Canvas */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-96 bg-gray-50">
        <div 
          className="relative w-full h-full bg-white rounded border"
          style={{ minHeight: '400px' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Render layout items */}
          {storageLayout.warehouses?.map((warehouse, index) => (
            <div
              key={warehouse.id}
              draggable
              onDragStart={(e) => handleDragStart(e, warehouse)}
              className="absolute border-2 border-blue-500 bg-blue-100 p-2 rounded cursor-move"
              style={{
                left: warehouse.x || index * 220 + 20,
                top: warehouse.y || 20,
                width: warehouse.width || 200,
                height: warehouse.height || 150
              }}
              onClick={() => setSelectedItem(warehouse)}
            >
              <div className="font-semibold text-blue-800">{warehouse.name}</div>
              <div className="text-xs text-blue-600">Warehouse</div>
              
              {/* Render zones */}
              {warehouse.zones?.map((zone, zIndex) => (
                <div
                  key={zone.id}
                  className="absolute border border-green-400 bg-green-50 p-1 rounded text-xs"
                  style={{
                    left: zone.x || zIndex * 60 + 10,
                    top: zone.y || 30,
                    width: zone.width || 50,
                    height: zone.height || 40
                  }}
                >
                  <div className="font-medium text-green-700">{zone.name}</div>
                </div>
              ))}
            </div>
          ))}
          
          {/* Empty state */}
          {(!storageLayout.warehouses || storageLayout.warehouses.length === 0) && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="text-lg font-medium mb-2">Start Designing Your Layout</h3>
                <p className="text-sm">Add warehouses and drag them to design your storage facility</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedItem && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Properties: {selectedItem.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                value={selectedItem.name} 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                onChange={(e) => {
                  const updated = { ...selectedItem, name: e.target.value };
                  setSelectedItem(updated);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input 
                type="number" 
                value={selectedItem.capacity || ''} 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                onChange={(e) => {
                  const updated = { ...selectedItem, capacity: parseInt(e.target.value) };
                  setSelectedItem(updated);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Management Tab Component
const SectionManagementTab = ({ 
  sections, 
  setSections, 
  isAddingSection, 
  setIsAddingSection, 
  newSection, 
  setNewSection, 
  handleAddSection, 
  getParentOptions 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Section Management</h2>
        <button 
          onClick={() => setIsAddingSection(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          ➕ Add Section
        </button>
      </div>

      {/* Hierarchy Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Storage Hierarchy</h3>
        <div className="text-sm text-blue-800">
          <div className="flex items-center space-x-2 mb-1">
            <span>🏢</span><span><strong>Warehouse</strong> → Contains multiple zones</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <span>🏬</span><span><strong>Zone</strong> → Contains multiple aisles (e.g., Electronics, Clothing)</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <span>🛤️</span><span><strong>Aisle</strong> → Contains multiple bins (e.g., Aisle A, Aisle B)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📦</span><span><strong>Bin</strong> → Individual storage location for products</span>
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {isAddingSection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Section</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section Type</label>
                <select
                  value={newSection.type}
                  onChange={(e) => setNewSection({ ...newSection, type: e.target.value, parentId: null })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="warehouse">🏢 Warehouse</option>
                  <option value="zone">🏬 Zone</option>
                  <option value="aisle">🛤️ Aisle</option>
                  <option value="bin">📦 Bin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder={`Enter ${newSection.type} name`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  value={newSection.capacity}
                  onChange={(e) => setNewSection({ ...newSection, capacity: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  min="1"
                />
              </div>

              {/* Parent Selection */}
              {newSection.type !== 'warehouse' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parent {newSection.type === 'zone' ? 'Warehouse' : 
                           newSection.type === 'aisle' ? 'Zone' : 'Aisle'}
                  </label>
                  <select
                    value={newSection.parentId || ''}
                    onChange={(e) => setNewSection({ ...newSection, parentId: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="">Select parent...</option>
                    {getParentOptions().map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingSection(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                disabled={!newSection.name || (newSection.type !== 'warehouse' && !newSection.parentId)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Sections ({sections.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sections.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium mb-2">No sections created yet</h3>
              <p className="text-sm">Start by adding a warehouse, then create zones, aisles, and bins</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">
                    {section.type === 'warehouse' ? '🏢' :
                     section.type === 'zone' ? '🏬' :
                     section.type === 'aisle' ? '🛤️' : '📦'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{section.name}</div>
                    <div className="text-sm text-gray-500">
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)} • 
                      Capacity: {section.capacity} • 
                      Utilization: {section.utilization || 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button className="text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Product Placement Tab Component
const ProductPlacementTab = ({ availableProducts, availableBatches, sections, storageLayout, fetchProducts }) => {
  const [placementMode, setPlacementMode] = useState('single'); // single, multi, batch
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Load products when tab is first accessed
  useEffect(() => {
    if (!productsLoaded) {
      fetchProducts().then(() => setProductsLoaded(true));
    }
  }, [fetchProducts, productsLoaded]);

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBatches = availableBatches.filter(batch =>
    batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBins = () => {
    const bins = [];
    sections.filter(s => s.type === 'bin').forEach(bin => {
      bins.push(bin);
    });
    return bins;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Product Placement</h2>
        <div className="flex space-x-2">
          {['single', 'multi', 'batch'].map(mode => (
            <button
              key={mode}
              onClick={() => setPlacementMode(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                placementMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode === 'single' ? '📦 Single Product' :
               mode === 'multi' ? '📚 Multi Select' : '🔄 Batch Mode'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product/Batch Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search {placementMode === 'batch' ? 'Batches' : 'Products'}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${placementMode === 'batch' ? 'batches' : 'products'}...`}
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {placementMode === 'batch' ? (
              // Batch list
              <div className="divide-y divide-gray-200">
                {filteredBatches.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-2xl mb-2">📦</div>
                    <p>No batches found</p>
                  </div>
                ) : (
                  filteredBatches.map((batch) => (
                    <div
                      key={batch._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedBatches.includes(batch._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (selectedBatches.includes(batch._id)) {
                          setSelectedBatches(selectedBatches.filter(id => id !== batch._id));
                        } else {
                          setSelectedBatches([...selectedBatches, batch._id]);
                        }
                      }}
                    >
                      <div className="font-medium text-gray-900">{batch.productName}</div>
                      <div className="text-sm text-gray-500">
                        Batch: {batch.batchId} • SKU: {batch.sku} • Qty: {batch.quantity}
                        {batch.expiryDate && (
                          <span> • Expires: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Product list
              <div className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-2xl mb-2">📦</div>
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProducts.includes(product._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (placementMode === 'single') {
                          setSelectedProducts([product._id]);
                        } else {
                          if (selectedProducts.includes(product._id)) {
                            setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                          } else {
                            setSelectedProducts([...selectedProducts, product._id]);
                          }
                        }
                      }}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku} • Total Qty: {product.totalQuantity || 0}
                        {product.batches && (
                          <span> • {product.batches.length} batches</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Storage Location
            </label>
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {getBins().length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">📦</div>
                  <p>No bins available</p>
                  <p className="text-xs mt-1">Create bins in Section Management first</p>
                </div>
              ) : (
                getBins().map((bin) => (
                  <div
                    key={bin.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedLocation === bin.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                    }`}
                    onClick={() => setSelectedLocation(bin.id)}
                  >
                    <div className="font-medium text-gray-900">📦 {bin.name}</div>
                    <div className="text-sm text-gray-500">
                      Capacity: {bin.capacity} • 
                      Used: {bin.items?.length || 0} • 
                      Available: {bin.capacity - (bin.items?.length || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Place Button */}
          <button
            disabled={
              (placementMode === 'batch' ? selectedBatches.length === 0 : selectedProducts.length === 0) ||
              !selectedLocation
            }
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📍 Place {placementMode === 'batch' ? 'Batches' : 'Products'} in Selected Location
          </button>
        </div>
      </div>
    </div>
  );
};

// Storage Rules Tab Component
const StorageRulesTab = ({ sections, storageLayout }) => {
  const [rules, setRules] = useState([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'capacity', // capacity, category, temperature, fifo, security
    condition: '',
    action: '',
    enabled: true,
    priority: 1
  });

  const ruleTypes = [
    { id: 'capacity', name: 'Capacity Management', icon: '📊', description: 'Rules for storage capacity limits' },
    { id: 'category', name: 'Category Placement', icon: '🏷️', description: 'Rules for product category placement' },
    { id: 'temperature', name: 'Temperature Control', icon: '🌡️', description: 'Rules for temperature-sensitive items' },
    { id: 'fifo', name: 'FIFO Enforcement', icon: '🔄', description: 'First-In-First-Out rules' },
    { id: 'security', name: 'Security Access', icon: '🔒', description: 'Access control rules' },
    { id: 'compatibility', name: 'Product Compatibility', icon: '⚗️', description: 'Product compatibility rules' }
  ];

  const defaultRules = [
    {
      id: 'rule-1',
      name: 'High-Value Items Security',
      type: 'security',
      condition: 'Product value > $1000',
      action: 'Require secure storage area',
      enabled: true,
      priority: 1,
      description: 'High-value items must be stored in secure zones'
    },
    {
      id: 'rule-2', 
      name: 'Perishable Items FIFO',
      type: 'fifo',
      condition: 'Product has expiry date',
      action: 'Enforce FIFO placement',
      enabled: true,
      priority: 2,
      description: 'Perishable items must follow FIFO rules'
    },
    {
      id: 'rule-3',
      name: 'Capacity Alert',
      type: 'capacity',
      condition: 'Section utilization > 85%',
      action: 'Send alert to manager',
      enabled: true,
      priority: 3,
      description: 'Alert when storage sections exceed 85% capacity'
    }
  ];

  useEffect(() => {
    setRules(defaultRules);
  }, []);

  const handleAddRule = () => {
    const rule = {
      id: `rule-${Date.now()}`,
      ...newRule,
      description: `Custom rule: ${newRule.name}`
    };

    setRules(prev => [...prev, rule]);
    setNewRule({ name: '', type: 'capacity', condition: '', action: '', enabled: true, priority: 1 });
    setIsAddingRule(false);
  };

  const toggleRule = (ruleId) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Storage Rules Engine</h2>
        <button 
          onClick={() => setIsAddingRule(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ➕ Add Rule
        </button>
      </div>

      {/* Rule Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ruleTypes.map(type => (
          <div key={type.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{type.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{type.name}</h3>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Rules */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Rules ({rules.filter(r => r.enabled).length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <div key={rule.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">
                    {ruleTypes.find(t => t.id === rule.type)?.icon || '📋'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Priority {rule.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500">If:</span> <span className="font-mono bg-gray-100 px-1 rounded">{rule.condition}</span>
                      <span className="text-gray-500 ml-2">Then:</span> <span className="font-mono bg-gray-100 px-1 rounded">{rule.action}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      rule.enabled 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Storage Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="Enter rule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rule Type</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  {ruleTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Condition</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="e.g., Product category = 'Electronics'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <input
                  type="text"
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="e.g., Place in Zone A only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value={1}>1 - Highest</option>
                  <option value={2}>2 - High</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - Low</option>
                  <option value={5}>5 - Lowest</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingRule(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRule.name || !newRule.condition || !newRule.action}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Analytics Tab Component
const AnalyticsTab = ({ sections, storageLayout, availableProducts, availableBatches }) => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    categories: [],
    batches: [],
    utilization: [],
    trends: []
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState('overview');

  // Calculate comprehensive analytics
  useEffect(() => {
    calculateAnalytics();
  }, [sections, availableProducts, availableBatches]);

  const calculateAnalytics = () => {
    // Overview calculations
    const totalCapacity = sections.reduce((sum, section) => sum + (section.capacity || 0), 0);
    const usedCapacity = sections.reduce((sum, section) => sum + (section.items?.length || 0), 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    const warehouseCount = sections.filter(s => s.type === 'warehouse').length;
    const zoneCount = sections.filter(s => s.type === 'zone').length;
    const aisleCount = sections.filter(s => s.type === 'aisle').length;
    const binCount = sections.filter(s => s.type === 'bin').length;

    // Product analytics
    const totalProducts = availableProducts.length;
    const totalBatches = availableBatches.length;
    const totalValue = availableProducts.reduce((sum, product) => sum + (product.value || 0), 0);
    const totalQuantity = availableProducts.reduce((sum, product) => sum + (product.totalQuantity || 0), 0);

    // Category analytics
    const categoryStats = {};
    availableProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          productCount: 0,
          totalQuantity: 0,
          totalValue: 0,
          batchCount: 0
        };
      }
      categoryStats[category].productCount++;
      categoryStats[category].totalQuantity += product.totalQuantity || 0;
      categoryStats[category].totalValue += product.value || 0;
      categoryStats[category].batchCount += product.batches?.length || 0;
    });

    // Batch analytics
    const batchStats = {
      total: totalBatches,
      expiring: availableBatches.filter(batch => {
        if (!batch.expiryDate) return false;
        const daysToExpiry = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysToExpiry <= 30;
      }).length,
      expired: availableBatches.filter(batch => {
        if (!batch.expiryDate) return false;
        return new Date(batch.expiryDate) < new Date();
      }).length,
      lowStock: availableBatches.filter(batch => (batch.quantity || 0) < 10).length
    };

    // Utilization by section type
    const utilizationByType = {
      warehouse: sections.filter(s => s.type === 'warehouse').map(s => ({
        name: s.name,
        utilization: s.capacity > 0 ? Math.round(((s.items?.length || 0) / s.capacity) * 100) : 0,
        capacity: s.capacity,
        used: s.items?.length || 0
      })),
      zone: sections.filter(s => s.type === 'zone').map(s => ({
        name: s.name,
        utilization: s.capacity > 0 ? Math.round(((s.items?.length || 0) / s.capacity) * 100) : 0,
        capacity: s.capacity,
        used: s.items?.length || 0
      })),
      aisle: sections.filter(s => s.type === 'aisle').map(s => ({
        name: s.name,
        utilization: s.capacity > 0 ? Math.round(((s.items?.length || 0) / s.capacity) * 100) : 0,
        capacity: s.capacity,
        used: s.items?.length || 0
      })),
      bin: sections.filter(s => s.type === 'bin').map(s => ({
        name: s.name,
        utilization: s.capacity > 0 ? Math.round(((s.items?.length || 0) / s.capacity) * 100) : 0,
        capacity: s.capacity,
        used: s.items?.length || 0
      }))
    };

    setAnalyticsData({
      overview: {
        totalCapacity,
        usedCapacity,
        utilizationRate,
        warehouseCount,
        zoneCount,
        aisleCount,
        binCount,
        totalProducts,
        totalBatches,
        totalValue,
        totalQuantity
      },
      categories: Object.values(categoryStats),
      batches: batchStats,
      utilization: utilizationByType,
      trends: generateTrendData()
    });
  };

  const generateTrendData = () => {
    // Generate mock trend data for demonstration
    const days = 30;
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        utilization: Math.random() * 20 + 60, // 60-80% utilization
        inbound: Math.floor(Math.random() * 50 + 10),
        outbound: Math.floor(Math.random() * 40 + 5),
        value: Math.random() * 10000 + 50000
      });
    }
    return trends;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Comprehensive Storage Analytics</h2>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <div className="flex rounded-md border border-gray-300">
            {['overview', 'categories', 'batches', 'utilization', 'trends'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">📊</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Overall Utilization</p>
                  <p className="text-2xl font-bold text-blue-900">{analyticsData.overview.utilizationRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">📦</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Total Products</p>
                  <p className="text-2xl font-bold text-green-900">{analyticsData.overview.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">🔄</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Total Batches</p>
                  <p className="text-2xl font-bold text-yellow-900">{analyticsData.overview.totalBatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">💰</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Total Value</p>
                  <p className="text-2xl font-bold text-purple-900">${analyticsData.overview.totalValue?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Infrastructure</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.warehouseCount}</div>
                <div className="text-sm text-gray-500">Warehouses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏬</div>
                <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.zoneCount}</div>
                <div className="text-sm text-gray-500">Zones</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🛤️</div>
                <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.aisleCount}</div>
                <div className="text-sm text-gray-500">Aisles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.binCount}</div>
                <div className="text-sm text-gray-500">Bins</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Analytics */}
      {viewMode === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.categories.map((category, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.productCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.batchCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.totalQuantity.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${category.totalValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Batch Analytics */}
      {viewMode === 'batches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">📦</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total Batches</p>
                  <p className="text-2xl font-bold text-blue-900">{analyticsData.batches.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">📅</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-900">{analyticsData.batches.expiring}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">❌</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Expired</p>
                  <p className="text-2xl font-bold text-red-900">{analyticsData.batches.expired}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-2xl">⚠️</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-900">{analyticsData.batches.lowStock}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Details */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Details</h3>
            <div className="space-y-4">
              {availableBatches.slice(0, 10).map((batch, index) => {
                const daysToExpiry = batch.expiryDate ? 
                  Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">📦</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{batch.productName}</h4>
                        <p className="text-sm text-gray-500">Batch: {batch.batchId} • Qty: {batch.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {daysToExpiry !== null && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          daysToExpiry < 0 ? 'bg-red-100 text-red-800' :
                          daysToExpiry <= 7 ? 'bg-yellow-100 text-yellow-800' :
                          daysToExpiry <= 30 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysToExpiry < 0 ? 'Expired' : 
                           daysToExpiry === 0 ? 'Expires today' :
                           `${daysToExpiry} days`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Utilization Analytics */}
      {viewMode === 'utilization' && (
        <div className="space-y-6">
          {Object.entries(analyticsData.utilization).map(([type, items]) => (
            <div key={type} className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">{type} Utilization</h3>
              <div className="space-y-4">
                {items.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            item.utilization > 80 ? 'bg-red-500' :
                            item.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${item.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-500 text-right">
                      {item.utilization}%
                    </div>
                    <div className="w-24 text-xs text-gray-400 text-right">
                      {item.used}/{item.capacity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trend Analytics */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilization Trends (Last 30 Days)</h3>
            <div className="h-64 flex items-end space-x-1">
              {analyticsData.trends.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{ height: `${(day.utilization / 100) * 100}%` }}
                  title={`${day.date}: ${day.utilization.toFixed(1)}%`}
                ></div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-gray-500">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inbound vs Outbound</h3>
              <div className="space-y-3">
                {analyticsData.trends.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">In: {day.inbound}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Out: {day.outbound}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Value Trends</h3>
              <div className="space-y-3">
                {analyticsData.trends.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-sm font-medium">${day.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageDesigner;
