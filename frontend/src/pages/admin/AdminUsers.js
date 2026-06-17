import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const ROLE_LABELS = {
  super_admin: { label: 'Super Admin', color: '#0277bd', bg: '#e0f0ff' },
  staff:       { label: 'Staff',       color: '#15803d', bg: '#dcfce7' },
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff', is_active: 1 };

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/admins');
      setAdmins(data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load admins', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPw(true);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, password: '', role: a.role, is_active: a.is_active });
    setShowPw(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role, is_active: form.is_active };
        if (form.password) payload.new_password = form.password;
        await api.put(`/auth/admins/${editing.id}`, payload);
        showToast('Admin updated ✅', 'success');
      } else {
        await api.post('/auth/admins', { name: form.name, email: form.email, password: form.password, role: form.role });
        showToast('Admin created ✅', 'success');
      }
      setShowForm(false);
      fetchAdmins();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    setSaving(false);
  };

  const handleDeactivate = async (a) => {
    if (!window.confirm(`Deactivate ${a.name}?`)) return;
    try {
      await api.delete(`/auth/admins/${a.id}`);
      showToast('Admin deactivated');
      fetchAdmins();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  };

  const handleActivate = async (a) => {
    try {
      await api.put(`/auth/admins/${a.id}`, { name: a.name, email: a.email, role: a.role, is_active: 1 });
      showToast('Admin activated ✅', 'success');
      fetchAdmins();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Admin Users</h2>
          <p style={{ color: '#888', fontSize: 12 }}>Manage who can access the admin panel</p>
        </div>
        <button className="btn btn-danger" onClick={openNew}>+ Add Admin</button>
      </div>

      {/* Permission table */}
      <div style={{ background: '#f0f7ff', border: '1.5px solid #b3d9f5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: '#0277bd', marginBottom: 8 }}>📋 Role Permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#0277bd' }}>🔑 Super Admin — Full Access</div>
            <div style={{ color: '#555', lineHeight: 1.8 }}>Dashboard with financials · All products & categories · Reports & P&L · Cost prices · Admin users management · Everything staff can do</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#15803d' }}>👤 Staff — Limited Access</div>
            <div style={{ color: '#555', lineHeight: 1.8 }}>New Bill / POS · Customers · Invoices · Inventory (view & update stock) · Orders · Expenses · Bill Settings · Change own password</div>
            <div style={{ color: '#e53935', marginTop: 4, fontWeight: 600 }}>❌ Cannot see: cost prices, profits, reports, product costs</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.role === 'super_admin' ? '#0288d1' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {a.name?.[0]?.toUpperCase()}
                    </div>
                    {a.name}
                  </div>
                </td>
                <td style={{ color: '#888', fontSize: 12 }}>{a.email}</td>
                <td>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 800, background: ROLE_LABELS[a.role]?.bg || '#f5f5f5', color: ROLE_LABELS[a.role]?.color || '#888' }}>
                    {ROLE_LABELS[a.role]?.label || a.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${a.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  {a.role !== 'super_admin' && (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>Edit</button>
                      {a.is_active
                        ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(a)}>Deactivate</button>
                        : <button className="btn btn-success btn-sm" onClick={() => handleActivate(a)}>Activate</button>
                      }
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 440, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#0288d1', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15 }}>{editing ? '✏️ Edit Admin' : '+ New Admin'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '18px 20px' }}>
              <div className="admin-form-group">
                <label className="admin-label">Full Name *</label>
                <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Kamal Perera" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Email *</label>
                <input className="admin-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="kamal@shoplk.com" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Role</label>
                <select className="admin-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="staff">Staff — Limited access</option>
                </select>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Only super admins can be created via database</div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">
                  {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input className="admin-input" type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!editing} placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} />
              </div>
              {editing && (
                <div className="admin-form-group">
                  <label className="admin-label">Status</label>
                  <select className="admin-input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
