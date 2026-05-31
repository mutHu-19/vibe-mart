import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    api.get('/products/admin/all').then(r => { setProducts(r.data); setLoading(false); });
  }, []);

  const openEdit = async (p) => {
    const { data } = await api.get(`/products/${p.slug}`);
    setVariants(data.variants || []);
    setEditing(p);
  };

  const saveVariants = async () => {
    try {
      await api.put(`/products/${editing.id}/variants`, { variants });
      showToast('Stock updated!', 'success');
      setEditing(null);
      api.get('/products/admin/all').then(r => setProducts(r.data));
    } catch { showToast('Failed to update', 'error'); }
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const stockColor = (qty) => qty === 0 ? { bg:'#fef2f2',color:'#dc2626',label:'Out of Stock' } : qty < 5 ? { bg:'#fffbeb',color:'#d97706',label:'Low Stock' } : { bg:'#f0fdf4',color:'#16a34a',label:'In Stock' };

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:'4rem' }}><div style={{ width:40,height:40,border:'3px solid #eee',borderTopColor:'#e94560',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/></div>;

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ fontWeight:700, marginBottom:'0.2rem' }}>Inventory</h2>
          <p style={{ color:'#aaa', fontSize:'0.85rem' }}>Manage stock levels for all products</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <div style={{ background:'#f0fdf4', borderRadius:10, padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight:700, color:'#16a34a' }}>✅ In Stock: {products.filter(p=>(p.total_stock||0)>=5).length}</div>
          <div style={{ background:'#fffbeb', borderRadius:10, padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight:700, color:'#d97706' }}>⚠️ Low: {products.filter(p=>(p.total_stock||0)>0&&(p.total_stock||0)<5).length}</div>
          <div style={{ background:'#fef2f2', borderRadius:10, padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight:700, color:'#dc2626' }}>❌ Out: {products.filter(p=>(p.total_stock||0)===0).length}</div>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid #f0f0f0' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search products..." style={{ width:'300px', padding:'0.6rem 1rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
            <thead>
              <tr style={{ background:'#fafafa' }}>
                {['Product','SKU','Price','Total Stock','Status','Action'].map(h=>(
                  <th key={h} style={{ padding:'0.65rem 1rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #f0f0f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = stockColor(p.total_stock||0);
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f8f8f8' }}>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{p.name}</td>
                    <td style={{ padding:'0.75rem 1rem', color:'#aaa', fontFamily:'monospace', fontSize:'0.8rem' }}>{p.sku||'—'}</td>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:700 }}>Rs. {parseFloat(p.price).toFixed(2)}</td>
                    <td style={{ padding:'0.75rem 1rem', fontWeight:700, fontSize:'1rem' }}>{p.total_stock||0}</td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <span style={{ display:'inline-block', padding:'0.2rem 0.65rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, background:sc.bg, color:sc.color }}>{sc.label}</span>
                    </td>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <button onClick={()=>openEdit(p)} style={{ padding:'0.35rem 0.85rem', borderRadius:8, border:'1.5px solid #e0e0e0', background:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Update Stock</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:500, width:'100%' }}>
            <button onClick={()=>setEditing(null)} style={{ float:'right', background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#aaa' }}>×</button>
            <h3 style={{ fontWeight:700, marginBottom:'0.25rem', fontSize:'1.1rem' }}>Update Stock</h3>
            <p style={{ color:'#aaa', fontSize:'0.85rem', marginBottom:'1.5rem' }}>{editing.name}</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem', marginBottom:'1.5rem' }}>
              <thead>
                <tr style={{ background:'#fafafa' }}>
                  {['Colour','Size','Current Stock','New Stock'].map(h=>(
                    <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.72rem', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f8f8f8' }}>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      {v.colour_hex && <span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:v.colour_hex, marginRight:6, verticalAlign:'middle' }}/>}
                      {v.colour||'—'}
                    </td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>{v.size||'—'}</td>
                    <td style={{ padding:'0.5rem 0.75rem', fontWeight:700, color: v.stock_qty===0?'#dc2626':v.stock_qty<5?'#d97706':'#16a34a' }}>{v.stock_qty}</td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <input type="number" min="0" value={v.stock_qty} onChange={e=>{const nv=[...variants];nv[i].stock_qty=parseInt(e.target.value)||0;setVariants(nv);}} style={{ width:80, padding:'0.4rem 0.6rem', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.9rem', outline:'none' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={()=>setEditing(null)} style={{ padding:'0.65rem 1.25rem', borderRadius:10, border:'1.5px solid #e0e0e0', background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={saveVariants} style={{ padding:'0.65rem 1.5rem', borderRadius:10, border:'none', background:'#e94560', color:'#fff', cursor:'pointer', fontWeight:700 }}>Save Stock</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
