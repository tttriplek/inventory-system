import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import ProductTable from '../components/ProductTable';
import ProductForm from '../components/ProductForm';
// import ProductDetail from '../components/ProductDetail';
// import BatchManager from '../components/BatchManager';

const Products = () => {
  const { currentFacility } = useFacility();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBatchManagerOpen, setIsBatchManagerOpen] = useState(false);
  
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
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch products when facility changes or filters change
  useEffect(() => {
    if (currentFacility) {
      fetchProducts();
      fetchAnalytics();
    }
  }, [currentFacility, filters, pagination.page, pagination.limit, sorting]);

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

      // Only include non-empty filter values
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      });

      // Add filters only if they have values
      if (filters.search && filters.search.trim()) {
        queryParams.append('search', filters.search.trim());
      }
      if (filters.category && filters.category.trim()) {
        queryParams.append('category', filters.category.trim());
      }
      if (filters.stockStatus && filters.stockStatus.trim()) {
        queryParams.append('stockStatus', filters.stockStatus.trim());
      }

      const response = await fetch(`http://localhost:5000/api/products?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch products');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }

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
          setAnalytics(data.data);
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

      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Facility-ID': facilityId
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete product');
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
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleBatchSelect = (product) => {
    setSelectedProduct(product);
    setIsBatchManagerOpen(true);
  };

  const getCurrentFacilityId = () => {
    return currentFacility?._id || currentFacility?.id;
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
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Add Product
          </button>
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
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onBatchSelect={handleBatchSelect}
            sorting={sorting}
            onSortChange={handleSortChange}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
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
            </div>
          )}
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
