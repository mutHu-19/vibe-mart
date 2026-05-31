import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_COLORS = { pending:{bg:'#fff3cd',color:'#856404'}, confirmed:{bg:'#d1ecf1',color:'#0c5460'}, processing:{bg:'#cce5ff',color:'#004085'}, shipped:{bg:'#d4edda',color:'#155724'}, delivered:{bg:'#d4edda',color:'#155724'}, cancelled:{bg:'#f8d7da',color:'#721c24'} };

export default function Invoices() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/orders').then(r => { setOrders(r.data.orders||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const openInvoice = async (o) => {
    const { data } = await api.get(`/orders/${o.id}`);
    setSelected(data);
  };

  const filtered = orders.filter(o => !search || o.invoice_no.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_phone.includes(search));

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:'4rem' }}><div style={{ width:40,height:40,border:'3px solid #eee',borderTopColor:'#e94560',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/></div>;

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ fontWeight:700, marginBottom:'0.2rem' }}>Invoices</h2>
          <p style={{ color:'#aaa', fontSize:'0.85rem' }}>{orders.length} total invoices</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <div style={{ background:'#fff3cd', borderRadius:10, padding:'0.4rem 0.85rem', fontSize:'0.8rem', fontWeight:700, color:'#856404' }}>⏳ Pending: {orders.filter(o=>o.status==='pending').length}</div>
          <div style={{ background:'#d4edda', borderRadius:10, padding:'0.4rem 0.85rem', fontSize:'0.8rem', fontWeight:700, color:'#155724' }}>✅ Delivered: {orders.filter(o=>o.status==='delivered').length}</div>
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid #f0f0f0' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by invoice no, customer name or phone..." style={{ width:'100%', padding:'0.6rem 1rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
            <thead>
              <tr style={{ background:'#fafafa' }}>
                {['Invoice No','Customer','Phone','Items','Total','Payment','Status','Date',''].map(h=>(
                  <th key={h} style={{ padding:'0.65rem 1rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.72rem', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.id} style={{ borderBottom:'1px solid #f8f8f8' }}>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#e94560' }}>{o.invoice_no}</td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{o.customer_name}</td>
                  <td style={{ padding:'0.75rem 1rem', color:'#888', fontSize:'0.82rem' }}>{o.customer_phone}</td>
                  <td style={{ padding:'0.75rem 1rem' }}>{o.item_count}</td>
                  <td style={{ padding:'0.75rem 1rem', fontWeight:700 }}>Rs. {parseFloat(o.total).toFixed(2)}</td>
                  <td style={{ padding:'0.75rem 1rem', fontSize:'0.82rem' }}>{o.payment_method==='bank_deposit'?'🏦 Bank':'💵 COD'}</td>
                  <td style={{ padding:'0.75rem 1rem' }}><span style={{ display:'inline-block', padding:'0.2rem 0.65rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, background:STATUS_COLORS[o.status]?.bg, color:STATUS_COLORS[o.status]?.color, textTransform:'capitalize' }}>{o.status}</span></td>
                  <td style={{ padding:'0.75rem 1rem', color:'#aaa', fontSize:'0.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:'0.75rem 1rem' }}><button onClick={()=>openInvoice(o)} style={{ padding:'0.3rem 0.75rem', borderRadius:8, border:'1.5px solid #e0e0e0', background:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ textAlign:'center',padding:'3rem',color:'#ccc' }}>No invoices found</div>}
        </div>
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:560, width:'100%', maxHeight:'85vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:'1.2rem', color:'#e94560' }}>{selected.invoice_no}</div>
                <div style={{ fontSize:'0.82rem', color:'#aaa' }}>{new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#aaa' }}>×</button>
            </div>

            <div style={{ background:'#fafafa', borderRadius:12, padding:'1rem', marginBottom:'1.25rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', fontSize:'0.88rem' }}>
              <span style={{ color:'#888' }}>Customer</span><span style={{ fontWeight:600 }}>{selected.customer_name}</span>
              <span style={{ color:'#888' }}>Phone</span><span>{selected.customer_phone}</span>
              <span style={{ color:'#888' }}>Address</span><span>{selected.customer_address}</span>
              <span style={{ color:'#888' }}>Payment</span><span style={{ fontWeight:600 }}>{selected.payment_method==='bank_deposit'?'🏦 Bank Deposit':'💵 Cash on Delivery'}</span>
              <span style={{ color:'#888' }}>Status</span>
              <span style={{ display:'inline-block', padding:'0.15rem 0.6rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, background:STATUS_COLORS[selected.status]?.bg, color:STATUS_COLORS[selected.status]?.color, textTransform:'capitalize', width:'fit-content' }}>{selected.status}</span>
            </div>

            <div style={{ fontWeight:700, marginBottom:'0.75rem' }}>Order Items</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem', marginBottom:'1rem' }}>
              <thead><tr style={{ background:'#fafafa' }}>{['Product','Colour','Size','Qty','Price'].map(h=><th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.72rem', borderBottom:'1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
              <tbody>
                {selected.items?.map((item,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #f8f8f8' }}>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:600 }}>{item.product_name}</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>{item.colour||'—'}</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>{item.size||'—'}</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>{item.quantity}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:700 }}>Rs. {parseFloat(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ fontWeight:800, fontSize:'1.1rem' }}>Total: <span style={{ color:'#e94560' }}>Rs. {parseFloat(selected.total).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
