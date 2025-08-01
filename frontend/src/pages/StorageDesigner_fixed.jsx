import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';
import './StorageDesigner.css';

// Main Component
const StorageDesigner = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled } = useFeatures();
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

  // Fetch storage layout and related data
  useEffect(() => {
    if (currentFacility) {
      fetchStorageData();
    }
  }, [currentFacility]);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      
      // Mock data for initial layout
      const mockLayout = {
        id: 'layout-1',
        name: 'Main Warehouse Layout',
        dimensions: { width: 100, height: 80 },
        sections: [
          { id: 'A1', name: 'Section A1', x: 10, y: 10, width: 20, height: 15, type: 'shelf', capacity: 100, used: 75 },
          { id: 'B1', name: 'Section B1', x: 35, y: 10, width: 20, height: 15, type: 'shelf', capacity: 80, used: 45 },
          { id: 'C1', name: 'Section C1', x: 60, y: 10, width: 20, height: 15, type: 'shelf', capacity: 120, used: 90 },
        ],
        aisles: [
          { id: 'aisle-1', x: 0, y: 30, width: 100, height: 5 },
          { id: 'aisle-2', x: 30, y: 0, width: 5, height: 30 },
        ]
      };

      const mockProducts = [
        { id: 1, name: 'Product A', sku: 'SKU001', category: 'Electronics' },
        { id: 2, name: 'Product B', sku: 'SKU002', category: 'Clothing' },
        { id: 3, name: 'Product C', sku: 'SKU003', category: 'Books' },
      ];

      const mockSections = [
        { id: 'A1', name: 'Section A1', capacity: 100, used: 75, products: ['SKU001', 'SKU002'] },
        { id: 'B1', name: 'Section B1', capacity: 80, used: 45, products: ['SKU003'] },
        { id: 'C1', name: 'Section C1', capacity: 120, used: 90, products: ['SKU001'] },
      ];

      setStorageLayout(mockLayout);
      setAvailableProducts(mockProducts);
      setSections(mockSections);
      
      // Calculate analytics
      const totalCapacity = mockSections.reduce((sum, section) => sum + section.capacity, 0);
      const usedCapacity = mockSections.reduce((sum, section) => sum + section.used, 0);
      const utilizationRate = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

      setStorageAnalytics({
        totalCapacity,
        usedCapacity,
        utilizationRate: Math.round(utilizationRate),
        sectionsCount: mockSections.length,
        productsCount: mockProducts.length
      });

    } catch (err) {
      setError('Failed to load storage data');
      console.error('Error fetching storage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
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
  viewMode, designMode, setDesignMode, selectedProduct, setSelectedProduct, handleLocationClick 
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

const SectionManagementTab = ({ sections, setSections, selectedSection, setSelectedSection, storageLayout, setStorageLayout }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Section Management</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            ➕ Add Section
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(section => (
            <div key={section.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                 onClick={() => setSelectedSection(section)}>
              <h3 className="font-medium text-gray-900">{section.name}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Capacity: {section.used}/{section.capacity}</p>
                <p>Products: {section.products.length}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{width: `${(section.used/section.capacity)*100}%`}}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductPlacementTab = ({ 
  availableProducts, selectedProduct, setSelectedProduct, 
  productSearch, setProductSearch, storageLayout, sections 
}) => {
  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Panel */}
      <div className="lg:col-span-1">
        <ProductPlacementPanel 
          products={filteredProducts} 
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
          searchQuery={productSearch}
          onSearchChange={setProductSearch}
        />
      </div>

      {/* Placement Canvas */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedProduct ? `Place ${selectedProduct.name}` : 'Select a product to place'}
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-500">
              {selectedProduct 
                ? 'Click on a section in the layout to place the product'
                : 'Select a product from the left panel to begin placement'
              }
            </p>
          </div>
        </div>
      </div>
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
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Layout</h3>
      
      {selectedLocation ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Selected: {selectedLocation.name}</h4>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Edit Properties
            </button>
            <button className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Add Section
            </button>
            <button className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>Select a location to edit</p>
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
  return (
    <div className="p-6 h-96">
      <h3 className="text-lg font-medium text-gray-900 mb-4">2D Storage Layout</h3>
      <div className="border border-gray-300 rounded-lg h-full relative bg-gray-50">
        {layout?.sections?.map(section => (
          <div
            key={section.id}
            onClick={() => onLocationClick(section)}
            className={`absolute border-2 rounded cursor-pointer flex items-center justify-center text-sm font-medium ${
              selectedLocation?.id === section.id
                ? 'border-blue-500 bg-blue-100 text-blue-900'
                : 'border-gray-400 bg-white hover:bg-gray-100'
            }`}
            style={{
              left: `${section.x}%`,
              top: `${section.y}%`,
              width: `${section.width}%`,
              height: `${section.height}%`
            }}
          >
            {section.name}
          </div>
        ))}
        
        {layout?.aisles?.map(aisle => (
          <div
            key={aisle.id}
            className="absolute bg-yellow-200 border border-yellow-400"
            style={{
              left: `${aisle.x}%`,
              top: `${aisle.y}%`,
              width: `${aisle.width}%`,
              height: `${aisle.height}%`
            }}
          />
        ))}
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
