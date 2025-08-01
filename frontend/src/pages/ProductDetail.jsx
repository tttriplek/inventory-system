import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getSections, selectSectionPlacement } from '../api/sectionPlacementApi';

const ProductDetail = () => {
  const { name } = useParams();
  const [allProducts, setAllProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [batch, setBatch] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

const [destination, setDestination] = useState('');
const [distQuantity, setDistQuantity] = useState('');
const [showDistForm, setShowDistForm] = useState(false);


  const [skuSearch, setSkuSearch] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products?name=${encodeURIComponent(name)}`)
      .then((res) => {
        setAllProducts(res.data);
        setFiltered(res.data);
        console.log('Fetched products:', res.data);
      });
    getSections().then(res => setSections(res.data));
  }, [name]);

  useEffect(() => {
    let data = [...allProducts];

    if (batch) {
      data = data.filter((p) => p.batchId === batch);
    }

    if (dateRange.from) {
      data = data.filter((p) => new Date(p.receivedDate) >= new Date(dateRange.from));
    }

    if (dateRange.to) {
      data = data.filter((p) => new Date(p.receivedDate) <= new Date(dateRange.to));
    }

    if (skuSearch) {
      data = data.filter((p) => p.sku && p.sku.toLowerCase().includes(skuSearch.toLowerCase()));
    }

    setFiltered(data);
  }, [batch, dateRange, skuSearch, allProducts]);

  const totalQty = filtered.reduce((sum, p) => sum + (p.totalQuantity || p.quantity || 1), 0);
  const totalPrice = filtered.reduce((sum, p) => {
    const price = p.pricing?.sellingPrice || p.pricePerUnit || 0;
    const qty = p.totalQuantity || p.quantity || 1;
    return sum + (price * qty);
  }, 0);
  const avgPrice = totalQty > 0 ? (totalPrice / totalQty).toFixed(2) : 0;

  const uniqueBatches = [...new Set(allProducts.map((p) => p.batchId))];
  // State for move batch modal
  const [moveBatchId, setMoveBatchId] = useState('');
  const [moveSectionId, setMoveSectionId] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveBatchError, setMoveBatchError] = useState('');
 

  const openMoveModal = (batchId) => {
    setMoveBatchId(batchId);
    setMoveSectionId('');
    setMoveBatchError('');
    setShowMoveModal(true);
  };

  const handleMoveBatch = async () => {
    if (!moveBatchId || !moveSectionId) {
      setMoveBatchError('Please select a section to move the batch to.');
      return;
    }
    try {
      console.log('Attempting to move batch:', { batchId: moveBatchId, sectionId: moveSectionId });
      const res = await axios.put(`http://localhost:5000/api/products/move-batch`, {
        batchId: moveBatchId,
        sectionId: moveSectionId
      });
      // Check response for failed products
      let msg = '';
      if (res.data && Array.isArray(res.data.updated)) {
        const failed = res.data.updated.filter(p => p.status === 'Categories do not match');
        if (failed.length === 0) {
          msg = 'Batch moved successfully.';
        } else {
          msg = `Could not move batch. Reason: categories don\'t match.`;
        }
      } else {
        msg = 'Batch moved successfully.';
      }
      setMoveBatchError(msg);
      // Refresh product data
      axios
        .get(`http://localhost:5000/api/products?name=${encodeURIComponent(name)}`)
        .then((res) => {
          setAllProducts(res.data);
          setFiltered(res.data);
        });
    } catch (err) {
      let msg = 'Could not move batch. ';
      if (err.response?.data?.error) {
        msg += err.response.data.error;
      } else if (err.message) {
        msg += err.message;
      } else {
        msg += 'Unknown error.';
      }
      setMoveBatchError(msg);
    }
  };

  // Edit Product Function
  const handleEditProduct = (product) => {
    // Navigate to edit form or open modal
    // For now, we'll use a simple prompt to update basic fields
    const newQuantity = prompt('Enter new quantity:', product.totalQuantity || product.quantity || 1);
    const newPrice = prompt('Enter new price:', product.pricing?.sellingPrice || product.pricePerUnit || 0);
    
    if (newQuantity !== null && newPrice !== null) {
      const updatedProduct = {
        ...product,
        quantity: parseInt(newQuantity) || product.quantity,
        totalQuantity: parseInt(newQuantity) || product.totalQuantity,
        pricePerUnit: parseFloat(newPrice) || product.pricePerUnit,
        pricing: {
          ...product.pricing,
          sellingPrice: parseFloat(newPrice) || product.pricing?.sellingPrice
        }
      };

      // Send update request
      axios.put(`http://localhost:5000/api/products/${product._id}`, updatedProduct)
        .then(() => {
          alert('Product updated successfully');
          // Refresh data
          axios.get(`http://localhost:5000/api/products?name=${encodeURIComponent(name)}`)
            .then((res) => {
              setAllProducts(res.data);
              setFiltered(res.data);
            });
        })
        .catch((err) => {
          alert('Failed to update product: ' + (err.response?.data?.message || err.message));
        });
    }
  };

  // Delete Product Function
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      axios.delete(`http://localhost:5000/api/products/${productId}`)
        .then(() => {
          alert('Product deleted successfully');
          // Refresh data
          axios.get(`http://localhost:5000/api/products?name=${encodeURIComponent(name)}`)
            .then((res) => {
              setAllProducts(res.data);
              setFiltered(res.data);
            });
        })
        .catch((err) => {
          alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
        });
    }
  };

