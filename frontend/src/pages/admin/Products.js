import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';
import ImageUploader from '../../components/ImageUploader';
import RichTextEditor from '../../components/RichTextEditor';

const EMPTY_VARIANT = { size: '', colour: '', colour_hex: '#000000', stock_qty: 0, extra_price: 0, image_url: '' };
const EMPTY_PRODUCT = {
  category_id: '', subcategory_id: '', category_ids: [], subcategory_ids: [],
  name: '', description: '', price: '', compare_price: '',
  sku: '', cost_price: '', images: [''], is_active: 1, is_featured: 1, sort_order: 0
};

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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    setForm({
      ...data,
      cost_price: data.cost_price || '',
      images: data.images?.length ? data.images : [''],
      subcategory_id: data.subcategory_id || '',
      is_featured: data.is_featured ?? 1,
      sort_order: data.sort_order || 0,
      category_ids: (data.category_ids || []).map(String),
      subcategory_ids: (data.subcategory_ids || []).map(String),
    });
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
    if (!window.confirm('Deactivate this product? (You can reactivate it later)')) return;
    await api.put(`/products/${id}/deactivate`);
    showToast('Product deactivated');
    fetchAll();
  };

  const handleActivate = async (p) => {
    await api.put(`/products/${p.id}`, { ...p, is_active: 1, images: p.images || [], category_ids: p.category_ids || [], subcategory_ids: p.subcategory_ids || [] });
    showToast('Product activated ✅', 'success');
    fetchAll();
  };

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/products/${confirmDelete.id}`);
      showToast(
        data.had_history
          ? '🗑️ Product deleted (sales history preserved)'
          : '🗑️ Product permanently deleted',
        'success'
      );
      setConfirmDelete(null);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.error || 'Delete failed', 'error'); }
    setDeleting(false);
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
              <tr><th>Product</th><th>Categories</th><th>Subcategories</th><th>Price</th><th>Cost</th><th>Margin</th><th>Stock</th><th>Featured</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = p.cost_price && p.price
                  ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0) + '%'
                  : '—';
                const catNames = (p.category_ids || [])
                  .map(id => categories.find(c => String(c.id) === String(id))?.name)
                  .filter(Boolean);
                const subNames = (p.subcategory_ids || [])
                  .map(id => categories.flatMap(c => c.subcategories || []).find(s => String(s.id) === String(id))?.name)
                  .filter(Boolean);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>SKU: {p.sku}</div>}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {catNames.length > 0 ? (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 160 }}>
                          {catNames.map(n => (
                            <span key={n} style={{ background: '#e0f0ff', color: '#0277bd', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{n}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {subNames.length > 0 ? (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 160 }}>
                          {subNames.map(n => (
                            <span key={n} style={{ background: '#f3e8ff', color: '#7c3aed', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{n}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
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
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        {p.is_active
                          ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(p.id)}>Off</button>
                          : <button className="btn btn-success btn-sm" onClick={() => handleActivate(p)}>On</button>
                        }
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => setConfirmDelete(p)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No products found</td></tr>}
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
                <div className="admin-form-group">
                  <label className="admin-label">Product Name *</label>
                  <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Primary Category</label>
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

                {/* Multi-category checkboxes */}
                <div className="admin-form-group">
                  <label className="admin-label">Also Show In <span style={{ color: '#888', fontWeight: 400, textTransform: 'none' }}>(tick all categories where this should also appear)</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: '#f9f9f9', borderRadius: 8, padding: 12, border: '1.5px solid #e8e8e8' }}>
                    {categories.map(c => {
                      const isPrimary = String(c.id) === String(form.category_id);
                      const isChecked = isPrimary || form.category_ids.includes(String(c.id));
                      return (
                        <label key={c.id}
                          onClick={() => {
                            if (isPrimary) return; // primary always checked
                            setForm(f => {
                              const nextCatIds = isChecked
                                ? f.category_ids.filter(id => id !== String(c.id))
                                : [...f.category_ids, String(c.id)];
                              // If unchecking a category, also remove its subcategories from selection
                              let nextSubIds = f.subcategory_ids;
                              if (isChecked) {
                                const removedCat = categories.find(cc => String(cc.id) === String(c.id));
                                const removedSubIds = (removedCat?.subcategories || []).map(s => String(s.id));
                                nextSubIds = f.subcategory_ids.filter(id => !removedSubIds.includes(id));
                              }
                              return { ...f, category_ids: nextCatIds, subcategory_ids: nextSubIds };
                            });
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20, cursor: isPrimary ? 'default' : 'pointer',
                            background: isChecked ? '#0288d1' : '#fff',
                            color: isChecked ? '#fff' : '#555',
                            border: `1.5px solid ${isChecked ? '#0288d1' : '#e0e0e0'}`,
                            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                          }}>
                          {isChecked && '✓ '}{c.name}{isPrimary && ' (primary)'}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-subcategory checkboxes — shows subcategories of all selected categories */}
                {(() => {
                  const selectedCatIds = new Set([form.category_id, ...form.category_ids].filter(Boolean).map(String));
                  const availableSubs = categories
                    .filter(c => selectedCatIds.has(String(c.id)))
                    .flatMap(c => (c.subcategories || []).map(s => ({ ...s, parentName: c.name })));

                  if (availableSubs.length === 0) return null;

                  return (
                    <div className="admin-form-group">
                      <label className="admin-label">Subcategories <span style={{ color: '#888', fontWeight: 400, textTransform: 'none' }}>(tick all that apply — grouped by parent category)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: '#f9f9f9', borderRadius: 8, padding: 12, border: '1.5px solid #e8e8e8' }}>
                        {availableSubs.map(s => {
                          const isPrimary = String(s.id) === String(form.subcategory_id);
                          const isChecked = isPrimary || form.subcategory_ids.includes(String(s.id));
                          return (
                            <label key={s.id}
                              onClick={() => {
                                if (isPrimary) return;
                                setForm(f => ({
                                  ...f,
                                  subcategory_ids: isChecked
                                    ? f.subcategory_ids.filter(id => id !== String(s.id))
                                    : [...f.subcategory_ids, String(s.id)]
                                }));
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 20, cursor: isPrimary ? 'default' : 'pointer',
                                background: isChecked ? '#7c3aed' : '#fff',
                                color: isChecked ? '#fff' : '#555',
                                border: `1.5px solid ${isChecked ? '#7c3aed' : '#e0e0e0'}`,
                                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                              }}>
                              {isChecked && '✓ '}{s.name}
                              <span style={{ fontSize: 10, opacity: 0.7 }}>({s.parentName}{isPrimary ? ' · primary' : ''})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Rich text description */}
                <div className="admin-form-group">
                  <label className="admin-label">Description <span style={{ color: '#888', fontWeight: 400, textTransform: 'none' }}>— format with bold, italic, lists</span></label>
                  <RichTextEditor
                    value={form.description}
                    onChange={html => setForm(f => ({ ...f, description: html }))}
                    placeholder="Write an attractive description… e.g. **Premium quality** material with *elegant* finish."
                  />
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
                          style={{ flex: 1, padding: '8px', borderRadius: 4, border: `1.5px solid ${form.is_featured === opt.val ? '#0288d1' : '#e8e8e8'}`, background: form.is_featured === opt.val ? '#e0f0ff' : '#fff', color: form.is_featured === opt.val ? '#0277bd' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Variants */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <label className="admin-label" style={{ margin: 0 }}>Variants</label>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Each colour can have its own image</div>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setVariants(v => [...v, { ...EMPTY_VARIANT }])}>+ Add Variant</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {variants.map((v, i) => (
                      <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #e8e8e8', borderRadius: 8, padding: 12, position: 'relative' }}>
                        <button type="button" onClick={() => setVariants(vs => vs.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#e62e04', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>×</button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px 90px 90px', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Size</div>
                            <input className="admin-input" placeholder="e.g. XL" value={v.size || ''} onChange={e => { const nv = [...variants]; nv[i].size = e.target.value; setVariants(nv); }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Colour Name</div>
                            <input className="admin-input" placeholder="e.g. Red" value={v.colour || ''} onChange={e => { const nv = [...variants]; nv[i].colour = e.target.value; setVariants(nv); }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Hex</div>
                            <input type="color" value={v.colour_hex || '#000000'} onChange={e => { const nv = [...variants]; nv[i].colour_hex = e.target.value; setVariants(nv); }}
                              style={{ width: 44, height: 34, padding: 2, border: '1.5px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Stock</div>
                            <input className="admin-input" type="number" min="0" placeholder="0" value={v.stock_qty} onChange={e => { const nv = [...variants]; nv[i].stock_qty = parseInt(e.target.value) || 0; setVariants(nv); }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>+Price</div>
                            <input className="admin-input" type="number" step="0.01" placeholder="0" value={v.extra_price} onChange={e => { const nv = [...variants]; nv[i].extra_price = parseFloat(e.target.value) || 0; setVariants(nv); }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 6 }}>
                            Colour Image <span style={{ color: '#0288d1', fontWeight: 700 }}>— shown when selected</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {v.image_url ? (
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img src={v.image_url} alt={v.colour}
                                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `2px solid ${v.colour_hex || '#e8e8e8'}` }} />
                                <button type="button"
                                  onClick={() => { const nv = [...variants]; nv[i].image_url = ''; setVariants(nv); }}
                                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#e62e04', border: 'none', borderRadius: '50%', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>×</button>
                              </div>
                            ) : (
                              <div style={{ width: 64, height: 64, background: '#eee', borderRadius: 6, border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📷</div>
                            )}
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'inline-block', marginBottom: 6 }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const nv = [...variants];
                                    nv[i]._uploading = true;
                                    setVariants([...nv]);
                                    try {
                                      const fd = new FormData();
                                      fd.append('images', file);
                                      const { data } = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                      nv[i].image_url = data.urls?.[0] || '';
                                    } catch { alert('Upload failed'); }
                                    nv[i]._uploading = false;
                                    setVariants([...nv]);
                                  }}
                                />
                                <span style={{ background: '#1b1b1b', color: '#fff', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  {v._uploading ? '⏳ Uploading…' : '📤 Upload Image'}
                                </span>
                              </label>
                              <input className="admin-input" placeholder="Or paste image URL…"
                                value={v.image_url || ''}
                                onChange={e => { const nv = [...variants]; nv[i].image_url = e.target.value; setVariants(nv); }}
                                style={{ fontSize: 12 }}
                              />
                            </div>
                          </div>
                        </div>
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

      {/* Permanent Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 420, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Delete "{confirmDelete.name}"?</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>
                This will <strong style={{ color: '#dc2626' }}>permanently remove</strong> this product and its variants.
              </p>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 20 }}>
                Past bills and orders referencing this product will keep their history.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handlePermanentDelete} disabled={deleting}
                  style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
