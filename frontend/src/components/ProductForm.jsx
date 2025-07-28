import React, { useState, useEffect } from 'react';

const ProductForm = ({ product, onSubmit, onCancel, hideHeader = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: {
      primary: '',
      secondary: '',
      tags: []
    },
    unit: '',
    pricing: {
      cost: 0,
      sellingPrice: 0,
      currency: 'USD'
    },
    quantity: 0,
    reorderLevel: 0,
    maxStockLevel: 1000,
    location: {
      warehouse: '',
      zone: '',
      aisle: '',
      shelf: '',
      bin: ''
    },
    specifications: {
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      color: '',
      size: '',
      model: '',
      brand: ''
    },
    tags: [],
    suppliers: [],
    compliance: {
      certifications: [],
      regulations: [],
      requirements: []
    },
    nutrition: {
      calories: '',
      servingSize: '',
      ingredients: []
    },
    quality: {
      grade: 'A',
      inspectionDate: '',
      notes: ''
    },
    storage: {
      temperature: {
        min: '',
        max: '',
        unit: 'C'
      },
      humidity: {
        min: '',
        max: ''
      },
      conditions: []
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: {
          primary: product.category?.primary || product.category || '',
          secondary: product.category?.secondary || '',
          tags: product.category?.tags || []
        },
        unit: product.unit || '',
        pricing: {
          cost: product.pricing?.cost || product.price?.cost || 0,
          sellingPrice: product.pricing?.sellingPrice || product.price?.base || product.price || 0,
          currency: product.pricing?.currency || product.price?.currency || 'USD'
        },
        quantity: product.quantity || 0,
        reorderLevel: product.reorderLevel || product.minimumStock || 0,
        maxStockLevel: product.maxStockLevel || product.maximumStock || 1000,
        location: {
          warehouse: product.location?.warehouse || '',
          zone: product.location?.zone || '',
          aisle: product.location?.aisle || '',
          shelf: product.location?.shelf || '',
          bin: product.location?.bin || ''
        },
        specifications: {
          weight: product.specifications?.weight || '',
          dimensions: {
            length: product.specifications?.dimensions?.length || '',
            width: product.specifications?.dimensions?.width || '',
            height: product.specifications?.dimensions?.height || '',
            unit: product.specifications?.dimensions?.unit || 'cm'
          },
          color: product.specifications?.color || '',
          size: product.specifications?.size || '',
          model: product.specifications?.model || '',
          brand: product.specifications?.brand || ''
        },
        tags: product.tags || [],
        suppliers: product.suppliers || [],
        compliance: {
          certifications: product.compliance?.certifications || [],
          regulations: product.compliance?.regulations || [],
          requirements: product.compliance?.requirements || []
        },
        nutrition: {
          calories: product.nutrition?.calories || '',
          servingSize: product.nutrition?.servingSize || '',
          ingredients: product.nutrition?.ingredients || []
        },
        quality: {
          grade: product.quality?.grade || 'A',
          inspectionDate: product.quality?.inspectionDate || '',
          notes: product.quality?.notes || ''
        },
        storage: {
          temperature: {
            min: product.storage?.temperature?.min || '',
            max: product.storage?.temperature?.max || '',
            unit: product.storage?.temperature?.unit || 'C'
          },
          humidity: {
            min: product.storage?.humidity?.min || '',
            max: product.storage?.humidity?.max || ''
          },
          conditions: product.storage?.conditions || []
        }
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.category.primary.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.pricing.sellingPrice <= 0) {
      newErrors.price = 'Selling price must be greater than 0';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (formData.reorderLevel < 0) {
      newErrors.reorderLevel = 'Reorder level cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Transform the form data to match backend expectations
      const backendData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category.primary.trim(),
        quantity: parseInt(formData.quantity) || 0,
        pricePerUnit: parseFloat(formData.pricing.sellingPrice) || 0,
        description: formData.description.trim(),
        unit: formData.unit,
        // Optional nested fields that the backend supports
        origin: {
          supplier: formData.suppliers.length > 0 ? formData.suppliers[0] : ''
        },
        placement: {
          section: formData.location.warehouse || ''
        },
        // Additional data that might be used by the backend
        specifications: formData.specifications,
        compliance: formData.compliance,
        nutrition: formData.nutrition
      };
      
      await onSubmit(backendData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category.primary"
                value={formData.category.primary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Books">Books</option>
                <option value="Health">Health</option>
                <option value="Tools">Tools</option>
                <option value="Home">Home</option>
                <option value="Sports">Sports</option>
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., pieces, kg, liters"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price * ($)
              </label>
              <input
                type="number"
                name="pricing.sellingPrice"
                value={formData.pricing.sellingPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                name="pricing.cost"
                value={formData.pricing.cost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reorderLevel ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.reorderLevel && <p className="mt-1 text-sm text-red-600">{errors.reorderLevel}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Stock
              </label>
              <input
                type="number"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <input
                type="text"
                name="location.warehouse"
                value={formData.location.warehouse}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                name="location.zone"
                value={formData.location.zone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aisle</label>
              <input
                type="text"
                name="location.aisle"
                value={formData.location.aisle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf</label>
              <input
                type="text"
                name="location.shelf"
                value={formData.location.shelf}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="S1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bin</label>
              <input
                type="text"
                name="location.bin"
                value={formData.location.bin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="B1"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 flex justify-end space-x-3 pt-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
