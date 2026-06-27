import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

export default function OutstandingBalances() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null);
  const [settleAmt, setSettleAmt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      const { data } = await api.get('/bills/unpaid');
      setBills(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const openSettle = (bill) => {
    setSettling(bill);
    setSettleAmt(bill.balance_due);
  };

  const handleSettle = async () => {
    if (!settleAmt || parseFloat(settleAmt) <= 0) { showToast('Enter a valid amount', 'error'); return; }
    setSaving(true);
    try {
      await api.put(`/bills/${settling.id}/settle`, { amount: settleAmt });
      showToast('Payment recorded ✅', 'success');
      setSettling(null);
      fetchBills();
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    setSaving(false);
  };

  const totalOutstanding = bills.reduce((s, b) => s + parseFloat(b.balance_due || 0), 0);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>💰 Outstanding Balances</h2>
          <p style={{ color: '#888', fontSize: 12 }}>Bills with advance payments — track remaining balance</p>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Total Outstanding</div>
          <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Rubik,sans-serif' }}>Rs. {totalOutstanding.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700 }}>Pending Bills</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{bills.length}</div>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Total</th><th>Advance Paid</th><th>Balance Due</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id}>
                <td><strong style={{ color: '#0277bd', fontSize: 12 }}>{b.invoice_no}</strong></td>
                <td style={{ fontWeight: 600 }}>{b.customer_name}</td>
                <td style={{ fontSize: 12, color: '#888' }}>{b.customer_phone}</td>
                <td style={{ fontWeight: 700 }}>Rs. {parseFloat(b.total).toLocaleString()}</td>
                <td style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Rs. {parseFloat(b.advance_paid || 0).toLocaleString()}</td>
                <td style={{ fontWeight: 900, color: '#dc2626' }}>Rs. {parseFloat(b.balance_due).toLocaleString()}</td>
                <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-success btn-sm" onClick={() => openSettle(b)}>💰 Record Payment</button>
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#ccc', padding: '3rem' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                No outstanding balances — all bills fully paid!
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Settle Payment Modal */}
      {settling && (
        <div className="modal-overlay" onClick={() => setSettling(null)}>
          <div className="modal-box" style={{ maxWidth: 400, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15 }}>💰 Record Payment</h3>
              <button onClick={() => setSettling(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Invoice</span><strong style={{ color: '#0277bd' }}>{settling.invoice_no}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Customer</span><span style={{ fontWeight: 700 }}>{settling.customer_name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Bill Total</span><span>Rs. {parseFloat(settling.total).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#16a34a' }}><span>Already Paid</span><span>Rs. {parseFloat(settling.advance_paid || 0).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#dc2626', borderTop: '1px solid #e8e8e8', marginTop: 6, paddingTop: 6 }}><span>Balance Due</span><span>Rs. {parseFloat(settling.balance_due).toLocaleString()}</span></div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Payment Amount Received Now</label>
                <input className="admin-input" type="number" min="0" max={settling.balance_due}
                  value={settleAmt} onChange={e => setSettleAmt(e.target.value)} autoFocus />
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <button type="button" onClick={() => setSettleAmt(settling.balance_due)}
                  style={{ flex: 1, background: '#e0f0ff', color: '#0277bd', border: 'none', padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Pay Full Balance
                </button>
                <button type="button" onClick={() => setSettleAmt((parseFloat(settling.balance_due) / 2).toFixed(2))}
                  style={{ flex: 1, background: '#f0f0f0', color: '#555', border: 'none', padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Pay Half
                </button>
              </div>

              {settleAmt > 0 && (
                <div style={{ background: '#dcfce7', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                  Remaining balance after this payment: <strong>Rs. {Math.max(0, parseFloat(settling.balance_due) - parseFloat(settleAmt || 0)).toLocaleString()}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSettling(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSettle} disabled={saving}
                  style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : '✅ Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
