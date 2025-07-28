import React, { useEffect, useState } from 'react';
import { getProductCategories } from '../api/categoryApi';

import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} from '../api/sectionApi';
import { getProductPlacements } from '../api/productApi';

const SectionManager = () => {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    name: '',
    allowedCategories: [],
    rackCount: '',
    length: '',
    width: '',
    height: ''
  });
  const [allCategories, setAllCategories] = useState(['All']);
  const [editId, setEditId] = useState(null);
  const [utilization, setUtilization] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [detailsSection, setDetailsSection] = useState(null);


  const load = async () => {
    const res = await getSections();
    setSections(res.data);
    // Fetch product placements for utilization
    const prodRes = await getProductPlacements();
    const products = prodRes.data;
    // Aggregate utilization per section
    const util = {};
    products.forEach(p => {
      (p.placements || []).forEach(pl => {
        if (!util[pl.section]) util[pl.section] = 0;
        util[pl.section] += pl.quantity || 0;
      });
    });
    setUtilization(util);
  };

  useEffect(() => {
    load();
    // Fetch all product categories for dropdown
    getProductCategories().then(cats => {
      // Also include categories already used in sections
      getSections().then(secRes => {
        const sectionCats = secRes.data.flatMap(s => s.allowedCategories).filter(Boolean);
        const allUnique = Array.from(new Set(['All', ...cats, ...sectionCats]));
        setAllCategories(allUnique);
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      allowedCategories: form.allowedCategories.includes('All') ? ['All'] : form.allowedCategories,
      rackCount: Number(form.rackCount),
      length: Number(form.length),
      width: Number(form.width),
      height: Number(form.height)
    };
    if (editId) {
      await updateSection(editId, payload);
      setEditId(null);
    } else {
      await createSection(payload);
    }
    setForm({ name: '', allowedCategories: [], rackCount: '', length: '', width: '', height: '' });
    load();
  };

  const handleEdit = (section) => {
    setEditId(section._id);
    setForm({
      name: section.name,
      allowedCategories: section.allowedCategories,
      rackCount: section.rackCount,
      length: section.length,
      width: section.width,
      height: section.height
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      await deleteSection(id);
      load();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Section Manager</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Section Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <label>Allowed Categories:</label>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search or add category"
            value={form.newCategory || ''}
            onChange={e => setForm({ ...form, newCategory: e.target.value })}
            style={{ width: '100%', marginBottom: '5px' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && form.newCategory && !allCategories.includes(form.newCategory)) {
                setAllCategories([...allCategories, form.newCategory]);
                setForm({
                  ...form,
                  allowedCategories: [...form.allowedCategories, form.newCategory],
                  newCategory: ''
                });
                e.preventDefault();
              }
            }}
          />
        <div style={{ border: '1px solid #ccc', maxHeight: '120px', overflowY: 'auto', background: '#fff', position: 'relative', borderRadius: '6px' }}>
            {allCategories.filter(cat => !form.newCategory || cat.toLowerCase().includes(form.newCategory.toLowerCase())).map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: form.allowedCategories.includes(cat) ? '#00796b' : '#fff' }}>
                <input
                  type="checkbox"
                  checked={form.allowedCategories.includes(cat)}
                  onChange={() => {
                    if (form.allowedCategories.includes(cat)) {
                      setForm({ ...form, allowedCategories: form.allowedCategories.filter(c => c !== cat) });
                    } else {
                      setForm({ ...form, allowedCategories: cat === 'All' ? ['All'] : [...form.allowedCategories.filter(c => c !== 'All'), cat] });
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ flex: 1, color: form.allowedCategories.includes(cat) ? '#fff' : '#222', fontWeight: form.allowedCategories.includes(cat) ? 'bold' : 'normal' }}>{cat}</span>
                {cat !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAllCategories(allCategories.filter(c => c !== cat));
                      setForm({ ...form, allowedCategories: form.allowedCategories.filter(c => c !== cat) });
                    }}
                    style={{ marginLeft: '8px', color: '#fff', background: '#d32f2f', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', padding: '0 6px' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <input
          type="number"
          placeholder="Number of Racks"
          value={form.rackCount}
          onChange={(e) => setForm({ ...form, rackCount: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Rack Length"
          value={form.length}
          onChange={(e) => setForm({ ...form, length: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Rack Width"
          value={form.width}
          onChange={(e) => setForm({ ...form, width: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Rack Height"
          value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })}
          required
        />
        <button type="submit">{editId ? 'Update' : 'Add'} Section</button>
        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({ name: '', allowedCategories: '', rackCount: '', length: '', width: '', height: '' });
            }}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        )}
      </form>

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Allowed Categories</th>
            <th>Rack Count</th>
            <th>Length</th>
            <th>Width</th>
            <th>Height</th>
            <th>Utilization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.allowedCategories.join(', ')}</td>
              <td>{s.rackCount}</td>
              <td>{s.length}</td>
              <td>{s.width}</td>
              <td>{s.height}</td>
              <td>
                <button
                  onClick={() => { setShowDetails(true); setDetailsSection(s.name); }}
                  style={{
                    background: '#00796b',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                  }}
                >
                  {utilization[s.name] || 0} placed
                </button>
              </td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s._id)} style={{ marginLeft: '5px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Utilization Details Modal */}
      {showDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000 }} onClick={() => setShowDetails(false)}>
          <div style={{ background: '#fff', color: '#222', padding: '24px', maxWidth: '520px', margin: '60px auto', borderRadius: '10px', boxShadow: '0 2px 12px #888', border: '1px solid #ccc' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#222', marginBottom: '10px' }}>Section: {detailsSection}</h3>
            <h4 style={{ color: '#333', marginBottom: '8px' }}>Products Placed</h4>
            <ul style={{ color: '#222', fontSize: '16px', marginBottom: '16px' }}>
              {sections.length > 0 && detailsSection && (
                sections.map(s => s.name === detailsSection ? (
                  <React.Fragment key={s.name}>
                    {Object.entries(utilization).filter(([sec]) => sec === s.name).map(([sec, qty]) => (
                      <li key={sec}><strong style={{ color: '#444' }}>{sec}</strong>: <span style={{ color: '#00796b' }}>{qty} placed</span></li>
                    ))}
                  </React.Fragment>
                ) : null)
              )}
            </ul>
            <button onClick={() => setShowDetails(false)} style={{ marginTop: '10px', background: '#00796b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManager;