const batchSummaries = () => {
  const batchMap = {};

  for (const item of filtered) {
    const batch = item.batchId;
    if (!batchMap[batch]) {
      batchMap[batch] = {
        batchId: batch,
        totalQuantity: 0,       // Count of individual products in batch
        quantityRemaining: 0,   // Count of available individual products
        totalPrice: 0,
        avgPrice: 0,
        receivedDate: item.receivedDate
      };
    }

    // Each individual product represents 1 unit
    const qty = item.totalQuantity || item.quantity || 1; // Current quantity (should be 1 for individual products)
    const initQty = item.totalQuantity || item.initialQuantity || 1; // Initial quantity (should be 1)
    const price = item.pricing?.sellingPrice || item.pricePerUnit || 0;

    // Count individual products to get batch totals
    batchMap[batch].totalQuantity += initQty;
    batchMap[batch].quantityRemaining += qty;
    batchMap[batch].totalPrice += price * initQty;
  }

  for (const key in batchMap) {
    const b = batchMap[key];
    b.avgPrice = b.totalQuantity > 0 ? (b.totalPrice / b.totalQuantity).toFixed(3) : "0.000";
    if (b.quantityRemaining < 0) b.quantityRemaining = 0;
  }

  return Object.values(batchMap);
};




const handleDistribute = async () => {
  if (!destination || !distQuantity) {
    alert('Please enter both destination and quantity.');
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/products/distribute', {
      name,
      destination,
      quantity: Number(distQuantity)
    });

     alert("Distribution successful.");
    setFiltered(response.data);
    setDestination('');
    setDistQuantity('');
    setShowDistForm(false);
    // Refresh product data after distribution
    axios
      .get(`http://localhost:5000/api/products?name=${encodeURIComponent(name)}`)
      .then((res) => {
        setAllProducts(res.data);
        setFiltered(res.data);
      });
  } catch (err) {
    console.error(err);
    alert('Distribution failed: ' + (err.response?.data?.error || err.message));
  }
};
  

  // Destination Summary Data
const destinationSummaries = () => {
  const destMap = {};

  for (const item of filtered) {
    const batch = item.batchId;
    const distributions = item.distributions || [];

    for (const d of distributions) {
      const destId = `D${batch}`; // DMO-001, etc.

      if (!destMap[destId]) {
        destMap[destId] = {
          destinationId: destId,
          destination: d.destination,
          totalQuantity: 0,
          totalPrice: 0,
        };
      }

      destMap[destId].totalQuantity += d.quantity || 0;
      destMap[destId].totalPrice += d.priceSent || 0;
    }
  }

  // Format totalPrice to 3 decimals
  return Object.values(destMap).map((d) => ({
    ...d,
    totalPrice: d.totalPrice.toFixed(3)
  }));
};


  return (
    <div style={{ padding: '20px' }}>
      <h2>Product: {name}</h2>

      {/* Filter section */}
      <div style={{ marginBottom: '20px' }}>
        <label>Batch:</label>
        <select value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="">All</option>
          {uniqueBatches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: '20px' }}>From:</label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        />

        <label style={{ marginLeft: '10px' }}>To:</label>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        />
        <label style={{ marginLeft: '20px' }}>SKU Search:</label>
        <input
          type="text"
          value={skuSearch}
          onChange={e => setSkuSearch(e.target.value)}
          placeholder="Search by SKU"
          style={{ marginLeft: '8px' }}
        />
      </div>

      {/* Distribution Form Toggle */}
<div style={{ margin: '20px 0' }}>
  <button onClick={() => setShowDistForm(!showDistForm)}>
    {showDistForm ? 'Cancel Distribution' : 'Distribute Products'}
  </button>

  {showDistForm && (
    <div style={{ marginTop: '10px' }}>
      <label>Destination:</label>
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
        style={{ marginRight: '10px' }}
      />

      <label>Quantity:</label>
      <input
        type="number"
        value={distQuantity}
        onChange={(e) => setDistQuantity(e.target.value)}
        required
        min="1"
        style={{ marginRight: '10px' }}
      />

      <button onClick={handleDistribute}>Submit</button>
    </div>
  )}
