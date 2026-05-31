import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function Reports() {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      Promise.resolve(JSON.parse(localStorage.getItem('shoplk_expenses') || '[]')),
    ]).then(([r, exp]) => {
      setData(r.data);
      setExpenses(exp);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const revenue = parseFloat(data?.revenue || 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - totalExpenses;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;
  const orders = data?.orders || 0;

  // Expense breakdown by category
  const expByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const maxExp = Math.max(...Object.values(expByCat), 1);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Reports & Analytics</h2>
        <p style={{ color: '#888', fontSize: 12 }}>Business performance overview</p>
      </div>

      {/* P&L Summary */}
      <div style={{ background: 'linear-gradient(135deg, #1b1b1b, #2d1c1c)', borderRadius: 10, padding: '18px 20px', marginBottom: 16, color: '#fff' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, marginBottom: 14, fontWeight: 800 }}>Profit & Loss Statement</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: 'Gross Revenue', val: `Rs. ${revenue.toLocaleString()}`, color: '#4ade80' },
            { label: 'Total Expenses', val: `Rs. ${totalExpenses.toLocaleString()}`, color: '#f87171' },
            { label: `Net ${netProfit >= 0 ? 'Profit' : 'Loss'}`, val: `Rs. ${Math.abs(netProfit).toLocaleString()}`, color: netProfit >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Profit Margin', val: `${margin}%`, color: netProfit >= 0 ? '#60a5fa' : '#f87171' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: 'Rubik, sans-serif' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {[
          { icon: '💰', label: 'Total Revenue', value: `Rs. ${revenue.toLocaleString()}`, sub: 'All confirmed orders', variant: 'green' },
          { icon: '📦', label: 'Total Orders', value: orders, sub: 'All time', variant: 'blue' },
          { icon: '👥', label: 'Customers', value: data?.customers || 0, sub: 'Registered', variant: 'accent' },
          { icon: '📊', label: 'Avg Order Value', value: `Rs. ${orders ? (revenue / orders).toFixed(0) : 0}`, sub: 'Per order' },
          { icon: '💸', label: 'Total Expenses', value: `Rs. ${totalExpenses.toLocaleString()}`, sub: 'All categories', variant: 'red' },
          { icon: '⏳', label: 'Pending Orders', value: data?.pending || 0, sub: 'Need action' },
        ].map(s => (
          <div key={s.label} className={`stat-card${s.variant ? ` stat-card-${s.variant}` : ''}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Expense Breakdown */}
      {Object.keys(expByCat).length > 0 && (
        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>💸 Expense Breakdown</h3></div>
          <div style={{ padding: '14px 18px' }}>
            {Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{cat}</span>
                  <span style={{ fontWeight: 700, color: '#e62e04' }}>Rs. {amt.toLocaleString()} ({((amt / totalExpenses) * 100).toFixed(1)}%)</span>
                </div>
                <div style={{ background: '#f5f5f5', borderRadius: 2, height: 8 }}>
                  <div style={{ background: '#e62e04', height: '100%', borderRadius: 2, width: `${(amt / maxExp) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="admin-card">
        <div className="admin-card-hdr"><h3>🏆 Top Selling Products</h3></div>
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Revenue Share</th></tr>
          </thead>
          <tbody>
            {(data?.topProducts || []).map((p, i) => {
              const pct = revenue > 0 ? ((parseFloat(p.revenue) / revenue) * 100).toFixed(1) : 0;
              return (
                <tr key={i}>
                  <td>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: i < 3 ? '#fff' : '#999' }}>{i + 1}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td>{p.units_sold} units</td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>Rs. {parseFloat(p.revenue).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#e62e04', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#888', minWidth: 35 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!data?.topProducts?.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No sales data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
