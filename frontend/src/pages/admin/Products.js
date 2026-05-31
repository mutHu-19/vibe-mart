import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';
import ImageUploader from '../../components/ImageUploader';

const EMPTY_PRODUCT = { category_id: '', subcategory_id: '', name: '', description: '', price: '', compare_price: '', sku: '', cost_price: '', images: [''], is_active: 1, is_featured: 1, sort_order: 0 };
const EMPTY_VARIANT = { size: '', colour: '', colour_hex: '#000000', stock_qty: 0, extra_price: 0 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [variants, setVariants] = useState([{ ...EMPTY_VARIANT }]);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [p, c] = await Promise.all([api.get('/products/admin/all'), api.get('/categories')]);
    setProducts(p.data);
    setCategories(c.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(EMPTY_PRODUCT); setVariants([{ ...EMPTY_VARIANT }]); setEditing(null); setShowForm(true); };
  const openEdit = async (p) => {
    const { data } = await api.get(`/products/${p.slug}`);
    setForm({ ...data, cost_price: data.cost_price || '', images: data.images?.length ? data.images : [''], subcategory_id: data.subcategory_id || '', is_featured: data.is_featured ?? 1, sort_order: data.sort_order || 0 });
    setVariants(data.variants?.length ? data.variants : [{ ...EMPTY_VARIANT }]);
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, images: form.images.filter(i => i), variants };
      if (editing) {
        await api.put(`/products/${editing}`, payload);
        await api.put(`/products/${editing}/variants`, { variants });
        showToast('Product updated', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created', 'success');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.error || 'Error saving', 'error'); }
    setSaving(false);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    showToast('Product deactivated');
    fetchAll();
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Products</h2>
          <p style={{ color: '#888', fontSize: 12 }}>{products.length} total products</p>
        </div>
        <button className="btn btn-danger" onClick={openNew}>+ Add Product</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input className="admin-input" style={{ maxWidth: 300 }} placeholder="🔍 Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Cost</th><th>Margin</th><th>Stock</th><th>Featured</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = p.cost_price && p.price
                  ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0) + '%'
                  : '—';
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>SKU: {p.sku}</div>}
                    </td>
                    <td style={{ color: '#888', fontSize: 12 }}>{p.category_name || '—'}</td>
                    <td style={{ fontWeight: 700 }}>Rs. {parseFloat(p.price).toLocaleString()}</td>
                    <td style={{ fontSize: 12, color: '#888' }}>{p.cost_price ? `Rs. ${parseFloat(p.cost_price).toLocaleString()}` : '—'}</td>
                    <td style={{ fontSize: 12, color: margin !== '—' ? '#16a34a' : '#aaa', fontWeight: 700 }}>{margin}</td>
                    <td>
                      <span className={`stock-badge ${(p.total_stock || 0) === 0 ? 'stock-out' : (p.total_stock || 0) < 5 ? 'stock-low' : 'stock-ok'}`}>
                        {p.total_stock || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.is_featured ? '#d97706' : '#ccc' }}>
                        {p.is_featured ? '⭐ Yes' : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        {p.is_active ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(p.id)}>Off</button> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 760, borderRadius: 10, padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 800, fontSize: 16 }}>{editing ? '✏️ Edit Product' : '+ New Product'}</h2>
              <button className="modal-close" style={{ position: 'static' }} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Product Name *</label>
                    <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Category</label>
                    <select className="admin-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_id: '' }))}>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Subcategory</label>
                    <select className="admin-input" value={form.subcategory_id} onChange={e => setForm(f => ({ ...f, subcategory_id: e.target.value }))}>
                      <option value="">No subcategory</option>
                      {categories.find(c => String(c.id) === String(form.category_id))?.subcategories?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <textarea className="admin-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Sell Price (Rs.) *</label>
                    <input className="admin-input" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Compare Price (Rs.)</label>
                    <input className="admin-input" type="number" step="0.01" value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Cost Price (Rs.) <span style={{ color: '#16a34a' }}>for P&L</span></label>
                    <input className="admin-input" type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="Your buying cost" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">SKU</label>
                    <input className="admin-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                  </div>
                <div className="admin-form-group">
                  <label className="admin-label">Product Images (up to 5) — First image is the main photo</label>
                  <ImageUploader
                    images={form.images.filter(Boolean)}
                    onChange={urls => setForm(f => ({ ...f, images: urls }))}
                    max={5}
                  />
                </div>
                </div>

                {/* Featured + Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Sort Order <span style={{ color: '#888', fontWeight: 400 }}>(lower = first)</span></label>
                    <input className="admin-input" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Show on Homepage?</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      {[{ val: 1, label: '⭐ Featured' }, { val: 0, label: 'Hidden' }].map(opt => (
                        <button key={opt.val} type="button"
                          onClick={() => setForm(f => ({ ...f, is_featured: opt.val }))}
                          style={{ flex: 1, padding: '8px', borderRadius: 4, border: `1.5px solid ${form.is_featured === opt.val ? '#e62e04' : '#e8e8e8'}`, background: form.is_featured === opt.val ? '#fff1ee' : '#fff', color: form.is_featured === opt.val ? '#e62e04' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Featured products appear on the homepage rows</div>
                  </div>
                </div>

                {/* Variants */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="admin-label" style={{ margin: 0 }}>Variants (Size / Colour / Stock)</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setVariants(v => [...v, { ...EMPTY_VARIANT }])}>+ Add</button>
                  </div>
                  <div style={{ background: '#f9f9f9', borderRadius: 6, padding: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px 80px 80px 28px', gap: 6, marginBottom: 4 }}>
                      {['Size', 'Colour', 'Hex', 'Stock', '+Price', ''].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>
                    {variants.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px 80px 80px 28px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                        <input className="admin-input" placeholder="e.g. XL" value={v.size} onChange={e => { const nv = [...variants]; nv[i].size = e.target.value; setVariants(nv); }} />
                        <input className="admin-input" placeholder="e.g. Red" value={v.colour} onChange={e => { const nv = [...variants]; nv[i].colour = e.target.value; setVariants(nv); }} />
                        <input type="color" value={v.colour_hex || '#000000'} onChange={e => { const nv = [...variants]; nv[i].colour_hex = e.target.value; setVariants(nv); }} style={{ width: 44, height: 34, padding: 2, border: '1.5px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }} />
                        <input className="admin-input" type="number" min="0" placeholder="Stock" value={v.stock_qty} onChange={e => { const nv = [...variants]; nv[i].stock_qty = parseInt(e.target.value) || 0; setVariants(nv); }} />
                        <input className="admin-input" type="number" step="0.01" placeholder="+0" value={v.extra_price} onChange={e => { const nv = [...variants]; nv[i].extra_price = parseFloat(e.target.value) || 0; setVariants(nv); }} />
                        <button type="button" onClick={() => setVariants(v => v.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e62e04', fontSize: 16, fontWeight: 900 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={saving}>
                    {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
