import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const BADGE_CLASS = { pending: 'badge badge-pending', confirmed: 'badge badge-confirmed', processing: 'badge badge-processing', shipped: 'badge badge-shipped', delivered: 'badge badge-delivered', cancelled: 'badge badge-cancelled' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    const { data } = await api.get('/orders', { params: filter ? { status: filter } : {} });
    setOrders(data.orders || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    setDetail(data);
    setSelected(id);
  };

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status });
      showToast(`Status updated to ${status}`, 'success');
      setDetail(d => d ? { ...d, status } : d);
      fetchOrders();

      // Notify about stock deduction
      if (status === 'confirmed') {
        showToast('📦 Stock deducted for confirmed items', 'success');
      }
    } catch {
      showToast('Update failed', 'error');
    }
    setUpdating(false);
  };

  const filtered = orders.filter(o =>
    !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search)
  );

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total || 0), 0);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Orders</h2>
          <p style={{ color: '#888', fontSize: 12 }}>
            {filtered.length} orders · Revenue: Rs. {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search orders..."
            className="admin-input" style={{ width: 200 }} />
          <select className="admin-input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Status summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUSES.map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <div key={s} onClick={() => setFilter(filter === s ? '' : s)}
              style={{ padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${filter === s ? '#e62e04' : '#e8e8e8'}`, background: filter === s ? '#fff1ee' : '#fff', color: filter === s ? '#e62e04' : '#555' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </div>
          );
        })}
      </div>

      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><strong style={{ color: '#e62e04', fontSize: 12 }}>{o.invoice_no}</strong></td>
                  <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                  <td style={{ fontSize: 12, color: '#888' }}>{o.customer_phone}</td>
                  <td>{o.item_count}</td>
                  <td style={{ fontWeight: 700 }}>Rs. {parseFloat(o.total).toLocaleString()}</td>
                  <td style={{ fontSize: 12 }}>{o.payment_method === 'bank_deposit' ? '🏦 Bank' : '💵 COD'}</td>
                  <td><span className={BADGE_CLASS[o.status]}>{o.status}</span></td>
                  <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openOrder(o.id)}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && detail && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ maxWidth: 640, borderRadius: 10 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <div style={{ padding: '20px 20px 24px' }}>
              <div style={{ display: 'flex', align: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: '#e62e04' }}>{detail.invoice_no}</h2>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{new Date(detail.created_at).toLocaleString()}</div>
                </div>
                <span className={BADGE_CLASS[detail.status]} style={{ fontSize: 12, marginLeft: 'auto' }}>{detail.status}</span>
              </div>

              {/* Customer */}
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Customer Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
                  {[['Name', detail.customer_name], ['Phone', detail.customer_phone], ['Address', detail.customer_address], ['Payment', detail.payment_method === 'bank_deposit' ? '🏦 Bank Deposit' : '💵 Cash on Delivery']].map(([k, v]) => (
                    <React.Fragment key={k}><div style={{ color: '#888' }}>{k}</div><div style={{ fontWeight: 600 }}>{v}</div></React.Fragment>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Order Items</div>
                <table className="admin-table" style={{ fontSize: 12 }}>
                  <thead><tr><th>Product</th><th>Colour</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
                  <tbody>
                    {(detail.items || []).map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>{item.colour || '—'}</td>
                        <td>{item.size || '—'}</td>
                        <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ fontWeight: 700, color: '#e62e04' }}>Rs. {parseFloat(item.total_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 15, color: '#e62e04', marginTop: 8 }}>
                  Total: Rs. {parseFloat(detail.total).toLocaleString()}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
                  Update Status
                  {detail.status === 'pending' && (
                    <span style={{ marginLeft: 8, background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                      ⚠️ Confirming will deduct stock
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.map(s => (
                    <button key={s} disabled={updating}
                      className={`btn btn-sm ${detail.status === s ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => updateStatus(detail.id, s)}
                      style={{ textTransform: 'capitalize', opacity: updating ? 0.6 : 1 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
