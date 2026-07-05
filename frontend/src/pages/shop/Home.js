import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import ProductModal from '../../components/ProductModal';

const CAT_ICONS = { 'kitchen-items':'🍳','bags-purses':'👜','toys-games':'🧸','home-decor':'🏡','electronics':'📱' };
const CAT_COLORS = { 'kitchen-items':'#0288d1','bags-purses':'#e62e04','toys-games':'#7c3aed','home-decor':'#16a34a','electronics':'#d97706' };

function ProductCard({ p, onClick }) {
  const disc = p.compare_price && p.compare_price > p.price ? Math.round((1-p.price/p.compare_price)*100) : null;
  return (
    <div className="product-card" onClick={() => onClick(p.slug)}>
      <div className="product-img-wrap">
        {p.images?.[0] ? <img className="product-img" src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="product-img-placeholder">{CAT_ICONS[p.category_slug]||'📦'}</div>}
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
      <button className="product-card-btn" onClick={e=>{e.stopPropagation();onClick(p.slug);}}>Add to Cart +</button>
    </div>
  );
}

function CategoryPage({ category, onBack, onProductClick }) {
  const [activeSub, setActiveSub] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const color = CAT_COLORS[category.slug] || '#0288d1';

  const fetch = useCallback(async (pg=1, append=false, sub=null) => {
    setLoading(true);
    try {
      const params = { category: category.slug, page: pg, limit: 20 };
      if (sub) params.subcategory = sub;
      const { data } = await api.get('/products', { params });
      const list = data.products || [];
      setProducts(prev => append ? [...prev, ...list] : list);
      setTotalPages(data.pages || 1);
    } catch {}
    setLoading(false);
  }, [category.slug]);

  useEffect(() => { setPage(1); fetch(1, false, activeSub); }, [category.slug, activeSub, fetch]);

  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`,borderRadius:8,padding:'16px 20px',marginBottom:12,color:'#fff',display:'flex',alignItems:'center',gap:12 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',width:34,height:34,borderRadius:'50%',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>←</button>
        <div>
          <div style={{ fontSize:20,fontWeight:900,fontFamily:'Rubik,sans-serif' }}>{CAT_ICONS[category.slug]||'📦'} {category.name}</div>
          <div style={{ fontSize:12,opacity:0.8,marginTop:2 }}>{products.length} products</div>
        </div>
      </div>
      {category.subcategories?.length > 0 && (
        <div style={{ background:'#fff',borderRadius:8,padding:'10px 12px',marginBottom:12,border:'1px solid #f0f0f0' }}>
          <div style={{ fontSize:11,fontWeight:800,textTransform:'uppercase',color:'#aaa',marginBottom:8 }}>Browse by type</div>
          <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
            {[{name:'All',slug:null},...category.subcategories].map(s=>(
              <button key={s.slug||'all'} onClick={()=>setActiveSub(s.slug)}
                style={{ padding:'6px 14px',borderRadius:20,border:`1.5px solid ${activeSub===s.slug||(s.slug===null&&!activeSub)?color:'#e8e8e8'}`,background:activeSub===s.slug||(s.slug===null&&!activeSub)?color:'#fff',color:activeSub===s.slug||(s.slug===null&&!activeSub)?'#fff':'#555',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.15s' }}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && products.length === 0 ? <div className="loading-wrap"><div className="spinner" /></div> :
        products.length === 0 ? (
          <div style={{ textAlign:'center',padding:'3rem',color:'#aaa' }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🔍</div><p>No products found</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map(p=><ProductCard key={p.id} p={p} onClick={onProductClick} />)}
            </div>
            {page < totalPages && (
              <div style={{ textAlign:'center',padding:'16px 0' }}>
                <button onClick={()=>{const n=page+1;setPage(n);fetch(n,true,activeSub);}} disabled={loading}
                  style={{ background:'#fff',color,border:`1.5px solid ${color}`,padding:'10px 32px',borderRadius:4,fontWeight:800,cursor:'pointer',fontSize:13 }}>
                  Load More
                </button>
              </div>
            )}
          </>
        )
      }
    </div>
  );
}

export default function ShopHome() {
  const [featuredRows, setFeaturedRows] = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [activeCat, setActiveCat]       = useState(null);
  const [searchInput, setSearchInput]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const isPop = useRef(false);

  useEffect(() => {
    Promise.all([api.get('/products/featured-by-category'), api.get('/categories')])
      .then(([f, c]) => {
        setFeaturedRows(Array.isArray(f.data) ? f.data : []);
        setCategories(Array.isArray(c.data) ? c.data : []);
        setLoading(false);
      }).catch(() => setLoading(false));
    if (!window.history.state?.shoplkBase)
      window.history.replaceState({ shoplkBase:true, view:'home' }, '');
  }, []);

  useEffect(() => {
    const handle = (e) => {
      isPop.current = true;
      const s = e.state || { view:'home' };
      if (s.view === 'product') { setSelectedSlug(s.slug||null); }
      else { setSelectedSlug(null); }
      if (s.view === 'category') {
        const cat = categories.find(c=>c.slug===s.catSlug);
        setActiveCat(cat||null); setSearchResults(null);
      } else if (s.view === 'search') {
        setActiveCat(null); setSearchInput(s.query||'');
        if (s.query) api.get('/products',{params:{search:s.query,limit:40}}).then(r=>setSearchResults(r.data.products||[])).catch(()=>{});
      } else {
        setActiveCat(null); setSearchResults(null);
      }
      isPop.current = false;
    };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [categories]);

  const push = (state) => { if (!isPop.current) window.history.pushState(state,''); };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) { setSearchResults(null); return; }
    setSearchLoading(true); setActiveCat(null);
    try {
      const { data } = await api.get('/products', { params: { search:searchInput.trim(), limit:40 } });
      setSearchResults(data.products || []);
      push({ view:'search', query:searchInput.trim() });
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const clearSearch = () => { setSearchInput(''); setSearchResults(null); window.history.back(); };

  const handleCatClick = (cat) => {
    setActiveCat(cat); setSearchResults(null);
    push({ view:'category', catSlug:cat.slug });
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleBack = () => { setActiveCat(null); window.history.back(); };

  const openProduct = (slug) => {
    setSelectedSlug(slug);
    push({ view:'product', slug, catSlug:activeCat?.slug||null });
  };

  const closeProduct = () => { setSelectedSlug(null); window.history.back(); };

  if (loading) return <div className="loading-wrap" style={{ minHeight:300 }}><div className="spinner"/></div>;

  if (searchResults !== null) return (
    <>
      <div style={{ background:'#fff',borderRadius:8,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:10 }}>
        <button onClick={clearSearch} style={{ background:'#f5f5f5',border:'none',borderRadius:'50%',width:32,height:32,fontSize:16,cursor:'pointer' }}>←</button>
        <span style={{ fontWeight:700 }}>"{searchInput}" — {searchResults.length} found</span>
      </div>
      {searchLoading ? <div className="loading-wrap"><div className="spinner"/></div> :
        searchResults.length === 0 ? (
          <div style={{ textAlign:'center',padding:'3rem',color:'#aaa' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🔍</div>
            <p>No results for "{searchInput}"</p>
            <button onClick={clearSearch} style={{ marginTop:14,background:'#0288d1',color:'#fff',border:'none',padding:'8px 20px',borderRadius:4,fontWeight:700,cursor:'pointer' }}>Show All</button>
          </div>
        ) : <div className="product-grid">{searchResults.map(p=><ProductCard key={p.id} p={p} onClick={openProduct}/>)}</div>
      }
      {selectedSlug && <ProductModal slug={selectedSlug} onClose={closeProduct} />}
    </>
  );

  if (activeCat) return (
    <>
      <CategoryPage category={activeCat} onBack={handleBack} onProductClick={openProduct} />
      {selectedSlug && <ProductModal slug={selectedSlug} onClose={closeProduct} />}
    </>
  );

  return (
    <>
      <form onSubmit={handleSearch} style={{ display:'flex',marginBottom:12,background:'#fff',borderRadius:4,overflow:'hidden',border:'2px solid #0288d1' }}>
        <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search products…"
          style={{ flex:1,border:'none',padding:'11px 14px',fontSize:14,outline:'none' }} />
        <button type="submit" style={{ background:'#0288d1',border:'none',padding:'0 18px',color:'#fff',fontSize:16,cursor:'pointer',fontWeight:700 }}>🔍</button>
      </form>

      <div className="hero-banner" style={{ marginBottom:12 }}>
        <div className="hero-text">
          <h1>Everything You Need,<br/>Delivered Fast 🚀</h1>
          <p>Kitchen · Bags · Toys · Home Decor · Electronics</p>
          <button className="hero-cta" onClick={()=>window.scrollTo({top:500,behavior:'smooth'})}>Shop Now →</button>
        </div>
        <div className="hero-badge">
          <div className="badge-num">{categories.length}+</div>
          <div className="badge-text">Categories</div>
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <div className="section-hdr" style={{ marginBottom:8 }}>
          <span className="section-hdr-title">Shop by Category</span>
        </div>
        <div className="category-cards">
          {categories.map(c=>(
            <div key={c.id} className="cat-card" onClick={()=>handleCatClick(c)}>
              <div className="cat-icon">{CAT_ICONS[c.slug]||'📦'}</div>
              <div className="cat-name">{c.name}</div>
              {c.subcategories?.length>0 && <div style={{ fontSize:9,color:'#aaa',marginTop:2 }}>{c.subcategories.length} types</div>}
            </div>
          ))}
        </div>
      </div>

      {featuredRows.map(({ category, products }) => {
        const color = CAT_COLORS[category.slug] || '#0288d1';
        return (
          <div key={category.id} style={{ marginBottom:20 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:4,height:18,background:color,borderRadius:2 }} />
                <span style={{ fontFamily:'Rubik,sans-serif',fontWeight:800,fontSize:16,color:'#1b1b1b' }}>
                  {CAT_ICONS[category.slug]||'📦'} {category.name}
                </span>
              </div>
              <button onClick={()=>handleCatClick(category)}
                style={{ background:'none',border:`1.5px solid ${color}`,color,padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer' }}>
                See All →
              </button>
            </div>
            {category.subcategories?.length > 0 && (
              <div style={{ display:'flex',gap:6,overflowX:'auto',paddingBottom:6,marginBottom:8,scrollbarWidth:'none' }}>
                {category.subcategories.slice(0,6).map(s=>(
                  <button key={s.id} onClick={()=>handleCatClick(category)}
                    style={{ padding:'4px 12px',borderRadius:20,border:'1px solid #e8e8e8',background:'#fff',color:'#555',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="product-grid">
              {products.map(p=><ProductCard key={p.id} p={p} onClick={openProduct}/>)}
            </div>
          </div>
        );
      })}

      {selectedSlug && <ProductModal slug={selectedSlug} onClose={closeProduct} />}
    </>
  );
}
