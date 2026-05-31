import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import ProductModal from '../../components/ProductModal';

const CAT_ICONS = {
  'kitchen-items': '🍳',
  'bags-purses': '👜',
  'toys-games': '🧸',
  'home-decor': '🏡',
  'electronics': '📱',
};

function FlashTimer() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 0);
    return Math.floor((end - now) / 1000);
  });
  useEffect(() => {
    const id = setInterval(() => setTime(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(time / 3600)).padStart(2, '0');
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
  const s = String(time % 60).padStart(2, '0');
  return (
    <div className="flash-timer">
      <div className="timer-box">{h}</div>
      <span className="timer-sep">:</span>
      <div className="timer-box">{m}</div>
      <span className="timer-sep">:</span>
      <div className="timer-box">{s}</div>
    </div>
  );
}

export default function ShopHome() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const loadMoreRef = useRef(null);

  const fetchProducts = useCallback(async (pg = 1, append = false) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (activeCategory) params.category = activeCategory;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      const list = Array.isArray(data) ? data : (data.products || data.data || []);
      setProducts(prev => append ? [...prev, ...list] : list);
      setTotalPages(data.pages || data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setActiveCategory(null);
  };

  const handleCatClick = (slug) => {
    setActiveCategory(slug === activeCategory ? null : slug);
    setSearch('');
    setSearchInput('');
  };

  const loadMore = () => {
    if (page < totalPages) {
      const next = page + 1;
      setPage(next);
      fetchProducts(next, true);
    }
  };

  const getDiscount = (price, compare) => {
    if (!compare || compare <= price) return null;
    return Math.round((1 - price / compare) * 100);
  };

  return (
    <>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Everything You Need,<br />Delivered Fast 🚀</h1>
          <p>Kitchen · Bags · Toys · Home Decor · Electronics</p>
          <button className="hero-cta" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
            Shop Now →
          </button>
        </div>
        <div className="hero-badge">
          <div className="badge-num">5+</div>
          <div className="badge-text">Categories</div>
        </div>
      </div>

      

      {/* Categories */}
      <div style={{ marginBottom: 12 }}>
        <div className="section-hdr">
          <span className="section-hdr-title">Categories</span>
          {activeCategory && (
            <span className="section-hdr-link" onClick={() => { setActiveCategory(null); setSearch(''); setSearchInput(''); }}>
              Clear ✕
            </span>
          )}
        </div>
        <div className="category-cards">
          <div className={`cat-card ${!activeCategory ? 'active' : ''}`} onClick={() => handleCatClick(null)}>
            <div className="cat-icon">🛍️</div>
            <div className="cat-name">All</div>
          </div>
          {categories.map(c => (
            <div key={c.id} className={`cat-card ${activeCategory === c.slug ? 'active' : ''}`} onClick={() => handleCatClick(c.slug)}>
              <div className="cat-icon">{CAT_ICONS[c.slug] || '📦'}</div>
              <div className="cat-name">{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="section-hdr" style={{ marginBottom: 10 }}>
          <span className="section-hdr-title">
            {activeCategory ? categories.find(c => c.slug === activeCategory)?.name : search ? `Results for "${search}"` : 'All Products'}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>{products.length} items</span>
        </div>

        {loading && products.length === 0 ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 14 }}>No products found</p>
            <button onClick={() => { setSearch(''); setSearchInput(''); setActiveCategory(null); }}
              style={{ marginTop: 14, background: '#e62e04', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
              Show All
            </button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map(p => {
                const disc = getDiscount(p.price, p.compare_price);
                return (
                  <div key={p.id} className="product-card" onClick={() => setSelectedSlug(p.slug)}>
                    <div className="product-img-wrap">
                      {p.images?.[0]
                        ? <img className="product-img" src={p.images[0]} alt={p.name} loading="lazy" />
                        : <div className="product-img-placeholder">{CAT_ICONS[p.category_slug] || '📦'}</div>
                      }
                      {disc && <div className="product-discount-badge">-{disc}%</div>}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-price-row">
                        <span className="price-main">Rs. {parseFloat(p.price).toLocaleString()}</span>
                        {p.compare_price && <span className="price-orig">Rs. {parseFloat(p.compare_price).toLocaleString()}</span>}
                      </div>
                      <div className="product-sold">🇱🇰 Free shipping</div>
                    </div>
                    <button className="product-card-btn" onClick={e => { e.stopPropagation(); setSelectedSlug(p.slug); }}>
                      Add to Cart +
                    </button>
                  </div>
                );
              })}
            </div>
            {page < totalPages && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <button onClick={loadMore} disabled={loading}
                  style={{ background: loading ? '#ccc' : 'white', color: loading ? '#fff' : '#e62e04', border: '1.5px solid', borderColor: loading ? '#ccc' : '#e62e04', padding: '10px 32px', borderRadius: 4, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedSlug && <ProductModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />}
    </>
  );
}
