import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import CartDrawer from './components/CartDrawer';

// Shop pages
import Home from './pages/shop/Home';
import Checkout from './pages/shop/Checkout';
import OrderSuccess from './pages/shop/OrderSuccess';

// Admin pages
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
import ShopPopup from './components/ShopPopup';
import PopupSettings from './pages/admin/PopupSettings';

function ShopNavbar() {
  const { count, setCartOpen } = useCart();
  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', gap: 16 }}>
          <span>🇱🇰 Deliver to Sri Lanka</span>
          <Link to="/admin" style={{ opacity: 0.7 }}>Seller Center</Link>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Help &amp; Support</span>
        </div>
      </div>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">Shop<span>LK</span></Link>
          <div className="navbar-search">
            <input type="text" placeholder="Search products, brands and categories…" />
            <button>🔍</button>
          </div>
          <div className="navbar-actions">
            <button className="navbar-icon-btn" onClick={() => setCartOpen(true)}>
              🛒 Cart
              {count > 0 && <span className="cart-count-badge">{count}</span>}
            </button>
            <Link to="/admin">
              <button className="navbar-icon-btn">⚙️ Admin</button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

function ShopLayout() {
  return (
    <div className="shop-layout">
      <ShopNavbar />
      <CartDrawer />
      <ShopPopup />
      <main style={{ flex: 1 }}>
        <div className="page-wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Routes>
        </div>
      </main>
      <footer className="shop-footer">
        <p>© 2025 ShopLK — All rights reserved · Made with ❤️ in Sri Lanka</p>
        <p style={{ marginTop: 4, fontSize: 11 }}>Fast delivery · Secure payment · 100% genuine products</p>
      </footer>
    </div>
  );
}

// Role-based page map
// Pages that require super_admin are guarded here
function AdminPageRenderer({ page }) {
  const { isSuperAdmin, canAccess } = useAuth();

  // Super admin only pages
  const superAdminPages = {
    'dashboard':    <Dashboard />,
    'products':     <Products />,
    'categories':   <Categories />,
    'reports':      <Reports />,
    'admin-users':  <AdminUsers />,
  };

  // Pages accessible by all staff
  const allPages = {
    'new-bill':        <NewBill />,
    'customers':       <Customers />,
    'invoices':        <Invoices />,
    'inventory':       <Inventory />,
    'orders':          <Orders />,
    'expenses':        <Expenses />,
    'bill-settings':   <BillSettings />,
    'change-password': <ChangePassword />,
    'popup-settings': <PopupSettings />,
  };

  // If it's a super-admin-only page and user is not super admin
  if (superAdminPages[page] && !isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#888' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔒</div>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Access Restricted</h3>
        <p style={{ fontSize: 13 }}>This page is only accessible to Super Admins.</p>
      </div>
    );
  }

  return superAdminPages[page] || allPages[page] || <Dashboard />;
}

function AdminArea() {
  const { admin, isSuperAdmin } = useAuth();
  const [page, setPage] = useState(isSuperAdmin ? 'dashboard' : 'new-bill');

  if (!admin) return <Login />;

  return (
    <AdminLayout page={page} setPage={setPage}>
      <AdminPageRenderer page={page} />
    </AdminLayout>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return isAdmin ? (
    <Routes><Route path="/admin/*" element={<AdminArea />} /></Routes>
  ) : (
    <ShopLayout />
  );
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
