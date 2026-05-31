import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/customers').then(r => { setCustomers(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openCustomer = async (c) => {
    setSelected(c);
    const { data } = await api.get(`/customers/${c.id}/orders`);
    setOrders(data || []);
  };

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:'4rem' }}><div style={{ width:40,height:40,border:'3px solid #eee',borderTopColor:'#e94560',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/></div>;

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ fontWeight:700, marginBottom:'0.2rem' }}>Customers</h2>
          <p style={{ color:'#aaa', fontSize:'0.85rem' }}>{customers.length} total customers</p>
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid #f0f0f0' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name or phone..." style={{ width:'100%', padding:'0.6rem 1rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
            <thead>
              <tr style={{ background:'#fafafa' }}>
                {['#','Name','Phone','Address','Joined'].map(h=>(
                  <th key={h} style={{ padding:'0.65rem 1rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #f0f0f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i) => (
                <tr key={c.id} onClick={() => openCustomer(c)} style={{ borderBottom:'1px solid #f8f8f8', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fef9f9'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'0.75rem 1rem', color:'#aaa' }}>{i+1}</td>
                  <td style={{ padding:'0.75rem 1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'#e94560', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 }}>{c.name[0].toUpperCase()}</div>
                      <span style={{ fontWeight:600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'0.75rem 1rem' }}>{c.phone}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'#888', maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.address}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'#aaa' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:'#ccc' }}>No customers found</div>}
        </div>
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:560, width:'100%', maxHeight:'80vh', overflow:'auto' }}>
            <button onClick={()=>setSelected(null)} style={{ float:'right', background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#aaa' }}>×</button>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
              <div style={{ width:50, height:50, borderRadius:'50%', background:'#e94560', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.3rem' }}>{selected.name[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:'1.1rem' }}>{selected.name}</div>
                <div style={{ color:'#aaa', fontSize:'0.85rem' }}>{selected.phone}</div>
                <div style={{ color:'#aaa', fontSize:'0.8rem' }}>{selected.address}</div>
              </div>
            </div>
            <div style={{ fontWeight:700, marginBottom:'0.75rem' }}>Order History</div>
            {orders.length===0 ? <p style={{ color:'#ccc', fontSize:'0.9rem' }}>No orders yet</p> : orders.map(o=>(
              <div key={o.id} style={{ background:'#fafafa', borderRadius:10, padding:'0.85rem', marginBottom:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#e94560', fontSize:'0.9rem' }}>{o.invoice_no}</div>
                  <div style={{ fontSize:'0.78rem', color:'#aaa' }}>{new Date(o.created_at).toLocaleDateString()} · {o.payment_method==='bank_deposit'?'🏦 Bank':'💵 COD'}</div>
                </div>
                <div style={{ fontWeight:800, color:'#1a1a2e' }}>Rs. {parseFloat(o.total).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
