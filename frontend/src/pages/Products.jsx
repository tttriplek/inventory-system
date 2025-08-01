import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacility } from '../contexts/FacilityContext';
import ProductTable from '../components/ProductTable';
import ProductForm from '../components/ProductForm';
// import ProductDetail from '../components/ProductDetail';
// import BatchManager from '../components/BatchManager';

// Note: Products are now displayed directly from database without grouping
// Each database record already represents the correct inventory quantity

const Products = () => {
  const { currentFacility } = useFacility();
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBatchManagerOpen, setIsBatchManagerOpen] = useState(false);
  
  // Bulk selection states
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Import/Export dropdown states
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: ''
  });
  
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Pagination limit options
  const [pageSize, setPageSize] = useState(25);
  const pageLimitOptions = [25, 50, 100, 200];

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowImportDropdown(false);
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch products when facility changes or filters change
  useEffect(() => {
    if (currentFacility) {
      fetchProducts();
      fetchAnalytics();
    }
  }, [currentFacility, filters, sorting, pageSize]); // Added pageSize dependency

  // Handle pagination changes for grouped products
  useEffect(() => {
    if (allProducts.length > 0) {
      const startIndex = (pagination.page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      
      console.log('PAGINATION DEBUG:', {
        allProductsLength: allProducts.length,
        currentPage: pagination.page,
        pageSize: pageSize,
        startIndex,
        endIndex,
        paginatedProductsLength: paginatedProducts.length
      });
      
      setProducts(paginatedProducts);
      
      // Update pagination pages based on current page size
      setPagination(prev => ({
        ...prev,
        pages: Math.ceil(allProducts.length / pageSize)
      }));
    }
  }, [pagination.page, pageSize, allProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const facilityId = getCurrentFacilityId();
      
      console.log('Current facility:', currentFacility);
      console.log('Facility ID being sent:', facilityId);
      
      if (!facilityId) {
        setError('No facility selected');
        return;
      }

      // Always fetch grouped products for cleaner display
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 1000 // Get all for grouping
      });

      // Add filters only if they have values
      if (filters.search && filters.search.trim()) {
        queryParams.append('search', filters.search.trim());
      }
      if (filters.category && filters.category.trim()) {
        queryParams.append('category', filters.category.trim());
      }

      const response = await fetch(`http://localhost:5000/api/products/grouped?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to fetch grouped products');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Grouped products from backend:', data.data.length);
        console.log('Sample grouped product:', data.data[0]);
        console.log('Individual products total:', data.metadata?.totalIndividualProducts);
        
        console.log('FETCH PRODUCTS DEBUG:', {
          backendProductsCount: data.data.length,
          currentPageSize: pageSize,
          currentPage: pagination.page
        });
        
        setAllProducts(data.data);
        
        // Apply client-side pagination
        const startIndex = (pagination.page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedProducts = data.data.slice(startIndex, endIndex);
        
        console.log('FETCH PAGINATION:', {
          startIndex,
          endIndex,
          paginatedLength: paginatedProducts.length
        });
        
        setProducts(paginatedProducts);
        setPagination(prev => ({
          ...prev,
          total: data.data.length,
          pages: Math.ceil(data.data.length / pageSize)
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch grouped products');
      }

      setError(null);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const facilityId = getCurrentFacilityId();
      if (!facilityId) return;

      console.log('Fetching analytics for facility:', facilityId);

      const response = await fetch('http://localhost:5000/api/products/analytics', {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      console.log('Analytics response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        if (data.success) {
          console.log('Setting analytics to:', data.data);
          setAnalytics(data.data);
        } else {
          console.log('Analytics response not successful:', data);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log('Analytics error:', errorData);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      const facilityId = getCurrentFacilityId();
      if (!facilityId) {
        setError('No facility selected');
        return;
      }

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create product');
      }

      await fetchProducts();
      await fetchAnalytics();
      setSelectedProduct(null);
      setIsFormOpen(false);
      setError(null);
      
    } catch (err) {
      setError(err.message);
      console.error('Error creating product:', err);
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      const facilityId = getCurrentFacilityId();
      if (!facilityId) {
        setError('No facility selected');
        return;
      }

      // Find the selected product to get its batchId
      const selectedProductData = products.find(p => p._id === productId);
      if (!selectedProductData || !selectedProductData.batchId) {
        // If no batchId, update single product (legacy behavior)
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          },
          body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update product');
        }
      } else {
        // Use the new batch update endpoint
        console.log(`Updating batch ${selectedProductData.batchId} with data:`, productData);
        
        const response = await fetch(`http://localhost:5000/api/products/batch/${selectedProductData.batchId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          },
          body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update batch');
        }
        
        console.log(`Successfully updated batch: ${data.message}`);
      }

      await fetchProducts();
      await fetchAnalytics();
      setSelectedProduct(null);
      setIsFormOpen(false);
      setError(null);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const facilityId = getCurrentFacilityId();
      if (!facilityId) {
        setError('No facility selected');
        return;
      }

      // Find the grouped product to get all individual products
      const groupedProduct = products.find(p => p._id === productId);
      
      if (groupedProduct && groupedProduct.individualProducts && groupedProduct.individualProducts.length > 1) {
        // If this is a grouped product with multiple individual products, delete all of them
        if (!confirm(`This will delete ${groupedProduct.individualProducts.length} individual products in this batch. Continue?`)) {
          return;
        }
        
        // Delete all individual products in the group
        for (const individualProduct of groupedProduct.individualProducts) {
          const response = await fetch(`http://localhost:5000/api/products/${individualProduct._id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-Facility-ID': facilityId
            }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Failed to delete product ${individualProduct.name}`);
          }
        }
      } else {
        // Delete single product (either not grouped or only one in group)
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Facility-ID': facilityId
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete product');
        }
      }

      await fetchProducts();
      await fetchAnalytics();
      setSelectedProduct(null);
      setError(null);
      
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
    }
  };

  // Bulk delete function
  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedProducts })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete products');
      }

      await fetchProducts();
      await fetchAnalytics();
      setSelectedProducts([]);
      setIsSelectMode(false);
      setError(null);
      
      alert(`Successfully deleted ${data.deletedCount} product(s)`);
      
    } catch (err) {
      setError(err.message);
      console.error('Error bulk deleting products:', err);
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedProducts([]);
  };

  // Handle product selection
  const handleProductSelection = (productId, isSelected) => {
    if (isSelected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // Select all products
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSortChange = (sortBy, sortOrder = 'asc') => {
    setSorting({ sortBy, sortOrder });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleProductSelect = (product) => {
    // Create composite key for navigation (name_skuPrefix for grouped products)
    const skuIdentifier = product.skuPrefix || product.sku || 'unknown';
    const compositeKey = `${encodeURIComponent(product.name)}_${encodeURIComponent(skuIdentifier)}`;
    navigate(`/products/${compositeKey}`);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleBatchSelect = (product) => {
    // Navigate to product detail page with batches tab active
    const skuIdentifier = product.skuPrefix || product.sku || 'unknown';
    const compositeKey = `${encodeURIComponent(product.name)}_${encodeURIComponent(skuIdentifier)}`;
    navigate(`/products/${compositeKey}?tab=batches`);
  };

  // Handle product import with options
  const handleImportProducts = (format = 'auto') => {
    const input = document.createElement('input');
    input.type = 'file';
    
    // Set accept types based on format
    switch(format) {
      case 'csv':
        input.accept = '.csv';
        break;
      case 'excel':
        input.accept = '.xlsx,.xls';
        break;
      case 'json':
        input.accept = '.json';
        break;
      default:
        input.accept = '.csv,.xlsx,.xls,.json';
    }

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      try {
        setLoading(true);
        const facilityId = getCurrentFacilityId();
        
        const response = await fetch('http://localhost:5000/api/products/import', {
          method: 'POST',
          headers: {
            'X-Facility-ID': facilityId
          },
          body: formData
        });

        const data = await response.json();
        
        if (data.success) {
          alert(`Import successful! ${data.imported || 0} products imported.`);
          fetchProducts(); // Refresh the products list
          fetchAnalytics(); // Refresh analytics
        } else {
          alert(`Import failed: ${data.message}`);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Import failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // Handle product export with format options
  const handleExportProducts = async (format = 'csv', options = {}) => {
    try {
      setLoading(true);
      const facilityId = getCurrentFacilityId();
      
      const params = new URLSearchParams({
        format,
        ...options
      });
      
      const response = await fetch(`http://localhost:5000/api/products/export?${params}`, {
        headers: {
          'X-Facility-ID': facilityId
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = format === 'excel' ? 'xlsx' : format;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `products-${currentFacility.name}-${timestamp}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`Export successful! File downloaded as ${a.download}`);
      } else {
        const data = await response.json();
        alert(`Export failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentFacilityId = () => {
    return currentFacility?._id || currentFacility?.id;
  };

  // Group products by batch - only group if they have the same batchId AND same name
  // Each product record represents its actual inventory quantity
  const groupProductsByBatch = (products) => {
    const grouped = {};
    
    products.forEach(product => {
      // Create a unique key for grouping
      // Only group products that have the same name AND the same batchId
      let groupKey;
      
      if (product.batchId && product.batchId !== 'N/A' && product.batchId.trim() !== '') {
        // Group by name + batchId combination
        groupKey = `${product.name}_${product.batchId}`;
      } else if (product.batch && product.batch !== 'N/A' && product.batch.trim() !== '') {
        // Group by name + batch combination
        groupKey = `${product.name}_${product.batch}`;
      } else {
        // For products without batch info, each product is its own group
        groupKey = `${product._id}_${product.name}`;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...product,
          individualProducts: [product], // Store individual products for operations
          totalQuantity: product.quantity || 0,
          isBatch: false,
          batchInfo: product.batchId || product.batch || 'Individual Item'
        };
      } else {
        // Add to existing group (only if truly the same product with same batchId)
        grouped[groupKey].individualProducts.push(product);
        grouped[groupKey].totalQuantity += (product.quantity || 0);
        grouped[groupKey].isBatch = true; // Mark as batch if multiple products
        
        // Keep the most recent product data but maintain the group structure
        if (product.createdAt > grouped[groupKey].createdAt) {
          grouped[groupKey] = {
            ...product,
            individualProducts: grouped[groupKey].individualProducts,
            totalQuantity: grouped[groupKey].totalQuantity,
            isBatch: grouped[groupKey].isBatch,
            batchInfo: grouped[groupKey].batchInfo
          };
        }
      }
    });
    
    return Object.values(grouped);
  };

  if (!currentFacility) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Facility Selected</h2>
          <p className="text-gray-600">Please select a facility from the sidebar to manage products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">
              Manage products for <span className="font-medium">{currentFacility.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsFormOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Add Product
            </button>
            
            {/* Import Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowImportDropdown(!showImportDropdown)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                📥 Import ▼
              </button>
              {showImportDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[160px]">
                  <button
                    onClick={() => {
                      handleImportProducts('auto');
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 first:rounded-t-lg"
                  >
                    📄 Auto-detect
                  </button>
                  <button
                    onClick={() => {
                      handleImportProducts('csv');
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    📊 CSV File
                  </button>
                  <button
                    onClick={() => {
                      handleImportProducts('excel');
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    📈 Excel File
                  </button>
                  <button
                    onClick={() => {
                      handleImportProducts('json');
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 last:rounded-b-lg"
                  >
                    🔗 JSON File
                  </button>
                </div>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                📤 Export ▼
              </button>
              {showExportDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[180px]">
                  <button
                    onClick={() => {
                      handleExportProducts('csv', { includeAll: true });
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 first:rounded-t-lg"
                  >
                    📊 CSV (All Data)
                  </button>
                  <button
                    onClick={() => {
                      handleExportProducts('excel', { includeAll: true });
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    📈 Excel (All Data)
                  </button>
                  <button
                    onClick={() => {
                      handleExportProducts('csv', { summaryOnly: true });
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    📋 CSV (Summary)
                  </button>
                  <button
                    onClick={() => {
                      handleExportProducts('json', { includeAnalytics: true });
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    🔗 JSON (With Analytics)
                  </button>
                  <button
                    onClick={() => {
                      handleExportProducts('csv', { selectedOnly: true });
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 last:rounded-b-lg"
                    disabled={selectedProducts.length === 0}
                  >
                    ✅ Selected Items Only
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isSelectMode 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isSelectMode ? 'Cancel Select' : 'Select Items'}
            </button>
            {isSelectMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleBulkDeleteProducts}
                  disabled={selectedProducts.length === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Delete Selected ({selectedProducts.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Products</div>
              <div className="text-2xl font-bold text-gray-900">{analytics.summary?.totalProducts || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Value</div>
              <div className="text-2xl font-bold text-green-600">
                ${analytics.summary?.totalValue?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Low Stock Items</div>
              <div className="text-2xl font-bold text-red-600">{analytics.summary?.lowStockCount || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Categories</div>
              <div className="text-2xl font-bold text-blue-600">{analytics.analytics?.categories?.length || 0}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Books">Books</option>
                <option value="Health">Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={filters.stockStatus || ''}
                onChange={(e) => handleFilterChange({ ...filters, stockStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${sorting.sortBy}-${sorting.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleSortChange(sortBy, sortOrder);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low-High)</option>
                <option value="price-desc">Price (High-Low)</option>
                <option value="quantity-asc">Stock (Low-High)</option>
                <option value="quantity-desc">Stock (High-Low)</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Products Table */}
          <ProductTable
            products={products}
            onProductSelect={handleProductSelect}
            onBatchSelect={handleBatchSelect}
            sorting={sorting}
            onSortChange={handleSortChange}
            isSelectMode={isSelectMode}
            selectedProducts={selectedProducts}
            onProductSelection={handleProductSelection}
          />

          {/* Page Size Selector and Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setPageSize(newSize);
                  setPagination(prev => ({
                    ...prev,
                    page: 1,
                    limit: newSize,
                    pages: Math.ceil(allProducts.length / newSize)
                  }));
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                {pageLimitOptions.map(option => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                of {allProducts.length} groups ({allProducts.reduce((sum, group) => sum + group.totalQuantity, 0)} individual items)
              </span>
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-2 text-sm rounded ${
                      pagination.page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsFormOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <ProductForm
                product={selectedProduct}
                onSubmit={selectedProduct ? 
                  (data) => handleUpdateProduct(selectedProduct._id, data) : 
                  handleCreateProduct
                }
                onCancel={() => {
                  setSelectedProduct(null);
                  setIsFormOpen(false);
                }}
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal - Commented out until component is created */}
      {/* {isDetailOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <ProductDetail
              product={selectedProduct}
              onEdit={() => {
                setIsDetailOpen(false);
                setIsFormOpen(true);
              }}
              onDelete={() => {
                setIsDetailOpen(false);
                handleDeleteProduct(selectedProduct._id);
              }}
              onClose={() => {
                setSelectedProduct(null);
                setIsDetailOpen(false);
              }}
            />
          </div>
        </div>
      )} */}

      {/* Batch Manager Modal - Commented out until component is created */}
      {/* {isBatchManagerOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <BatchManager
              product={selectedProduct}
              onUpdate={fetchProducts}
              onClose={() => {
                setSelectedProduct(null);
                setIsBatchManagerOpen(false);
              }}
            />
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Products;
