import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const STATUS_COLORS = {
  pending: { bg: '#fff3cd', color: '#856404' },
  confirmed: { bg: '#d1ecf1', color: '#0c5460' },
  processing: { bg: '#cce5ff', color: '#004085' },
  shipped: { bg: '#d4edda', color: '#155724' },
  delivered: { bg: '#d4edda', color: '#155724' },
  cancelled: { bg: '#f8d7da', color: '#721c24' },
};

function StatCard({ icon, label, value, sub, variant = 'default' }) {
  const cls = {
    default: 'stat-card',
    accent: 'stat-card stat-card-accent',
    red: 'stat-card stat-card-red',
    green: 'stat-card stat-card-green',
    blue: 'stat-card stat-card-blue',
  }[variant];
  return (
    <div className={cls}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const orders = data?.orders || 0;
  const pending = data?.pending || 0;
  const customers = data?.customers || 0;
  const products = data?.products || 0;
  const avgOrder = orders ? (revenue / orders).toFixed(0) : 0;

  const thisMonthExpenses = expenses
    .filter(e => e.date?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <>
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg,#1b1b1b 0%,#2d1c1c 60%,#3d1f1f 100%)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Welcome back! 👋</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>Here's what's happening today</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 2 }}>Total Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#e62e04', fontFamily: 'Rubik, sans-serif' }}>Rs. {revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Profit / Loss */}
      <div className="pnl-row">
        <div className={`pnl-card ${netProfit >= 0 ? 'pnl-profit' : 'pnl-loss'}`}>
          <div className="pnl-label">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</div>
          <div className="pnl-val">Rs. {Math.abs(netProfit).toLocaleString()}</div>
          <div className="pnl-sub">Revenue − Expenses</div>
        </div>
        <div className="pnl-card" style={{ borderLeftColor: '#d97706' }}>
          <div className="pnl-label">Total Expenses</div>
          <div className="pnl-val" style={{ color: '#d97706' }}>Rs. {totalExpenses.toLocaleString()}</div>
          <div className="pnl-sub">This month: Rs. {thisMonthExpenses.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="💰" label="Total Revenue" value={`Rs. ${revenue.toLocaleString()}`} sub={`${orders} orders`} variant="red" />
        <StatCard icon="📦" label="Total Orders" value={orders} sub={`${pending} pending`} variant="accent" />
        <StatCard icon="👥" label="Customers" value={customers} sub="Registered" variant="green" />
        <StatCard icon="🛍️" label="Products" value={products} sub="Active" variant="blue" />
        <StatCard icon="📊" label="Avg Order" value={`Rs. ${Number(avgOrder).toLocaleString()}`} sub="Per order" />
        <StatCard icon="⏳" label="Pending" value={pending} sub="Need action" />
      </div>

      {/* Recent Orders + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div className="admin-card">
          <div className="admin-card-hdr">
            <h3>📋 Recent Orders</h3>
            <span style={{ fontSize: 11, color: '#888' }}>Last 8 orders</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).map(o => (
                  <tr key={o.id}>
                    <td><strong style={{ color: '#e62e04', fontSize: 12 }}>{o.invoice_no}</strong></td>
                    <td>{o.customer_name}</td>
                    <td style={{ fontWeight: 700 }}>Rs. {parseFloat(o.total).toLocaleString()}</td>
                    <td style={{ fontSize: 12 }}>{o.payment_method === 'bank_deposit' ? '🏦 Bank' : '💵 COD'}</td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 800, background: STATUS_COLORS[o.status]?.bg, color: STATUS_COLORS[o.status]?.color, textTransform: 'capitalize' }}>{o.status}</span>
                    </td>
                    <td style={{ color: '#aaa', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!data?.recentOrders?.length && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="admin-card">
          <div className="admin-card-hdr"><h3>🏆 Top Products</h3></div>
          {(data?.topProducts || []).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ccc', fontSize: 13 }}>No sales data yet</div>
          ) : (data?.topProducts || []).map((p, i) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: i < 3 ? '#fff' : '#999', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{p.units_sold} sold</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#16a34a', whiteSpace: 'nowrap' }}>Rs. {parseFloat(p.revenue).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Profit breakdown */}
      <div className="admin-card" style={{ marginTop: 14 }}>
        <div className="admin-card-hdr"><h3>📈 Profit Analysis</h3></div>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {[
              { label: 'Gross Revenue', val: revenue, color: '#16a34a', icon: '💰' },
              { label: 'Total Expenses', val: -totalExpenses, color: '#dc2626', icon: '💸' },
              { label: 'Net Profit/Loss', val: netProfit, color: netProfit >= 0 ? '#16a34a' : '#dc2626', icon: netProfit >= 0 ? '📈' : '📉' },
              { label: 'Profit Margin', val: revenue > 0 ? `${((netProfit / revenue) * 100).toFixed(1)}%` : '0%', color: netProfit >= 0 ? '#0a68f4' : '#dc2626', icon: '📊', isText: true },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: 'Rubik, sans-serif' }}>
                  {item.isText ? item.val : `Rs. ${Math.abs(item.val).toLocaleString()}`}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, fontWeight: 700 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
