import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import CartDrawer from './components/CartDrawer';

// Shop pages
import Home from './pages/shop/Home';
import Checkout from './pages/shop/Checkout';
import OrderSuccess from './pages/shop/OrderSuccess';

// Admin pages
import AdminLogin from './pages/admin/Login';
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

function ShopNavbar() {
  const { count, setCartOpen } = useCart();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Store search and navigate home
    if (searchInput.trim()) {
      navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <>
      
      {/* Main navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">Shop<span>LK</span></Link>

          <div className="navbar-search">
            <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
              <input
                type="text"
                placeholder="Search products, brands and categories…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button type="submit">🔍</button>
            </form>
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
      </footer>
    </div>
  );
}

const PAGE_MAP = {
  dashboard:       <Dashboard />,
  'new-bill':      <NewBill />,
  products:        <Products />,
  orders:          <Orders />,
  categories:      <Categories />,
  customers:       <Customers />,
  inventory:       <Inventory />,
  invoices:        <Invoices />,
  reports:         <Reports />,
  expenses:        <Expenses />,
  'bill-settings': <BillSettings />,
};

function AdminArea() {
  const { admin } = useAuth();
  const [page, setPage] = useState('dashboard');
  if (!admin) return <AdminLogin />;
  return (
    <AdminLayout page={page} setPage={setPage}>
      {PAGE_MAP[page] || <Dashboard />}
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