</div>


      {/* Stats */}
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Total Quantity:</strong> {totalQty}</p>
        <p><strong>Average Price:</strong> ₵{avgPrice}</p>
        <p><strong>Total Value:</strong> ₵{totalPrice.toFixed(3)}</p>
      </div>

      {/* Placement Summary */}
      <h3>Placement Summary</h3>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>Section</th>
            <th>Quantity Placed</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            // Group placements by section and sum quantities
            const sectionMap = {};
            filtered.forEach(p => {
              (p.placements || []).forEach(pl => {
                if (!pl.section) return;
                if (!sectionMap[pl.section]) sectionMap[pl.section] = 0;
                sectionMap[pl.section] += pl.quantity || 0;
              });
            });
            const sectionEntries = Object.entries(sectionMap);
            if (sectionEntries.length === 0) {
              return <tr><td colSpan={2}>No placements yet</td></tr>;
            }
            return sectionEntries.map(([section, qty]) => (
              <tr key={section}>
                <td>{section}</td>
                <td>{qty}</td>
              </tr>
            ));
          })()}
        </tbody>
      </table>
      <p><strong>Unplaced Quantity:</strong> {
        totalQty - filtered.reduce((sum, p) => sum + (p.placements || []).reduce((s, pl) => s + (pl.quantity || 0), 0), 0)
      }</p>

      {/* Individual Products */}
      <h3>Individual Products</h3>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Batch ID</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Status</th>
            <th>Received Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => (
            <tr key={product._id}>
              <td>{product.sku || 'N/A'}</td>
              <td>{product.batchId}</td>
              <td>{product.totalQuantity || product.quantity || 1}</td>
              <td>₵{(product.pricing?.sellingPrice || product.pricePerUnit || 0).toFixed(2)}</td>
              <td>{product.status || 'active'}</td>
              <td>{product.receivedDate?.slice(0, 10)}</td>
              <td>
                <button 
                  onClick={() => handleEditProduct(product)}
                  style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product._id)}
                  style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Batch Summary */}
      <h3>Batch Summary</h3>
<table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginBottom: '20px' }}>
  <thead>
    <tr>
      <th>Batch ID</th>
      <th>Total Quantity</th>
      <th>Quantity Remaining</th>
      <th>Avg Price</th>
      <th>Total Price</th>
      <th>Received Date</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {batchSummaries().map((b) => (
      <tr key={b.batchId}>
        <td>{b.batchId}</td>
        <td>{b.totalQuantity}</td>
        <td>{b.quantityRemaining}</td>
        <td>₵{b.avgPrice}</td>
        <td>₵{b.totalPrice.toFixed(2)}</td>
        <td>{b.receivedDate?.slice(0, 10)}</td>
        <td>
          <button onClick={() => openMoveModal(b.batchId)}>Move Batch</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

{/* Move Batch Modal */}
{showMoveModal && (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: '#ffe082', padding: 32, borderRadius: 12, minWidth: 340, boxShadow: '0 4px 24px #222' }}>
      <h3 style={{ color: '#d84315', marginBottom: 16 }}>Move Batch: <span style={{ color: '#222' }}>{moveBatchId}</span></h3>
      <label style={{ fontWeight: 'bold' }}>Select Section:</label>
      <select value={moveSectionId} onChange={e => setMoveSectionId(e.target.value)} style={{ margin: '0 0 16px 8px', padding: '6px', borderRadius: '6px', border: '1px solid #d84315', background: '#ffffff', color: '#000000' }}>
        <option value="">Select Section</option>
        {sections.map(s => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>
      <br />
      <button onClick={handleMoveBatch} style={{ marginRight: 12, background: '#d84315', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 'bold' }}>Move</button>
      <button onClick={() => setShowMoveModal(false)} style={{ background: '#fff', color: '#d84315', border: '1px solid #d84315', borderRadius: '6px', padding: '8px 18px', fontWeight: 'bold' }}>Cancel</button>
      {moveBatchError && (
        <div style={{ marginTop: 18, color: '#b71c1c', background: '#fff3e0', padding: '10px', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center' }}>
          {moveBatchError}
        </div>
      )}
    </div>
  </div>
)}


     <h4>Destination Summary</h4>
<table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
  <thead>
    <tr>
      <th>Destination ID</th>
      <th>Destination</th>
      <th>Total Quantity</th>
      <th>Total Price</th>
    </tr>
  </thead>
  <tbody>
    {destinationSummaries().map((d) => (
      <tr key={d.destinationId}>
        <td>{d.destinationId}</td>
        <td>{d.destination}</td>
        <td>{d.totalQuantity}</td>
        <td>₵{d.totalPrice}</td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default ProductDetail;




