import React from 'react';

const ProductTable = ({ 
  products, 
  onProductSelect, 
  onBatchSelect,
  sorting,
  onSortChange,
  isSelectMode = false,
  selectedProducts = [],
  onProductSelection
}) => {
  const handleSort = (field) => {
    const newOrder = sorting.sortBy === field && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  };

  const getSortIcon = (field) => {
    if (sorting.sortBy !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sorting.sortOrder === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4l9 16 9-16H3z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 20L12 4 3 20h18z" />
      </svg>
    );
  };

  const getStockStatus = (product) => {
    const totalQuantity = product.totalQuantity || product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || product.quantity || 0;
    const minimumStock = product.minimumStock || 0;
    
    if (totalQuantity === 0) return { status: 'out-of-stock', text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (totalQuantity <= minimumStock) return { status: 'low-stock', text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { status: 'in-stock', text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const formatPrice = (price) => {
    if (typeof price === 'object' && price.base) {
      return `$${price.base.toFixed(2)}`;
    }
    return `$${(price || 0).toFixed(2)}`;
  };

  const getExpiringBatches = (batches) => {
    if (!batches || !Array.isArray(batches)) return 0;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return batches.filter(batch => 
      batch.expiryDate && new Date(batch.expiryDate) <= thirtyDaysFromNow && batch.quantity > 0
    ).length;
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8v.01M6 8v.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Get started by adding your first product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isSelectMode && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) => {
                      products.forEach(product => {
                        const isSelected = e.target.checked;
                        const alreadySelected = selectedProducts.includes(product._id);
                        if (isSelected && !alreadySelected) {
                          onProductSelection(product._id, true);
                        } else if (!isSelected && alreadySelected) {
                          onProductSelection(product._id, false);
                        }
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </th>
              )}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Product Name
                  {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center">
                  Stock
                  {getSortIcon('quantity')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Price
                  {getSortIcon('price')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batches
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => {
              const stockStatus = getStockStatus(product);
              const totalQuantity = product.totalQuantity || product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || product.quantity || 0;
              const expiringBatches = getExpiringBatches(product.batches);
              
              return (
                <tr key={`${product._id || product.name || 'product'}-${index}`} className="hover:bg-gray-50">
                  {isSelectMode && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={(e) => onProductSelection(product._id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onProductSelect(product)}
                        >
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {product.skuPrefix || product.sku || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-semibold">{product.totalQuantity || product.quantity || 0}</span>
                      {product.unit && <span className="text-gray-500 ml-1">{product.unit}</span>}
                      {product.isBatch && product.individualProducts && (
                        <div className="text-xs text-gray-500">
                          ({product.individualProducts.length} items in batch)
                        </div>
                      )}
                      {product.batchInfo && product.batchInfo !== 'Individual Item' && (
                        <div className="text-xs text-blue-600">
                          Batch: {product.batchInfo}
                        </div>
                      )}
                    </div>
                    {product.minimumStock && (
                      <div className="text-xs text-gray-500">
                        Min: {product.minimumStock}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.pricePerUnit ? `$${product.pricePerUnit.toFixed(2)}` : formatPrice(product.price)}
                      {product.pricePerUnit && (
                        <span className="text-xs text-gray-500 ml-1">per unit</span>
                      )}
                    </div>
                    {product.totalPrice && (
                      <div className="text-xs text-gray-500">
                        Total: ${product.totalPrice.toFixed(2)}
                      </div>
                    )}
                    {product.price?.cost && (
                      <div className="text-xs text-gray-500">
                        Cost: ${product.price.cost.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-900">
                        {product.individualProducts ? 1 : (product.batches?.length || 0)}
                      </span>
                      {product.batchId && (
                        <div className="text-xs text-gray-500 font-mono">
                          {product.batchId}
                        </div>
                      )}
                      {expiringBatches > 0 && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">
                          {expiringBatches} exp.
                        </span>
                      )}

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;



