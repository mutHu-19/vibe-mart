import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import CartDrawer from './components/CartDrawer';
import ShopPopup from './components/ShopPopup';
import FloatingButtons from './components/FloatingButtons';
import { RichTextDisplay } from './components/RichTextEditor';
import api from './utils/api';

import Home from './pages/shop/Home';
import Checkout from './pages/shop/Checkout';
import OrderSuccess from './pages/shop/OrderSuccess';

import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import NewBill from './pages/admin/NewBill';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Categories from './pages/admin/Categories';
import Customers from './pages/admin/Customers';
import Inventory from './pages/admin/Inventory';
import Invoices from './pages/admin/Invoices';
import Reports from './pages/admin/Reports';
import Expenses from './pages/admin/Expenses';
import BillSettings from './pages/admin/BillSettings';
import AdminUsers from './pages/admin/AdminUsers';
import ChangePassword from './pages/admin/ChangePassword';
import PopupSettings from './pages/admin/PopupSettings';
import CheckoutSettings from './pages/admin/CheckoutSettings';
import SiteSettings from './pages/admin/SiteSettings';
import OutstandingBalances from './pages/admin/OutstandingBalances';

// Fire this custom event to tell Home.js to open a given category
// (used by the mobile burger menu, which lives outside the Home route)
function openCategory(navigate, slug) {
  navigate('/');
  window.dispatchEvent(new CustomEvent('shoplk-open-category', { detail: { slug } }));
}

