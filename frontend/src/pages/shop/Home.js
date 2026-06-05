import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import ProductModal from '../../components/ProductModal';

const CAT_ICONS = {
  'kitchen-items': '🍳', 'bags-purses': '👜', 'toys-games': '🧸',
  'home-decor': '🏡', 'electronics': '📱',
};
const CAT_COLORS = {
  'kitchen-items': '#ff6b35', 'bags-purses': '#e62e04', 'toys-games': '#0a68f4',
  'home-decor': '#16a34a', 'electronics': '#7c3aed',
};

function FlashTimer() {
  const [time, setTime] = useState(() => {
    const now = new Date(), end = new Date(now);
    end.setHours(23, 59, 59, 0);
    return Math.floor((end - now) / 1000);
  });
  useEffect(() => {
    const id = setInterval(() => setTime(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(time / 3600)).padStart(2, '0');
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
  const s = String(time % 60).padStart(2, '0');
  return (
    <div className="flash-timer">
      <div className="timer-box">{h}</div><span className="timer-sep">:</span>
      <div className="timer-box">{m}</div><span className="timer-sep">:</span>
      <div className="timer-box">{s}</div>
    </div>
  );
}

function ProductCard({ p, onClick }) {
  const disc = p.compare_price && p.compare_price > p.price
    ? Math.round((1 - p.price / p.compare_price) * 100) : null;
  return (
    <div className="product-card" onClick={() => onClick(p.slug)}>
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
      <button className="product-card-btn" onClick={e => { e.stopPropagation(); onClick(p.slug); }}>
        Add to Cart +
      </button>
    </div>
  );
}

// ── Category Browse Page (shown when user clicks a category) ──
function CategoryPage({ category, onBack, onProductClick }) {
  const [activeSubcat, setActiveSubcat] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const color = CAT_COLORS[category.slug] || '#e62e04';

  const fetchProducts = useCallback(async (pg = 1, append = false, subcat = activeSubcat) => {
    setLoading(true);
    try {
      const params = { category: category.slug, page: pg, limit: 20 };
      if (subcat) params.subcategory = subcat;
      const { data } = await api.get('/products', { params });
      const list = data.products || [];
      setProducts(prev => append ? [...prev, ...list] : list);
      setTotalPages(data.pages || 1);
    } catch {}
    setLoading(false);
  }, [category.slug, activeSubcat]);

  useEffect(() => { setPage(1); fetchProducts(1, false, activeSubcat); }, [category.slug, activeSubcat]);

  const handleSubcat = (slug) => {
    const next = slug === activeSubcat ? null : slug;
    setActiveSubcat(next);
    setPage(1);
    fetchProducts(1, false, next);
  };

  return (
    <div>
      {/* Category Header */}
      <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, borderRadius: 8, padding: '16px 20px', marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Rubik, sans-serif' }}>
            {CAT_ICONS[category.slug] || '📦'} {category.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{products.length} products</div>
        </div>
      </div>

      {/* Subcategories */}
      {category.subcategories?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#aaa', letterSpacing: 0.5, marginBottom: 8 }}>Browse by type</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={() => handleSubcat(null)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${!activeSubcat ? color : '#e8e8e8'}`, background: !activeSubcat ? color : '#fff', color: !activeSubcat ? '#fff' : '#555', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
              All
            </button>
            {category.subcategories.map(s => (
              <button key={s.id} onClick={() => handleSubcat(s.slug)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${activeSubcat === s.slug ? color : '#e8e8e8'}`, background: activeSubcat === s.slug ? color : '#fff', color: activeSubcat === s.slug ? '#fff' : '#555', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading && products.length === 0 ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <p>No products found</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map(p => <ProductCard key={p.id} p={p} onClick={onProductClick} />)}
          </div>
          {page < totalPages && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button onClick={() => { const next = page + 1; setPage(next); fetchProducts(next, true); }} disabled={loading}
                style={{ background: '#fff', color: color, border: `1.5px solid ${color}`, padding: '10px 32px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Home Component ──
export default function ShopHome() {
  const [featuredRows, setFeaturedRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [activeCategoryPage, setActiveCategoryPage] = useState(null); // browsing a category
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products/featured-by-category'),
      api.get('/categories'),
    ]).then(([featRes, catRes]) => {
      setFeaturedRows(Array.isArray(featRes.data) ? featRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) { setSearchResults(null); setActiveCategoryPage(null); return; }
    setSearchLoading(true);
    setActiveCategoryPage(null);
    try {
      const { data } = await api.get('/products', { params: { search: searchInput.trim(), limit: 40 } });
      setSearchResults(data.products || []);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const clearSearch = () => { setSearchInput(''); setSearchResults(null); };

  const handleCategoryClick = (cat) => {
    setActiveCategoryPage(cat);
    setSearchResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="loading-wrap" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  // ── Search Results View ──
  if (searchResults !== null) {
    return (
      <>
        <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={clearSearch} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer' }}>←</button>
          <span style={{ fontWeight: 700 }}>Results for "<span style={{ color: '#e62e04' }}>{searchInput}</span>" — {searchResults.length} found</span>
        </div>
        {searchLoading ? <div className="loading-wrap"><div className="spinner" /></div> :
          searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p>No products found for "{searchInput}"</p>
              <button onClick={clearSearch} style={{ marginTop: 14, background: '#e62e04', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>Show All</button>
            </div>
          ) : (
            <div className="product-grid">
              {searchResults.map(p => <ProductCard key={p.id} p={p} onClick={setSelectedSlug} />)}
            </div>
          )
        }
        {selectedSlug && <ProductModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />}
      </>
    );
  }

  // ── Category Browse View ──
  if (activeCategoryPage) {
    return (
      <>
        <CategoryPage
          category={activeCategoryPage}
          onBack={() => setActiveCategoryPage(null)}
          onProductClick={setSelectedSlug}
        />
        {selectedSlug && <ProductModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />}
      </>
    );
  }

  // ── Homepage View ──
  return (
    <>
      {/* Search bar (mobile prominent) */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, marginBottom: 12, background: '#fff', borderRadius: 4, overflow: 'hidden', border: '2px solid #e62e04' }}>
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="Search products…"
          style={{ flex: 1, border: 'none', padding: '11px 14px', fontSize: 14, outline: 'none' }} />
        <button type="submit" style={{ background: '#e62e04', border: 'none', padding: '0 18px', color: '#fff', fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>🔍</button>
      </form>

      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: 12 }}>
        <div className="hero-text">
          <h1>Everything You Need,<br />Delivered Fast 🚀</h1>
          <p>Kitchen · Bags · Toys · Home Decor · Electronics</p>
          <button className="hero-cta" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}>
            Shop Now →
          </button>
        </div>
        <div className="hero-badge">
          <div className="badge-num">{categories.length}+</div>
          <div className="badge-text">Categories</div>
        </div>
      </div>

      {/* Flash deal strip */}
      <div className="flash-strip" style={{ marginBottom: 12 }}>
        <div className="flash-label">⚡ DEALS</div>
        <FlashTimer />
        <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>Ends tonight</span>
      </div>

      {/* Category Pills */}
      <div style={{ marginBottom: 14 }}>
        <div className="section-hdr" style={{ marginBottom: 8 }}>
          <span className="section-hdr-title">Shop by Category</span>
        </div>
        <div className="category-cards">
          {categories.map(c => (
            <div key={c.id} className="cat-card" onClick={() => handleCategoryClick(c)}
              style={{ cursor: 'pointer' }}>
              <div className="cat-icon">{CAT_ICONS[c.slug] || '📦'}</div>
              <div className="cat-name">{c.name}</div>
              {c.subcategories?.length > 0 && (
                <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>{c.subcategories.length} types</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Rows per Category */}
      {featuredRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛍️</div>
          <p>No featured products yet — add some in Admin → Products</p>
        </div>
      ) : (
        featuredRows.map(({ category, products }) => {
          const color = CAT_COLORS[category.slug] || '#e62e04';
          return (
            <div key={category.id} style={{ marginBottom: 20 }}>
              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 18, background: color, borderRadius: 2 }} />
                  <span style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 800, fontSize: 16, color: '#1b1b1b' }}>
                    {CAT_ICONS[category.slug] || '📦'} {category.name}
                  </span>
                </div>
                <button onClick={() => handleCategoryClick(category)}
                  style={{ background: 'none', border: `1.5px solid ${color}`, color: color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  See All →
                </button>
              </div>

              {/* Subcategory quick filter pills */}
              {category.subcategories?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8, scrollbarWidth: 'none' }}>
                  {category.subcategories.slice(0, 6).map(s => (
                    <button key={s.id}
                      onClick={() => { handleCategoryClick({ ...category }); }}
                      style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #e8e8e8', background: '#fff', color: '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Horizontal scroll on mobile, grid on desktop */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}
                className="category-product-row">
                {products.map(p => <ProductCard key={p.id} p={p} onClick={setSelectedSlug} />)}
              </div>
            </div>
          );
        })
      )}

      {selectedSlug && <ProductModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />}
    </>
  );
}
