import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon, label, value, sub, color = '#1b1b1b' }) {
  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { isSuperAdmin, admin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const from = `${year}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const to = now.toISOString().slice(0,10);

  useEffect(() => {
    Promise.all([
      isSuperAdmin ? api.get('/bills/stats/summary', { params: { from, to } }) : Promise.resolve({ data: {} }),
      api.get('/admin/dashboard'),
    ]).then(([billRes, dashRes]) => {
      const expenses = isSuperAdmin
        ? JSON.parse(localStorage.getItem('shoplk_expenses') || '[]')
            .filter(e => e.date?.slice(0,7) === now.toISOString().slice(0,7))
            .reduce((s,e) => s + e.amount, 0)
        : 0;
      setSummary({
        ...billRes.data,
        ...dashRes.data,
        monthExpenses: expenses,
        netProfit: isSuperAdmin ? ((billRes.data.gross_profit || 0) - expenses) : null,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const gross = summary?.gross_revenue || 0;
  const grossProfit = summary?.gross_profit || 0;
  const expenses = summary?.monthExpenses || 0;
  const netProfit = summary?.netProfit || 0;
  const billCount = summary?.bill_count || 0;
  const pending = summary?.pending || 0;

  return (
    <>
      {/* Month header */}
      <div style={{ background: 'linear-gradient(135deg,#0d1b2a 0%,#01579b 100%)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>
            👋 Welcome, {admin?.name}!
          </div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>
            {monthName} {year} · {isSuperAdmin ? 'Full access' : 'Staff access'}
          </div>
        </div>
        {isSuperAdmin && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 2 }}>This Month Revenue</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#00e5ff', fontFamily: 'Rubik,sans-serif' }}>
              Rs. {gross.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* P&L Row — SUPER ADMIN ONLY */}
      {isSuperAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', borderLeft: '4px solid #16a34a' }}>
            <div className="pnl-label">Gross Profit</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a', fontFamily: 'Rubik,sans-serif' }}>
              Rs. {grossProfit.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Revenue − Cost of Goods</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', borderLeft: `4px solid ${netProfit >= 0 ? '#0288d1' : '#e53935'}` }}>
            <div className="pnl-label">Net Profit</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: netProfit >= 0 ? '#0288d1' : '#e53935', fontFamily: 'Rubik,sans-serif' }}>
              Rs. {Math.abs(netProfit).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              {netProfit >= 0 ? 'Gross Profit − Expenses' : '⚠️ Loss this month'}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', borderLeft: '4px solid #d97706' }}>
            <div className="pnl-label">Expenses</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#d97706', fontFamily: 'Rubik,sans-serif' }}>
              Rs. {expenses.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{monthName} expenses</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="stats-grid">
        {isSuperAdmin && (
          <StatCard icon="💰" label="Gross Revenue" value={`Rs. ${gross.toLocaleString()}`} sub={`${billCount} bills`} color="#0288d1" />
        )}
        <StatCard icon="🧾" label="Bills This Month" value={isSuperAdmin ? billCount : '—'} sub={monthName} color="#1b1b1b" />
        <StatCard icon="📦" label="Web Orders" value={summary?.orders || 0} sub={`${pending} pending`} color="#0a68f4" />
        <StatCard icon="👥" label="Customers" value={summary?.customers || 0} sub="Registered" color="#16a34a" />
        <StatCard icon="🛍️" label="Products" value={summary?.products || 0} sub="Active" color="#7c3aed" />
        <StatCard icon="⏳" label="Pending Orders" value={pending} sub="Need action" color="#d97706" />
      </div>

      {/* Low stock — both roles can see */}
      <div style={{ display: 'grid', gridTemplateColumns: isSuperAdmin ? '1fr 1fr' : '1fr', gap: 14, marginTop: 4 }}>
        {/* Top products — super admin only */}
        {isSuperAdmin && (
          <div className="admin-card">
            <div className="admin-card-hdr"><h3>🏆 Top Products This Month</h3></div>
            {!(summary?.topProducts?.length) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ccc', fontSize: 13 }}>No bills this month</div>
            ) : summary.topProducts.map((p, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#d97706':'#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: i<3?'#fff':'#999', flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{p.units_sold} units</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#16a34a', whiteSpace: 'nowrap' }}>Rs. {parseFloat(p.revenue||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Low stock — all roles */}
        <div className="admin-card">
          <div className="admin-card-hdr"><h3>⚠️ Low Stock Alert</h3></div>
          {!(summary?.lowStock?.length) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ccc', fontSize: 13 }}>All items well stocked ✅</div>
          ) : summary.lowStock.map((s, i) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{[s.colour, s.size].filter(Boolean).join(' · ') || 'Standard'}</div>
              </div>
              <span className={`stock-badge ${s.stock_qty === 0 ? 'stock-out' : 'stock-low'}`}>{s.stock_qty} left</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff notice */}
      {!isSuperAdmin && (
        <div style={{ background: '#f0f7ff', border: '1.5px solid #b3d9f5', borderRadius: 8, padding: '12px 16px', marginTop: 14, fontSize: 13, color: '#0277bd' }}>
          <strong>ℹ️ Note:</strong> Financial reports, profit data, and cost prices are only visible to Super Admins. Contact your Super Admin for financial reports.
        </div>
      )}
    </>
  );
}
