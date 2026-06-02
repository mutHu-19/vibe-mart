import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const now = new Date();
const thisMonthFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
const today = now.toISOString().slice(0,10);

export default function Reports() {
  const [from, setFrom] = useState(thisMonthFrom);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [sumRes, billRes, expRes] = await Promise.all([
        api.get('/bills/stats/summary', { params: { from, to } }),
        api.get('/bills', { params: { from, to, limit: 200 } }),
        Promise.resolve(JSON.parse(localStorage.getItem('shoplk_expenses') || '[]')),
      ]);
      // Filter expenses to period
      const periodExpenses = expRes.filter(e => e.date >= from && e.date <= to);
      const totalExpenses = periodExpenses.reduce((s,e) => s+e.amount, 0);
      setSummary({ ...sumRes.data, totalExpenses, netProfit: (sumRes.data.gross_profit||0) - totalExpenses, periodExpenses });
      setBills(billRes.data.bills || []);
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  const setPreset = (preset) => {
    const n = new Date();
    if (preset === 'today') { setFrom(today); setTo(today); }
    else if (preset === 'week') {
      const d = new Date(n); d.setDate(d.getDate()-6);
      setFrom(d.toISOString().slice(0,10)); setTo(today);
    }
    else if (preset === 'month') { setFrom(thisMonthFrom); setTo(today); }
    else if (preset === 'last_month') {
      const first = new Date(n.getFullYear(), n.getMonth()-1, 1);
      const last = new Date(n.getFullYear(), n.getMonth(), 0);
      setFrom(first.toISOString().slice(0,10)); setTo(last.toISOString().slice(0,10));
    }
    else if (preset === 'year') {
      setFrom(`${n.getFullYear()}-01-01`); setTo(today);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>📈 Reports & P&L</h2>
        <p style={{ color: '#888', fontSize: 12 }}>Based on manual bills — select any time period</p>
      </div>

      {/* Period selector */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#aaa', letterSpacing: 0.5, marginBottom: 10 }}>Select Period</div>
        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Last 7 Days' },
            { key: 'month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'year', label: 'This Year' },
          ].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid #e8e8e8', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#555', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.target.style.borderColor = '#e62e04'; e.target.style.color = '#e62e04'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#e8e8e8'; e.target.style.color = '#555'; }}>
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom range */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="admin-input" style={{ width: 160 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="admin-input" style={{ width: 160 }} />
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="btn btn-danger" style={{ minWidth: 100 }}>
            {loading ? '⏳ Loading…' : '📊 Generate'}
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* P&L Summary */}
          <div style={{ background: 'linear-gradient(135deg,#1b1b1b,#2d1c1c)', borderRadius: 10, padding: '16px 20px', marginBottom: 14, color: '#fff' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, marginBottom: 12, fontWeight: 800 }}>
              P&L Statement · {from} to {to}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16 }}>
              {[
                { label: 'Gross Revenue', val: `Rs. ${(summary.gross_revenue||0).toLocaleString()}`, color: '#4ade80' },
                { label: 'Cost of Goods', val: `Rs. ${(summary.cogs||0).toLocaleString()}`, color: '#f87171' },
                { label: 'Gross Profit', val: `Rs. ${(summary.gross_profit||0).toLocaleString()}`, color: '#60a5fa' },
                { label: 'Expenses', val: `Rs. ${(summary.totalExpenses||0).toLocaleString()}`, color: '#fb923c' },
                { label: `Net ${summary.netProfit>=0?'Profit':'Loss'}`, val: `Rs. ${Math.abs(summary.netProfit||0).toLocaleString()}`, color: summary.netProfit>=0?'#4ade80':'#f87171' },
                { label: 'Margin', val: summary.gross_revenue > 0 ? `${(((summary.gross_profit||0)/summary.gross_revenue)*100).toFixed(1)}%` : '0%', color: '#a78bfa' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: item.color, fontFamily: 'Rubik,sans-serif' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div className="stats-grid" style={{ marginBottom: 14 }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #e62e04' }}>
              <div className="stat-icon">🧾</div>
              <div className="stat-label">Bills</div>
              <div className="stat-value">{summary.bill_count}</div>
              <div className="stat-sub">In period</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div className="stat-icon">🏷️</div>
              <div className="stat-label">Discounts</div>
              <div className="stat-value">Rs. {(summary.total_discount||0).toLocaleString()}</div>
              <div className="stat-sub">Total given</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #0a68f4' }}>
              <div className="stat-icon">🚚</div>
              <div className="stat-label">Delivery</div>
              <div className="stat-value">Rs. {(summary.total_delivery||0).toLocaleString()}</div>
              <div className="stat-sub">Collected</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-label">Avg Bill</div>
              <div className="stat-value">Rs. {summary.bill_count > 0 ? ((summary.gross_revenue||0)/summary.bill_count).toFixed(0) : 0}</div>
              <div className="stat-sub">Per bill</div>
            </div>
          </div>

          {/* Top products + Expense breakdown side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>🏆 Top Products</h3></div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th><th>Cost</th></tr></thead>
                <tbody>
                  {(summary.top_products||[]).map((p,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 900, color: i===0?'#fbbf24':i===1?'#9ca3af':'#d97706' }}>{i+1}</td>
                      <td style={{ fontWeight: 700, fontSize: 12 }}>{p.product_name}</td>
                      <td>{p.units}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a', fontSize: 12 }}>Rs. {parseFloat(p.revenue).toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: '#888' }}>Rs. {parseFloat(p.cost||0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!(summary.top_products?.length) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#ccc', padding: '1.5rem' }}>No sales in period</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expense breakdown */}
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>💸 Expenses in Period</h3></div>
              {summary.periodExpenses?.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ccc', fontSize: 13 }}>No expenses in this period</div>
              ) : (
                <div style={{ padding: '12px 16px' }}>
                  {Object.entries(
                    (summary.periodExpenses||[]).reduce((acc, e) => {
                      acc[e.category] = (acc[e.category]||0) + e.amount;
                      return acc;
                    }, {})
                  ).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700 }}>{cat}</span>
                        <span style={{ fontWeight: 700, color: '#e62e04' }}>Rs. {amt.toLocaleString()}</span>
                      </div>
                      <div style={{ background: '#f5f5f5', borderRadius: 2, height: 6 }}>
                        <div style={{ background: '#e62e04', height: '100%', borderRadius: 2, width: `${(amt/(summary.totalExpenses||1))*100}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13 }}>
                    <span>Total</span><span style={{ color: '#d97706' }}>Rs. {(summary.totalExpenses||0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bills table */}
          <div className="admin-card">
            <div className="admin-card-hdr">
              <h3>🧾 Bills in Period ({bills.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Total</th><th>Delivery</th><th>Discount</th><th>Payment</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td><strong style={{ color: '#e62e04', fontSize: 12 }}>{b.invoice_no}</strong></td>
                      <td>{b.customer_name}</td>
                      <td>{b.item_count}</td>
                      <td style={{ fontWeight: 700 }}>Rs. {parseFloat(b.total).toLocaleString()}</td>
                      <td style={{ fontSize: 12 }}>{b.delivery_charge > 0 ? `Rs. ${parseFloat(b.delivery_charge).toLocaleString()}` : '—'}</td>
                      <td style={{ fontSize: 12, color: '#16a34a' }}>{b.discount > 0 ? `Rs. ${parseFloat(b.discount).toLocaleString()}` : '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.payment_method?.replace('_',' ')}</td>
                      <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No bills in selected period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
