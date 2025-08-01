import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFacility } from '../contexts/FacilityContext';

const ProductDetailNew = () => {
  const { productId } = useParams(); // This will be the composite key (name_sku)
  const navigate = useNavigate();
  const { currentFacility } = useFacility();
  
  // State for product data
  const [productSummary, setProductSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [individualProducts, setIndividualProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab management
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters and search
  const [batchFilter, setBatchFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  // Form states
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  
  // Batch management states
  const [editingBatch, setEditingBatch] = useState(null);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false);

  // Facility configuration for display
  const [facilityConfig, setFacilityConfig] = useState({
    showBatchDetails: true,
    showPlacement: true,
    showDistribution: true,
    showAnalytics: true,
    allowBatchMerging: false,
    requiredFields: ['location', 'expiry'],
    customFields: []
  });

  useEffect(() => {
    if (productId && currentFacility) {
      fetchProductDetails();
      loadFacilityConfiguration();
    }
  }, [productId, currentFacility]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const facilityId = currentFacility?._id || '68866e9ef5f2215902022394';
      
      console.log('Fetching details for product ID:', productId);

      // Use the dedicated composite key endpoint
      const response = await fetch(`http://localhost:5000/api/products/detail/${encodeURIComponent(productId)}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      
      if (data.success) {
        setProductSummary(data.data.summary);
        setBatches(data.data.batches);
        setIndividualProducts(data.data.individualProducts || []);
        
        // Fetch analytics
        await fetchProductAnalytics(data.data.summary.name, facilityId);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAnalytics = async (productName, facilityId) => {
    try {
      // TODO: Implement analytics endpoint on backend
      // For now, provide mock analytics data
      const mockAnalytics = {
        totalMovement: {
          inbound: 150,
          outbound: 75,
          net: 75
        },
        trends: {
          daily: [10, 15, 12, 18, 20, 16, 14],
          weekly: [85, 92, 78, 105, 98],
          monthly: [450, 520, 480, 610]
        },
        performance: {
          turnoverRate: 2.5,
          averageDwell: 30,
          stockAccuracy: 98.5
        },
        forecast: {
          nextWeek: 85,
          nextMonth: 340,
          reorderSuggestion: 'Order in 2 weeks'
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const loadFacilityConfiguration = () => {
    // Load facility-specific product view configuration
    // This would come from a facility settings API
    const config = {
      showBatchDetails: currentFacility?.settings?.showBatchDetails ?? true,
      showPlacement: currentFacility?.settings?.showPlacement ?? true,
      showDistribution: currentFacility?.settings?.showDistribution ?? true,
      showAnalytics: currentFacility?.settings?.showAnalytics ?? true,
      allowBatchMerging: currentFacility?.settings?.allowBatchMerging ?? false,
      requiredFields: currentFacility?.settings?.requiredFields ?? ['location'],
      customFields: currentFacility?.settings?.customProductFields ?? []
    };
    
    setFacilityConfig(config);
  };

  const handleBatchSelection = (batchId, selected) => {
    if (selected) {
      setSelectedBatches([...selectedBatches, batchId]);
    } else {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    }
  };

  const handleDistribution = async (distributionData) => {
    try {
      if (!productSummary?.name) {
        console.error('Product summary not loaded');
        return;
      }

      const response = await fetch('http://localhost:5000/api/products/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': currentFacility?.id || 'facility_001'
        },
        body: JSON.stringify({
          productName: productSummary.name,
          batches: selectedBatches,
          ...distributionData
        })
      });

      if (response.ok) {
        // Refresh data
        await fetchProductDetails();
        setShowDistributionForm(false);
        setSelectedBatches([]);
      }
    } catch (err) {
      console.error('Distribution error:', err);
    }
  };

  const handleEditProduct = () => {
    // Navigate to edit form or show modal - for now navigate to products page with edit state
    navigate(`/products`, { 
      state: { 
        editProduct: productSummary,
        editMode: true 
      } 
    });
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete all "${productSummary?.name}" products? This action cannot be undone.`)) {
      return;
    }

    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      // Delete all individual products for this grouped product
      for (const product of individualProducts) {
        const response = await fetch(`http://localhost:5000/api/products/${product._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Failed to delete product ${product.name}`);
        }
      }

      // Navigate back to products page after successful deletion
      navigate('/products', { 
        state: { 
          message: `Successfully deleted all "${productSummary.name}" products.`,
          type: 'success'
        }
      });

    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch({
      ...batch,
      originalQuantity: batch.totalQuantity
    });
  };

  const handleSaveBatch = async (batchData) => {
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      // Calculate quantity difference
      const quantityDiff = batchData.totalQuantity - batchData.originalQuantity;
      
      if (quantityDiff !== 0) {
        // Handle quantity changes by adding/removing individual products
        const response = await fetch(`http://localhost:5000/api/products/batch/${batchData.batchId}/quantity`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          },
          body: JSON.stringify({
            quantityChange: quantityDiff,
            pricePerUnit: batchData.pricePerUnit
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to update batch quantity');
        }
      }

      // Update pricing for existing products in the batch
      const priceResponse = await fetch(`http://localhost:5000/api/products/batch/${batchData.batchId}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        },
        body: JSON.stringify({
          pricePerUnit: batchData.pricePerUnit
        })
      });

      if (!priceResponse.ok) {
        const data = await priceResponse.json();
        throw new Error(data.message || 'Failed to update batch price');
      }

      // Refresh product details
      await fetchProductDetails();
      setEditingBatch(null);
      
    } catch (err) {
      console.error('Batch save error:', err);
      alert(`Failed to save batch: ${err.message}`);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm(`Are you sure you want to delete batch ${batchId}? This will remove all individual products in this batch.`)) {
      return;
    }

    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      const response = await fetch(`http://localhost:5000/api/products/batch/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete batch');
      }

      // Refresh product details
      await fetchProductDetails();
      
    } catch (err) {
      console.error('Batch delete error:', err);
      alert(`Failed to delete batch: ${err.message}`);
    }
  };

  const handleAddNewBatch = async (batchData) => {
    try {
      const facilityId = currentFacility?._id || currentFacility?.id;
      
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        },
        body: JSON.stringify({
          name: productSummary.name,
          category: {
            primary: productSummary.category || 'General'
          },
          quantity: batchData.quantity,
          pricing: {
            sellingPrice: batchData.pricePerUnit
          },
          description: batchData.description || productSummary.description
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create new batch');
      }

      // Refresh product details
      await fetchProductDetails();
      setShowAddBatchForm(false);
      
    } catch (err) {
      console.error('Add batch error:', err);
      alert(`Failed to add new batch: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !productSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Product Not Found</h2>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist or may have been removed.</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/products')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{productSummary?.name || 'Loading...'}</h1>
                  <p className="text-sm text-gray-500">SKU: {productSummary?.skuPrefix || productSummary?.sku || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  productSummary?.status === 'in-stock' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {productSummary?.status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                </span>
                
                {facilityConfig.showDistribution && (
                  <button
                    onClick={() => setShowDistributionForm(true)}
                    disabled={selectedBatches.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Distribute Selected
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Quantity</div>
            <div className="text-2xl font-bold text-gray-900">{productSummary?.totalQuantity || 0}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">${(productSummary?.totalValue || 0).toFixed(2)}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Avg Price/Unit</div>
            <div className="text-2xl font-bold text-gray-900">${(productSummary?.avgPricePerUnit || 0).toFixed(2)}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Active Batches</div>
            <div className="text-2xl font-bold text-gray-900">{productSummary?.totalBatches || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', show: true },
                { id: 'batches', name: 'Batch Management', show: facilityConfig.showBatchDetails },
                { id: 'placement', name: 'Placement & Location', show: facilityConfig.showPlacement },
                { id: 'analytics', name: 'Analytics & Forecasting', show: facilityConfig.showAnalytics }
              ].filter(tab => tab.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <ProductOverviewTab 
                summary={productSummary}
                batches={batches}
                facilityConfig={facilityConfig}
              />
            )}
            
            {activeTab === 'batches' && (
              <BatchManagementTab
                batches={batches}
                selectedBatches={selectedBatches}
                onBatchSelection={handleBatchSelection}
                facilityConfig={facilityConfig}
                editingBatch={editingBatch}
                onEditBatch={handleEditBatch}
                onSaveBatch={handleSaveBatch}
                onDeleteBatch={handleDeleteBatch}
                onAddNewBatch={() => setShowAddBatchForm(true)}
                onCancelEdit={() => setEditingBatch(null)}
              />
            )}
            
            {activeTab === 'placement' && (
              <PlacementTab
                productSummary={productSummary}
                batches={batches}
                facilityConfig={facilityConfig}
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsTab
                productSummary={productSummary}
                analytics={analytics}
                facilityConfig={facilityConfig}
              />
            )}
          </div>
        </div>
      </div>

      {/* Distribution Form Modal */}
      {showDistributionForm && (
        <DistributionModal
          isOpen={showDistributionForm}
          onClose={() => setShowDistributionForm(false)}
          onSubmit={handleDistribution}
          selectedBatches={selectedBatches}
          batches={batches}
        />
      )}

      {/* Add New Batch Modal */}
      {showAddBatchForm && (
        <AddBatchModal
          isOpen={showAddBatchForm}
          onClose={() => setShowAddBatchForm(false)}
          onSubmit={handleAddNewBatch}
          productName={productSummary?.name}
          productCategory={productSummary?.category}
        />
      )}
    </div>
  );
};

// Sub-components for each tab
const ProductOverviewTab = ({ summary, batches, facilityConfig }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="text-sm text-gray-900">{summary.category}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Locations</dt>
            <dd className="text-sm text-gray-900">{summary.locations.length}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="text-sm text-gray-900">{summary.description || 'No description available'}</dd>
          </div>
        </dl>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Batches</h3>
        <div className="space-y-3">
          {batches.slice(0, 5).map((batch) => (
            <div key={batch.batchId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{batch.batchId}</div>
                <div className="text-xs text-gray-500">{batch.totalQuantity} units</div>
              </div>
              <div className="text-sm font-medium">${batch.totalValue.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BatchManagementTab = ({ 
  batches, 
  selectedBatches, 
  onBatchSelection, 
  facilityConfig, 
  editingBatch, 
  onEditBatch, 
  onSaveBatch, 
  onDeleteBatch, 
  onAddNewBatch, 
  onCancelEdit 
}) => {
  const [editForm, setEditForm] = useState({});

  // Update form when editing batch changes
  useEffect(() => {
    if (editingBatch) {
      setEditForm({
        batchId: editingBatch.batchId,
        totalQuantity: editingBatch.totalQuantity,
        pricePerUnit: editingBatch.totalValue / editingBatch.totalQuantity || 0,
        originalQuantity: editingBatch.originalQuantity
      });
    }
  }, [editingBatch]);

  const handleEditSubmit = () => {
    onSaveBatch({
      ...editForm,
      totalValue: editForm.totalQuantity * editForm.pricePerUnit
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Batch Management</h3>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Export Data
          </button>
          <button 
            onClick={onAddNewBatch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add New Batch
          </button>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.map((batch) => (
              <tr key={batch.batchId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedBatches.includes(batch.batchId)}
                    onChange={(e) => onBatchSelection(batch.batchId, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBatch && editingBatch.batchId === batch.batchId ? (
                    <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {batch.batchId} (locked)
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{batch.batchId}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBatch && editingBatch.batchId === batch.batchId ? (
                    <input
                      type="number"
                      value={editForm.totalQuantity || ''}
                      onChange={(e) => setEditForm({...editForm, totalQuantity: parseInt(e.target.value) || 0})}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{batch.totalQuantity}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBatch && editingBatch.batchId === batch.batchId ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.pricePerUnit || ''}
                      onChange={(e) => setEditForm({...editForm, pricePerUnit: parseFloat(e.target.value) || 0})}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">${(batch.totalValue / batch.totalQuantity || 0).toFixed(2)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBatch && editingBatch.batchId === batch.batchId ? (
                    <div className="text-sm text-gray-900 font-medium">
                      ${((editForm.totalQuantity || 0) * (editForm.pricePerUnit || 0)).toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900">${batch.totalValue.toFixed(2)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{batch.locations.join(', ') || 'Not assigned'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(batch.createdDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingBatch && editingBatch.batchId === batch.batchId ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleEditSubmit}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button 
                        onClick={onCancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onEditBatch(batch)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteBatch(batch.batchId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Move pagination to bottom of page */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {batches.length} batch{batches.length !== 1 ? 'es' : ''} total
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" disabled>
            Previous
          </button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</span>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const PlacementTab = ({ productSummary, batches, facilityConfig }) => {
  const [storageLocation, setStorageLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [locationForm, setLocationForm] = useState({
    warehouse: '',
    zone: '',
    aisle: '',
    shelf: '',
    bin: '',
    coordinates: { x: 0, y: 0, z: 0 }
  });

  useEffect(() => {
    if (productSummary) {
      fetchStorageLocation();
    }
  }, [productSummary]);

  const fetchStorageLocation = async () => {
    try {
      setLoading(true);
      // Get storage location from product data
      if (productSummary.storageLocation) {
        setStorageLocation(productSummary.storageLocation);
        setLocationForm({
          warehouse: productSummary.storageLocation.warehouse || '',
          zone: productSummary.storageLocation.zone || '',
          aisle: productSummary.storageLocation.aisle || '',
          shelf: productSummary.storageLocation.shelf || '',
          bin: productSummary.storageLocation.bin || '',
          coordinates: productSummary.storageLocation.coordinates || { x: 0, y: 0, z: 0 }
        });
      }
    } catch (err) {
      console.error('Error fetching storage location:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      // Use the first individual product's ID since summary doesn't have _id
      const targetProductId = individualProducts[0]?._id;
      if (!targetProductId) {
        throw new Error('No product ID available for location update');
      }

      const response = await fetch(`http://localhost:5000/api/storage/products/${targetProductId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': currentFacility?._id || '68866e9ef5f2215902022394'
        },
        body: JSON.stringify(locationForm)
      });

      if (response.ok) {
        const data = await response.json();
        setStorageLocation(locationForm);
        setEditing(false);
        alert('Storage location updated successfully!');
      } else {
        throw new Error('Failed to update location');
      }
    } catch (err) {
      console.error('Error updating storage location:', err);
      alert('Error updating storage location. Please try again.');
    }
  };

  const generateLocationCode = () => {
    const { warehouse, zone, aisle, shelf, bin } = locationForm;
    const parts = [warehouse, zone, aisle, shelf, bin].filter(Boolean);
    return parts.length > 0 ? parts.join('-') : 'Not Assigned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Placement & Location Management</h3>
      
      {/* Current Location Display */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Current Storage Location</h4>
        
        {storageLocation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Location Code:</span>
                  <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {generateLocationCode()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Warehouse:</span>
                  <span className="text-sm text-gray-900">{storageLocation.warehouse || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Zone:</span>
                  <span className="text-sm text-gray-900">{storageLocation.zone || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Aisle:</span>
                  <span className="text-sm text-gray-900">{storageLocation.aisle || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Shelf:</span>
                  <span className="text-sm text-gray-900">{storageLocation.shelf || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Bin:</span>
                  <span className="text-sm text-gray-900">{storageLocation.bin || 'Not specified'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Visual Location</h5>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📍</div>
                <div className="text-sm text-gray-500">
                  {storageLocation.coordinates?.x || 0}, {storageLocation.coordinates?.y || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Grid Coordinates</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Location Assigned</h4>
            <p className="text-gray-600 mb-4">This product doesn't have a storage location assigned yet.</p>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Assign Location
            </button>
          </div>
        )}
      </div>

      {/* Edit Location Form */}
      {editing && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {storageLocation ? 'Update Storage Location' : 'Assign Storage Location'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <input
                type="text"
                value={locationForm.warehouse}
                onChange={(e) => setLocationForm({...locationForm, warehouse: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                value={locationForm.zone}
                onChange={(e) => setLocationForm({...locationForm, zone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aisle</label>
              <input
                type="text"
                value={locationForm.aisle}
                onChange={(e) => setLocationForm({...locationForm, aisle: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf</label>
              <input
                type="text"
                value={locationForm.shelf}
                onChange={(e) => setLocationForm({...locationForm, shelf: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="S1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bin</label>
              <input
                type="text"
                value={locationForm.bin}
                onChange={(e) => setLocationForm({...locationForm, bin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="B1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleUpdateLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {storageLocation ? 'Update Location' : 'Assign Location'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Location Management</h4>
          <div className="space-y-3">
            {storageLocation && (
              <button
                onClick={() => setEditing(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <span>✏️</span>
                <span>Edit Location</span>
              </button>
            )}
            <button
              onClick={() => {
                console.log('Navigate function:', navigate);
                navigate('/storage-designer');
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2"
            >
              <span>🏗️</span>
              <span>Open Storage Designer</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Location History</h4>
          <div className="text-sm text-gray-600">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Location:</span>
                <span className="font-medium">{generateLocationCode()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{storageLocation?.updatedAt ? new Date(storageLocation.updatedAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsTab = ({ productSummary, analytics, facilityConfig }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-6">Analytics & Forecasting</h3>
    <p className="text-gray-600">Advanced analytics and forecasting dashboard will be implemented here.</p>
  </div>
);

const DistributionModal = ({ isOpen, onClose, onSubmit, selectedBatches, batches }) => {
  const [formData, setFormData] = useState({
    destination: '',
    quantity: '',
    reason: '',
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Distribute Products</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Distribute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddBatchModal = ({ isOpen, onClose, onSubmit, productName, productCategory }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    pricePerUnit: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      quantity: parseInt(formData.quantity),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      description: formData.description
    });
    setFormData({ quantity: '', pricePerUnit: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Batch</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
            <input
              type="text"
              value={productName}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Product name and batch ID will be automatically assigned</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={productCategory}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price per Unit *</label>
            <input
              type="number"
              step="0.01"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Optional batch description"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailNew;
