import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Navigation sections — each item has a 'roles' array
// 'all' means both super_admin and staff can see it
const NAV_SECTIONS = [
  {
    items: [
      { key: 'dashboard',     icon: '📊', label: 'Dashboard',      roles: ['super_admin'] },
      { key: 'new-bill',      icon: '🧾', label: 'New Bill / POS', roles: ['all'] },
      { key: 'customers',     icon: '👥', label: 'Customers',       roles: ['all'] },
      { key: 'invoices',      icon: '📋', label: 'Invoices',        roles: ['all'] },
    ]
  },
  {
    label: 'STOCK',
    items: [
      { key: 'products',      icon: '🛍️', label: 'Products',       roles: ['super_admin'] },
      { key: 'inventory',     icon: '📦', label: 'Inventory',       roles: ['all'] },
      { key: 'categories',    icon: '🏷️', label: 'Categories',     roles: ['super_admin'] },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'orders',        icon: '🛒', label: 'Orders',          roles: ['all'] },
      { key: 'expenses',      icon: '💸', label: 'Expenses',        roles: ['all'] },
      { key: 'reports',       icon: '📈', label: 'Reports & P&L',  roles: ['super_admin'] },
      { key: 'outstanding-balances', icon: '💰', label: 'Outstanding Balances', roles: ['all'] },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { key: 'admin-users',   icon: '👤', label: 'Admin Users',    roles: ['super_admin'] },
      { key: 'bill-settings', icon: '⚙️', label: 'Bill Settings',  roles: ['all'] },
       { key: 'popup-settings', icon: '🔔', label: 'Website Popup', roles: ['all'] },
       { key: 'checkout-settings', icon: '🛒', label: 'Checkout Content', roles: ['all'] },
       { key: 'site-settings', icon: '🎨', label: 'Website Design', roles: ['all'] },
      { key: 'change-password', icon: '🔑', label: 'Change Password', roles: ['all'] },
      
    ]
  }
];

export default function AdminLayout({ page, setPage, children }) {
  const { admin, logout, isSuperAdmin } = useAuth();
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

  // Filter nav items based on role
  const canSee = (item) => {
    if (item.roles.includes('all')) return true;
    if (item.roles.includes(admin?.role)) return true;
    return false;
  };

  const handleNav = (key) => { setPage(key); setSidebarOpen(false); };

  const roleLabel = { super_admin: '🔑 Super Admin', admin: '🛡️ Admin', staff: '👤 Staff' }[admin?.role] || admin?.role;

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="brand-name">Shop<span>LK</span></div>
          <div className="brand-sub">POS &amp; Admin Panel</div>
        </div>

        <nav className="admin-nav">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(canSee);
            if (!visibleItems.length) return null;
            return (
              <div key={si}>
                {section.label && <div className="admin-nav-section">{section.label}</div>}
                {visibleItems.map(n => (
                  <div key={n.key}
                    className={`admin-nav-item ${page === n.key ? 'active' : ''}`}
                    onClick={() => handleNav(n.key)}>
                    <span className="nav-icon">{n.icon}</span>
                    {n.label}
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="admin-nav-item">
              <span className="nav-icon">🌐</span> View Shop
            </div>
          </a>
        </nav>

        <div className="admin-nav-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: isSuperAdmin ? '#0288d1' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, color: '#fff' }}>
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.name}</div>
              <div style={{ fontSize: 10, opacity: 0.5 }}>{roleLabel}</div>
            </div>
          </div>
          <button className="admin-logout" onClick={() => setConfirmLogout(true)}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="admin-hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{currentLabel}</span>
            {/* Role badge */}
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: isSuperAdmin ? '#e0f0ff' : '#dcfce7', color: isSuperAdmin ? '#0277bd' : '#15803d', fontWeight: 800 }}>
              {roleLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{fmt(time)}</div>
              <div style={{ fontSize: 10, color: '#888' }}>{fmtDate(time)}</div>
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
              <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1.5px solid #e8e8e8', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={logout} style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#0288d1', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
