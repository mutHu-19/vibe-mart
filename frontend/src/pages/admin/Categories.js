import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const EMPTY = { name: '', description: '', image_url: '', is_active: 1 };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', is_active: c.is_active }); setEditing(c.id); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing}`, form);
        showToast('Category updated', 'success');
      } else {
        await api.post('/categories', form);
        showToast('Category created', 'success');
      }
      setShowForm(false);
      fetch();
    } catch (err) { showToast(err.response?.data?.error || 'Error saving', 'error'); }
    setSaving(false);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Categories</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{categories.length} categories</p>
        </div>
        <button className="btn btn-danger" onClick={openNew}>+ Add Category</button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Slug</th><th>Description</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{c.slug}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 280 }}>{c.description || '—'}</td>
                <td><span className={`status-badge ${c.is_active ? 'status-delivered' : 'status-cancelled'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><button className="btn btn-outline" onClick={() => openEdit(c)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>{editing ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Category Name *</label>
                <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Description</label>
                <textarea className="admin-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Image URL</label>
                <input className="admin-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="admin-label">Status</label>
                <select className="admin-input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