function MobileCategoryDrawer({ open, onClose, categories }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="mobile-cat-overlay" onClick={onClose}>
      <div className="mobile-cat-drawer" onClick={e => e.stopPropagation()}>
        <div className="mobile-cat-hdr">
          <h3>📂 Categories</h3>
          <button className="mobile-cat-close" onClick={onClose}>✕</button>
        </div>
        <div className="mobile-cat-item" onClick={() => { openCategory(navigate, null); onClose(); }}>
          <span className="mobile-cat-icon">🏠</span> Home
        </div>
        {categories.map(c => (
          <div key={c.id} className="mobile-cat-item" onClick={() => { openCategory(navigate, c.slug); onClose(); }}>
            <span className="mobile-cat-icon">{c.icon || '📦'}</span> {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopNavbar({ siteSettings }) {
  const { count, setCartOpen } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="topbar">
        <div style={{ display:'flex', gap:16 }}>
          <span>🇱🇰 Deliver to Sri Lanka</span>
          <Link to="/admin" style={{ opacity:0.7 }}>Seller Center</Link>
        </div>
      </div>
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="navbar-burger" onClick={() => setDrawerOpen(true)} aria-label="Categories">☰</button>

          <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            {siteSettings.logo_url
              ? <img src={siteSettings.logo_url} alt="Logo" className="navbar-logo-img" />
              : <>Shop<span>LK</span></>}
          </Link>

          <div className="navbar-search">
            <input type="text" placeholder="Search products, brands and categories…" readOnly />
            <button>🔍</button>
          </div>
          <div className="navbar-actions">
            <button className="navbar-icon-btn" onClick={() => setCartOpen(true)}>
              🛒 Cart {count > 0 && <span className="cart-count-badge">{count}</span>}
            </button>
            <Link to="/admin"><button className="navbar-icon-btn">⚙️ Admin</button></Link>
          </div>
        </div>
      </nav>
      <MobileCategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} categories={categories} />
    </>
  );
}

function ShopFooter({ siteSettings }) {
  const [policyModal, setPolicyModal] = useState(null); // 'delivery' | 'pricing' | 'preorder' | null

  const policyContent = {
    delivery: { title: '🚚 Delivery Policy', html: siteSettings.delivery_policy },
    pricing: { title: '💰 Pricing Policy', html: siteSettings.pricing_policy },
    preorder: { title: '📦 Pre-Order Policy', html: siteSettings.preorder_policy },
  };

  return (
    <footer className="shop-footer">
      <div className="footer-top">
        <div className="footer-col">
          <h4>🕒 Shop Hours</h4>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{siteSettings.shop_hours || 'Mon – Sat: 9.00 AM – 8.00 PM'}</p>
          <div className="footer-social">
            {siteSettings.facebook_url && (
              <a href={siteSettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
            )}
            {siteSettings.tiktok_url && (
              <a href={siteSettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.02 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>
              </a>
            )}
            {siteSettings.whatsapp_number && (
              <a href={`https://wa.me/${siteSettings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.099 1.501 5.823L0 24l6.335-1.493C8.027 23.48 9.987 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.637-.504-5.143-1.381l-.369-.219-3.759.886.927-3.651-.24-.382C2.537 15.64 2 13.876 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              </a>
            )}
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><Link to="/admin">Seller Center</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Policies</h4>
          <ul>
            <li><button onClick={() => setPolicyModal('delivery')}>Delivery Policy</button></li>
            <li><button onClick={() => setPolicyModal('pricing')}>Pricing Policy</button></li>
            <li><button onClick={() => setPolicyModal('preorder')}>Pre-Order Policy</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>ShopLK</h4>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>Everything you need, delivered fast across Sri Lanka.</p>
        </div>
      </div>

      <div className="footer-bottom">© 2025 ShopLK · Made with ❤️ in Sri Lanka</div>

      {policyModal && (
        <div className="modal-overlay" onClick={() => setPolicyModal(null)}>
          <div className="modal-box footer-policy-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#1b1b1b' }}>{policyContent[policyModal].title}</h3>
              <button onClick={() => setPolicyModal(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ color: '#333' }}>
              {policyContent[policyModal].html
                ? <RichTextDisplay html={policyContent[policyModal].html} />
                : <p style={{ color: '#aaa' }}>No policy has been added yet.</p>}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

function ShopLayout() {
  const [siteSettings, setSiteSettings] = useState({});

  // Ensure the browser always has a base history entry for this SPA
  // so the very first phone back-press doesn't exit the site
  useEffect(() => {
    if (!window.history.state?.shoplkBase)
      window.history.replaceState({ shoplkBase:true, view:'home' }, '');
    api.get('/site-settings').then(r => setSiteSettings(r.data || {})).catch(() => {});
  }, []);

  return (
    <div className="shop-layout">
      <ShopNavbar siteSettings={siteSettings} />
      <CartDrawer />
      <ShopPopup />
      <FloatingButtons />
      <main style={{ flex:1 }}>
        <div className="page-wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Routes>
        </div>
      </main>
      <ShopFooter siteSettings={siteSettings} />
    </div>
  );
}

function AdminPageRenderer({ page }) {
  const { isSuperAdmin } = useAuth();
  const superAdminPages = {
    'dashboard': <Dashboard />, 'products': <Products />,
    'categories': <Categories />, 'reports': <Reports />, 'admin-users': <AdminUsers />,
  };
  const allPages = {
    'new-bill': <NewBill />, 'customers': <Customers />, 'invoices': <Invoices />,
    'inventory': <Inventory />, 'orders': <Orders />, 'expenses': <Expenses />,
    'bill-settings': <BillSettings />, 'change-password': <ChangePassword />,
    'popup-settings': <PopupSettings />, 'outstanding-balances': <OutstandingBalances />,
    'checkout-settings': <CheckoutSettings />,
    'site-settings': <SiteSettings />,
  };
  if (superAdminPages[page] && !isSuperAdmin) return (
    <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#888' }}>
      <div style={{ fontSize:48, marginBottom:14 }}>🔒</div>
      <h3 style={{ fontWeight:800, marginBottom:8 }}>Access Restricted</h3>
      <p style={{ fontSize:13 }}>This page is only accessible to Super Admins.</p>
    </div>
  );
  return superAdminPages[page] || allPages[page] || <Dashboard />;
}

function AdminArea() {
  const { admin, isSuperAdmin } = useAuth();
  const [page, setPage] = useState(isSuperAdmin ? 'dashboard' : 'new-bill');
  if (!admin) return <Login />;
  return <AdminLayout page={page} setPage={setPage}><AdminPageRenderer page={page} /></AdminLayout>;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return isAdmin
    ? <Routes><Route path="/admin/*" element={<AdminArea />} /></Routes>
    : <ShopLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <ToastContainer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
