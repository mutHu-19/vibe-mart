import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const STATUS_COLORS = {
  pending:{bg:'#fff3cd',color:'#856404'}, confirmed:{bg:'#d1ecf1',color:'#0c5460'},
  processing:{bg:'#cce5ff',color:'#004085'}, shipped:{bg:'#d4edda',color:'#155724'},
  delivered:{bg:'#d4edda',color:'#155724'}, cancelled:{bg:'#f8d7da',color:'#721c24'}
};

function printInvoice(inv) {
  const shop = JSON.parse(localStorage.getItem('shoplk_bill_settings')||'{}');
  const w = window.open('','_blank','width=420,height=700');
  const advancePaid = parseFloat(inv.advance_paid || 0);
  const balanceDue = parseFloat(inv.balance_due ?? (parseFloat(inv.total) - advancePaid));

  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_no}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:16px;color:#000}
  h1{font-size:16px;font-weight:900}.center{text-align:center}.divider{border-top:1px dashed #999;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:3px 0}.bold{font-weight:700}
  table{width:100%;border-collapse:collapse;margin:6px 0}
  th{text-align:left;font-size:10px;color:#555;border-bottom:1px solid #ddd;padding:3px 0}
  td{padding:4px 0;font-size:11px;vertical-align:top}.total-row{font-size:14px;font-weight:900}
  .balance-row{font-size:13px;font-weight:900;color:#c00}
  .footer{margin-top:16px;text-align:center;font-size:10px;color:#888}</style></head><body>
  <div class="center"><h1>${shop.shop_name||'ShopLK'}</h1>
  ${shop.address?`<p>${shop.address}</p>`:''}${shop.phone?`<p>${shop.phone}</p>`:''}
  <p style="font-size:10px;color:#888">${new Date(inv.created_at).toLocaleString()}</p></div>
  <div class="divider"></div>
  <div class="row"><span>Invoice:</span><span class="bold">${inv.invoice_no}</span></div>
  <div class="row"><span>Customer:</span><span class="bold">${inv.customer_name}</span></div>
  ${inv.customer_phone?`<div class="row"><span>Phone:</span><span>${inv.customer_phone}</span></div>`:''}
  ${inv.customer_phone2?`<div class="row"><span>Phone 2:</span><span>${inv.customer_phone2}</span></div>`:''}
  ${inv.customer_address?`<div class="row"><span>Address:</span><span style="max-width:190px;text-align:right">${inv.customer_address}</span></div>`:''}
  <div class="divider"></div>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
  ${(inv.items||[]).map(it=>`<tr>
    <td>${it.product_name||it.name||''}${it.colour?` (${it.colour})`:''}${it.size?` ${it.size}`:''}</td>
    <td>${it.quantity||it.qty||1}</td>
    <td>Rs.${parseFloat(it.unit_price||it.price||0).toFixed(2)}</td>
    <td>Rs.${parseFloat(it.total_price||(it.unit_price*(it.quantity||1))||0).toFixed(2)}</td>
  </tr>`).join('')}
  </tbody></table><div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>Rs. ${parseFloat(inv.subtotal||inv.total||0).toFixed(2)}</span></div>
  ${(inv.delivery_charge||inv.deliveryFee)>0?`<div class="row"><span>Delivery</span><span>Rs. ${parseFloat(inv.delivery_charge||inv.deliveryFee||0).toFixed(2)}</span></div>`:''}
  ${inv.discount>0?`<div class="row"><span>Discount</span><span style="color:green">- Rs. ${parseFloat(inv.discount).toFixed(2)}</span></div>`:''}
  <div class="divider"></div>
  <div class="row total-row"><span>TOTAL</span><span>Rs. ${parseFloat(inv.total).toFixed(2)}</span></div>
  ${advancePaid > 0 ? `
  <div class="row" style="color:green"><span>Advance Paid</span><span>- Rs. ${advancePaid.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="row balance-row"><span>BALANCE DUE</span><span>Rs. ${balanceDue.toFixed(2)}</span></div>
  ` : ''}
  <div class="divider"></div>
  <div class="row"><span>Payment</span><span class="bold">${(inv.payment_method||'').replace('_',' ').toUpperCase()}</span></div>
  ${inv.notes?`<div style="margin-top:8px;font-size:11px;color:#555">Note: ${inv.notes}</div>`:''}
  <div class="footer"><p>${shop.footer_text||'Thank you for your purchase!'}</p><p style="margin-top:4px">${shop.shop_name||'ShopLK'}</p></div>
  <script>window.onload=()=>window.print();</script></body></html>`);
  w.document.close();
}

export default function Invoices() {
  const [tab, setTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnBill, setReturnBill] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, o, r] = await Promise.all([
        api.get('/bills'),
        api.get('/orders'),
        api.get('/returns'),
      ]);
      setBills(b.data.bills||[]);
      setOrders(o.data.orders||[]);
      setReturnsList(Array.isArray(r.data)?r.data:[]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openBill = async (b) => {
    const { data } = await api.get(`/bills/${b.id}`);
    setSelected({ ...data, _type: 'bill' });
  };

  const openOrder = async (o) => {
    const { data } = await api.get(`/orders/${o.id}`);
    setSelected({ ...data, _type: 'order' });
  };

  const openReturn = async (r) => {
    const { data } = await api.get(`/returns/${r.id}`);
    setSelected({ ...data, _type: 'return' });
  };

  const startReturn = (bill) => {
    setReturnBill(bill);
    setReturnItems((bill.items||[]).map(it => ({ ...it, return_qty: 0 })));
    setReturnReason('');
    setReturnNotes('');
    setShowReturnForm(true);
    setSelected(null);
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.return_qty > 0);
    if (!itemsToReturn.length) { showToast('Set quantity > 0 for at least one item','error'); return; }
    setProcessing(true);
    try {
      await api.post('/returns', {
        bill_id: returnBill.id,
        customer_name: returnBill.customer_name,
        reason: returnReason,
        notes: returnNotes,
        items: itemsToReturn.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          variant_id: i.variant_id||null,
          size: i.size||null,
          colour: i.colour||null,
          quantity: i.return_qty,
          unit_price: i.unit_price,
        }))
      });
      showToast('Return processed — stock restored ✅','success');
      setShowReturnForm(false);
      fetchData();
    } catch(err) { showToast(err.response?.data?.error||'Failed','error'); }
    setProcessing(false);
  };

  const filterFn = (list, keys) => list.filter(i => !search || keys.some(k => String(i[k]||'').toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="loading-wrap"><div className="spinner"/></div>;

  // Total outstanding across all bills (for quick visibility on this tab)
  const totalOutstanding = bills.reduce((s, b) => s + parseFloat(b.balance_due || 0), 0);

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div>
          <h2 style={{fontWeight:800,fontSize:18,marginBottom:2}}>Invoices & Returns</h2>
          <p style={{color:'#888',fontSize:12}}>{bills.length} bills · {orders.length} web orders · {returnsList.length} returns</p>
        </div>
        {totalOutstanding > 0 && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '8px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Total Outstanding</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>Rs. {totalOutstanding.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:14,background:'#fff',borderRadius:8,border:'1px solid #f0f0f0',overflow:'hidden',width:'fit-content'}}>
        {[{key:'bills',label:`🧾 Bills (${bills.length})`},{key:'orders',label:`🛒 Web Orders (${orders.length})`},{key:'returns',label:`↩️ Returns (${returnsList.length})`}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{padding:'9px 18px',border:'none',background:tab===t.key?'#0288d1':'#fff',color:tab===t.key?'#fff':'#555',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all 0.15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{marginBottom:10}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search invoice, customer, phone…" className="admin-input" style={{maxWidth:320}}/>
      </div>

      {/* Bills tab */}
      {tab==='bills'&&(
        <div className="admin-card">
          <div style={{overflowX:'auto'}}>
            <table className="admin-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Advance</th><th>Balance Due</th><th>Discount</th><th>Payment</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filterFn(bills,['invoice_no','customer_name','customer_phone']).map(b=>{
                  const advance = parseFloat(b.advance_paid || 0);
                  const balance = parseFloat(b.balance_due ?? 0);
                  return (
                    <tr key={b.id}>
                      <td><strong style={{color:'#0277bd',fontSize:12}}>{b.invoice_no}</strong></td>
                      <td style={{fontWeight:600}}>{b.customer_name}</td>
                      <td style={{fontSize:12,color:'#888'}}>{b.customer_phone}</td>
                      <td>{b.item_count}</td>
                      <td style={{fontWeight:700}}>Rs. {parseFloat(b.total).toLocaleString()}</td>
                      <td style={{fontSize:12,color: advance > 0 ? '#16a34a' : '#ccc',fontWeight:700}}>
                        {advance > 0 ? `Rs. ${advance.toLocaleString()}` : '—'}
                      </td>
                      <td style={{fontSize:12,fontWeight: balance > 0 ? 900 : 400, color: balance > 0 ? '#dc2626' : '#ccc'}}>
                        {balance > 0 ? `Rs. ${balance.toLocaleString()}` : (advance > 0 ? '✅ Paid' : '—')}
                      </td>
                      <td style={{fontSize:12,color:'#16a34a'}}>{b.discount>0?`Rs. ${parseFloat(b.discount).toLocaleString()}`:'—'}</td>
                      <td style={{fontSize:12}}>{b.payment_method?.replace('_',' ')}</td>
                      <td style={{fontSize:12,color:'#aaa'}}>{new Date(b.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={()=>openBill(b)}>View</button>
                      </td>
                    </tr>
                  );
                })}
                {bills.length===0&&<tr><td colSpan={11} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No bills yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Web Orders tab */}
      {tab==='orders'&&(
        <div className="admin-card">
          <div style={{overflowX:'auto'}}>
            <table className="admin-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filterFn(orders,['invoice_no','customer_name','customer_phone']).map(o=>(
                  <tr key={o.id}>
                    <td><strong style={{color:'#0277bd',fontSize:12}}>{o.invoice_no}</strong></td>
                    <td style={{fontWeight:600}}>{o.customer_name}</td>
                    <td style={{fontSize:12,color:'#888'}}>{o.customer_phone}</td>
                    <td style={{fontWeight:700}}>Rs. {parseFloat(o.total).toLocaleString()}</td>
                    <td style={{fontSize:12}}>{o.payment_method==='bank_deposit'?'🏦 Bank':'💵 COD'}</td>
                    <td><span style={{display:'inline-block',padding:'2px 8px',borderRadius:50,fontSize:11,fontWeight:800,background:STATUS_COLORS[o.status]?.bg,color:STATUS_COLORS[o.status]?.color,textTransform:'capitalize'}}>{o.status}</span></td>
                    <td style={{fontSize:12,color:'#aaa'}}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={()=>openOrder(o)}>View</button></td>
                  </tr>
                ))}
                {orders.length===0&&<tr><td colSpan={8} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No web orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returns tab */}
      {tab==='returns'&&(
        <div className="admin-card">
          <div style={{overflowX:'auto'}}>
            <table className="admin-table">
              <thead><tr><th>Return No</th><th>Customer</th><th>Items</th><th>Reason</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filterFn(returnsList,['invoice_no','customer_name']).map(r=>(
                  <tr key={r.id}>
                    <td><strong style={{color:'#7c3aed',fontSize:12}}>{r.invoice_no}</strong></td>
                    <td style={{fontWeight:600}}>{r.customer_name}</td>
                    <td>{r.item_count}</td>
                    <td style={{fontSize:12,color:'#888'}}>{r.reason||'—'}</td>
                    <td style={{fontSize:12,color:'#aaa'}}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={()=>openReturn(r)}>View</button></td>
                  </tr>
                ))}
                {returnsList.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No returns yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice detail modal */}
      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" style={{maxWidth:560,borderRadius:12,padding:0}} onClick={e=>e.stopPropagation()}>
            <div style={{background:selected._type==='return'?'#7c3aed':selected._type==='bill'?'#0288d1':'#0a68f4',color:'#fff',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:800,fontSize:15}}>{selected.invoice_no}</div>
                <div style={{fontSize:11,opacity:0.7}}>{new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {selected._type==='bill'&&(
                  <>
                    <button onClick={()=>printInvoice(selected)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>🖨️ Print</button>
                    <button onClick={()=>startReturn(selected)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>↩️ Return</button>
                  </>
                )}
                {selected._type==='order'&&(
                  <button onClick={()=>printInvoice({...selected,subtotal:selected.total,items:selected.items?.map(i=>({...i,product_name:i.product_name||i.name,unit_price:i.unit_price||i.price}))})} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,fontWeight:700,fontSize:12,cursor:'pointer'}}>🖨️ Print</button>
                )}
                <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:16}}>×</button>
              </div>
            </div>
            <div style={{padding:'16px 18px',maxHeight:'70vh',overflowY:'auto'}}>
              {/* Customer info */}
              <div style={{background:'#f9f9f9',borderRadius:8,padding:'12px 14px',marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:800,color:'#888',textTransform:'uppercase',marginBottom:8}}>Customer</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:13}}>
                  {[['Name',selected.customer_name],['Phone',selected.customer_phone],selected.customer_phone2&&['Phone 2',selected.customer_phone2],selected.customer_address&&['Address',selected.customer_address],['Payment',(selected.payment_method||'').replace('_',' ').toUpperCase()]].filter(Boolean).map(([k,v])=>(
                    <React.Fragment key={k}><div style={{color:'#888'}}>{k}</div><div style={{fontWeight:600}}>{v}</div></React.Fragment>
                  ))}
                </div>
              </div>
              {/* Items */}
              <table className="admin-table" style={{fontSize:12,marginBottom:12}}>
                <thead><tr><th>Item</th><th>Colour</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {(selected.items||[]).map((it,i)=>(
                    <tr key={i}>
                      <td style={{fontWeight:600}}>{it.product_name||it.name}</td>
                      <td>{it.colour||'—'}</td>
                      <td>{it.size||'—'}</td>
                      <td style={{fontWeight:700}}>{it.quantity||it.qty||1}</td>
                      <td style={{fontWeight:700,color:'#0277bd'}}>Rs. {parseFloat(it.total_price||(it.unit_price*(it.quantity||1))||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totals — now includes advance + balance for bills */}
              <div style={{background:'#f9f9f9',borderRadius:8,padding:'10px 14px'}}>
                {[
                  ['Subtotal', `Rs. ${parseFloat(selected.subtotal||selected.total||0).toLocaleString()}`],
                  selected.delivery_charge > 0 && ['Delivery', `Rs. ${parseFloat(selected.delivery_charge).toLocaleString()}`],
                  selected.discount > 0 && ['Discount', `- Rs. ${parseFloat(selected.discount).toLocaleString()}`],
                  ['TOTAL', `Rs. ${parseFloat(selected.total).toLocaleString()}`],
                ].filter(Boolean).map(([k, v], i, arr) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: i === arr.length - 1 ? 900 : 400, fontSize: i === arr.length - 1 ? 15 : 13, borderTop: i === arr.length - 1 ? '1px solid #e8e8e8' : 'none', marginTop: i === arr.length - 1 ? 6 : 0, paddingTop: i === arr.length - 1 ? 6 : 3, color: k === 'Discount' ? '#16a34a' : k === 'TOTAL' ? '#0277bd' : 'inherit' }}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}

                {/* Advance payment + balance due — only for bills with advance_paid > 0 */}
                {selected._type === 'bill' && parseFloat(selected.advance_paid || 0) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 3px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      <span>Advance Paid</span><span>- Rs. {parseFloat(selected.advance_paid).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 4, borderTop: '1px solid #fca5a5', fontSize: 16, fontWeight: 900, color: '#dc2626' }}>
                      <span>BALANCE DUE</span>
                      <span>Rs. {parseFloat(selected.balance_due ?? (selected.total - selected.advance_paid)).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              {selected.notes&&<div style={{marginTop:10,fontSize:12,color:'#888',padding:'8px 10px',background:'#fffbeb',borderRadius:6}}>📝 {selected.notes}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Return form modal */}
      {showReturnForm&&returnBill&&(
        <div className="modal-overlay" onClick={()=>setShowReturnForm(false)}>
          <div className="modal-box" style={{maxWidth:520,borderRadius:12,padding:0}} onClick={e=>e.stopPropagation()}>
            <div style={{background:'#7c3aed',color:'#fff',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontWeight:800,fontSize:15}}>↩️ Process Return — {returnBill.invoice_no}</h3>
              <button onClick={()=>setShowReturnForm(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:16}}>×</button>
            </div>
            <div style={{padding:'16px 18px',maxHeight:'70vh',overflowY:'auto'}}>
              <div style={{background:'#f3e8ff',borderRadius:8,padding:'10px 12px',marginBottom:14,fontSize:12,color:'#7c3aed',fontWeight:600}}>
                ⚡ Returned items will restore stock automatically
              </div>
              <div style={{fontSize:12,fontWeight:800,color:'#888',textTransform:'uppercase',marginBottom:8}}>Select items to return (set quantity)</div>
              {returnItems.map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',background:'#f9f9f9',borderRadius:8,marginBottom:6}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13}}>{item.product_name}</div>
                    <div style={{fontSize:11,color:'#aaa'}}>{[item.colour,item.size].filter(Boolean).join(' · ')} · Purchased: {item.quantity}</div>
                    <div style={{fontSize:12,color:'#0277bd',fontWeight:700}}>Rs. {parseFloat(item.unit_price).toLocaleString()}/unit</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                    <span style={{fontSize:11,color:'#888',fontWeight:600}}>Return:</span>
                    <button onClick={()=>{const n=[...returnItems];n[i].return_qty=Math.max(0,n[i].return_qty-1);setReturnItems(n);}} style={{width:26,height:26,border:'1px solid #e8e8e8',borderRadius:4,background:'#fff',cursor:'pointer',fontWeight:700}}>−</button>
                    <span style={{fontWeight:800,fontSize:14,minWidth:20,textAlign:'center',color:item.return_qty>0?'#7c3aed':'#ccc'}}>{item.return_qty}</span>
                    <button onClick={()=>{const n=[...returnItems];n[i].return_qty=Math.min(item.quantity,n[i].return_qty+1);setReturnItems(n);}} style={{width:26,height:26,border:'1px solid #e8e8e8',borderRadius:4,background:'#fff',cursor:'pointer',fontWeight:700}}>+</button>
                  </div>
                </div>
              ))}
              <div className="admin-form-group" style={{marginTop:12}}>
                <label className="admin-label">Reason for Return</label>
                <input value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="e.g. Damaged, Wrong item, Customer changed mind" className="admin-input"/>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Notes</label>
                <input value={returnNotes} onChange={e=>setReturnNotes(e.target.value)} placeholder="Additional notes" className="admin-input"/>
              </div>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <button onClick={handleProcessReturn} disabled={processing||!returnItems.some(i=>i.return_qty>0)}
                  style={{flex:1,background:returnItems.some(i=>i.return_qty>0)?'#7c3aed':'#ccc',color:'#fff',border:'none',padding:'11px',borderRadius:6,fontWeight:800,fontSize:13,cursor:returnItems.some(i=>i.return_qty>0)?'pointer':'not-allowed'}}>
                  {processing?'⏳ Processing…':'↩️ Process Return & Restore Stock'}
                </button>
                <button onClick={()=>setShowReturnForm(false)} style={{background:'#fff',color:'#555',border:'1.5px solid #e8e8e8',padding:'11px 16px',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
