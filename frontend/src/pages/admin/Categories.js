import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';
import ImageUploader from '../../components/ImageUploader';

const CAT_ICONS = {
  'kitchen-items': '🍳', 'bags-purses': '👜', 'toys-games': '🧸',
  'home-decor': '🏡', 'electronics': '📱',
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '', sort_order: 0 });

  // Subcategory form
  const [showSubForm, setShowSubForm] = useState(false);
  const [subParentId, setSubParentId] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({ name: '', image_url: '', sort_order: 0 });

  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories/admin/all');
      setCategories(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Category handlers ──
  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', image_url: '', sort_order: categories.length });
    setShowCatForm(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '', sort_order: cat.sort_order || 0 });
    setShowCatForm(true);
  };

  const saveCat = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { ...catForm, is_active: 1 });
        showToast('Category updated ✅', 'success');
      } else {
        await api.post('/categories', catForm);
        showToast('Category created ✅', 'success');
      }
      setShowCatForm(false);
      fetchCategories();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    setSaving(false);
  };

  const deleteCat = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    await api.delete(`/categories/${id}`);
    showToast('Category deactivated');
    fetchCategories();
  };

  // ── Subcategory handlers ──
  const openNewSub = (catId) => {
    setEditingSub(null);
    setSubParentId(catId);
    setSubForm({ name: '', image_url: '', sort_order: 0 });
    setShowSubForm(true);
  };

  const openEditSub = (sub, catId) => {
    setEditingSub(sub);
    setSubParentId(catId);
    setSubForm({ name: sub.name, image_url: sub.image_url || '', sort_order: sub.sort_order || 0 });
    setShowSubForm(true);
  };

  const saveSub = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSub) {
        await api.put(`/categories/subcategories/${editingSub.id}`, { ...subForm, is_active: 1 });
        showToast('Subcategory updated ✅', 'success');
      } else {
        await api.post(`/categories/${subParentId}/subcategories`, subForm);
        showToast('Subcategory added ✅', 'success');
      }
      setShowSubForm(false);
      fetchCategories();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    setSaving(false);
  };

  const deleteSub = async (id) => {
    if (!window.confirm('Delete this subcategory?')) return;
    await api.delete(`/categories/subcategories/${id}`);
    showToast('Subcategory deleted');
    fetchCategories();
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Categories & Subcategories</h2>
          <p style={{ color: '#888', fontSize: 12 }}>{categories.length} categories · Click a category to manage its subcategories</p>
        </div>
        <button className="btn btn-danger" onClick={openNewCat}>+ Add Category</button>
      </div>

      {/* Categories list */}
      {categories.map(cat => (
        <div key={cat.id} className="admin-card" style={{ marginBottom: 12 }}>
          {/* Category header row */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{CAT_ICONS[cat.slug] || '📦'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {cat.subcategories?.length || 0} subcategories ·
                Order: {cat.sort_order} ·
                <span style={{ color: cat.is_active ? '#16a34a' : '#e62e04', fontWeight: 700 }}>
                  {cat.is_active ? ' Active' : ' Inactive'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                {expandedCat === cat.id ? '▲ Hide' : '▼ Subcats'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => openEditCat(cat)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteCat(cat.id)}>Off</button>
            </div>
          </div>

          {/* Subcategories expanded */}
          {expandedCat === cat.id && (
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Subcategories
                </span>
                <button className="btn btn-success btn-sm" onClick={() => openNewSub(cat.id)}>+ Add Subcategory</button>
              </div>

              {(!cat.subcategories || cat.subcategories.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#ccc', fontSize: 13 }}>
                  No subcategories yet — click "+ Add Subcategory"
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{sub.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>Order: {sub.sort_order}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditSub(sub, cat.id)}
                          style={{ padding: '3px 8px', fontSize: 11 }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteSub(sub.id)}
                          style={{ padding: '3px 8px', fontSize: 11 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ccc' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏷️</div>
          <p>No categories yet</p>
          <button className="btn btn-danger" onClick={openNewCat} style={{ marginTop: 14 }}>Add First Category</button>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="modal-overlay" onClick={() => setShowCatForm(false)}>
          <div className="modal-box" style={{ maxWidth: 460, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>{editingCat ? '✏️ Edit Category' : '+ New Category'}</h3>
              <button className="modal-close" style={{ position: 'static' }} onClick={() => setShowCatForm(false)}>×</button>
            </div>
            <form onSubmit={saveCat} style={{ padding: 20 }}>
              <div className="admin-form-group">
                <label className="admin-label">Category Name *</label>
                <input className="admin-input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Bags & Purses" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <input className="admin-input" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Category Image</label>
                <ImageUploader
                  images={catForm.image_url ? [catForm.image_url] : []}
                  onChange={urls => setCatForm(f => ({ ...f, image_url: urls[0] || '' }))}
                  max={1}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Sort Order <span style={{ color: '#888', fontWeight: 400 }}>(lower = first on homepage)</span></label>
                <input className="admin-input" type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCatForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>{saving ? 'Saving…' : editingCat ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Form Modal */}
      {showSubForm && (
        <div className="modal-overlay" onClick={() => setShowSubForm(false)}>
          <div className="modal-box" style={{ maxWidth: 420, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>{editingSub ? '✏️ Edit Subcategory' : '+ New Subcategory'}</h3>
              <button className="modal-close" style={{ position: 'static' }} onClick={() => setShowSubForm(false)}>×</button>
            </div>
            <form onSubmit={saveSub} style={{ padding: 20 }}>
              <div style={{ background: '#f9f9f9', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#888' }}>
                Adding to: <strong style={{ color: '#1b1b1b' }}>{categories.find(c => c.id === subParentId)?.name}</strong>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Subcategory Name *</label>
                <input className="admin-input" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Handbags" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Subcategory Image</label>
                <ImageUploader
                  images={subForm.image_url ? [subForm.image_url] : []}
                  onChange={urls => setSubForm(f => ({ ...f, image_url: urls[0] || '' }))}
                  max={1}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Sort Order</label>
                <input className="admin-input" type="number" value={subForm.sort_order} onChange={e => setSubForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSubForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving…' : editingSub ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
