import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    items: [
      { key: 'dashboard',  icon: '📊', label: 'Dashboard' },
      { key: 'new-bill',   icon: '🧾', label: 'New Bill / POS' },
      { key: 'customers',  icon: '👥', label: 'Customers' },
      { key: 'invoices',   icon: '📋', label: 'Invoices' },
    ]
  },
  {
    label: 'STOCK',
    items: [
      { key: 'products',   icon: '🛍️', label: 'Products' },
      { key: 'inventory',  icon: '📦', label: 'Inventory' },
      { key: 'categories', icon: '🏷️', label: 'Categories' },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'orders',     icon: '🛒', label: 'Orders' },
      { key: 'expenses',   icon: '💸', label: 'Expenses' },
      { key: 'reports',    icon: '📈', label: 'Reports & P&L' },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { key: 'bill-settings', icon: '⚙️', label: 'Bill Settings' },
    ]
  }
];

export default function AdminLayout({ page, setPage, children }) {
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = t => t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtDate = t => t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const currentLabel = NAV_SECTIONS.flatMap(s => s.items).find(i => i.key === page)?.label || 'Dashboard';

  const handleNav = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="brand-name">Shop<span>LK</span></div>
          <div className="brand-sub">POS &amp; Admin Panel</div>
        </div>

        <nav className="admin-nav">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && <div className="admin-nav-section">{section.label}</div>}
              {section.items.map(n => (
                <div key={n.key} className={`admin-nav-item ${page === n.key ? 'active' : ''}`}
                  onClick={() => handleNav(n.key)}>
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                </div>
              ))}
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="admin-nav-item">
              <span className="nav-icon">🌐</span>
              View Shop
            </div>
          </a>
        </nav>

        <div className="admin-nav-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e62e04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, color: '#fff' }}>
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{admin?.name}</div>
              <div style={{ fontSize: 10, opacity: 0.4, textTransform: 'capitalize' }}>{admin?.role}</div>
            </div>
          </div>
          <button className="admin-logout" onClick={() => setConfirmLogout(true)}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="admin-hamburger" onClick={() => setSidebarOpen(v => !v)}>
              ☰
            </button>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{currentLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{fmt(time)}</div>
              <div style={{ fontSize: 10, color: '#888' }}>{fmtDate(time)}</div>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#333' }}>
              🏪 ShopLK
            </div>
          </div>
        </div>

        <div className="admin-content">{children}</div>
      </main>

      {/* Logout confirm */}
      {confirmLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
            <h3 style={{ fontWeight: 800, marginBottom: 6 }}>Sign out?</h3>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>You'll need to sign in again to access the admin panel.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmLogout(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
              <button onClick={logout}
                style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#e62e04', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
