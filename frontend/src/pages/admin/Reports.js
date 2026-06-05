import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const now = new Date();
const thisMonthFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
const today = now.toISOString().slice(0,10);

const REPORT_TYPES = [
  { val: 'sales',        label: 'Sales (Revenue)' },
  { val: 'product',      label: 'Product Wise Report' },
  { val: 'expenses',     label: 'Expenses' },
  { val: 'pnl',          label: 'Profit & Loss' },
  { val: 'customers',    label: 'Customers (Leaderboard)' },
  { val: 'discount',     label: 'Discounts Given' },
  { val: 'returns',      label: 'Returns' },
];

function downloadCSV(filename, rows, headers) {
  const escape = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [from, setFrom] = useState(thisMonthFrom);
  const [to, setTo] = useState(today);
  const [reportType, setReportType] = useState('sales');
  const [payMethod, setPayMethod] = useState('');
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { from, to };
      if (payMethod) params.payment_method = payMethod;

      const [sumRes, billRes, retRes] = await Promise.all([
        api.get('/bills/stats/summary', { params: { from, to } }),
        api.get('/bills', { params: { from, to, limit: 500 } }),
        api.get('/returns', { params: { from, to } }).catch(() => ({ data: [] })),
      ]);

      const expenses = JSON.parse(localStorage.getItem('shoplk_expenses') || '[]');
      const periodExpenses = expenses.filter(e => e.date >= from && e.date <= to);
      const totalExpenses = periodExpenses.reduce((s,e) => s + e.amount, 0);

      let filteredBills = billRes.data.bills || [];
      if (payMethod) filteredBills = filteredBills.filter(b => b.payment_method === payMethod);

      setSummary({ ...sumRes.data, totalExpenses, netProfit: (sumRes.data.gross_profit||0) - totalExpenses, periodExpenses });
      setBills(filteredBills);
      setReturns(Array.isArray(retRes.data) ? retRes.data : []);
      setGenerated(true);
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  const setPreset = (preset) => {
    const n = new Date();
    if (preset==='today')       { setFrom(today); setTo(today); }
    else if (preset==='week')   { const d=new Date(n); d.setDate(d.getDate()-6); setFrom(d.toISOString().slice(0,10)); setTo(today); }
    else if (preset==='month')  { setFrom(thisMonthFrom); setTo(today); }
    else if (preset==='last_month') {
      const f=new Date(n.getFullYear(),n.getMonth()-1,1);
      const t=new Date(n.getFullYear(),n.getMonth(),0);
      setFrom(f.toISOString().slice(0,10)); setTo(t.toISOString().slice(0,10));
    }
    else if (preset==='year')   { setFrom(`${n.getFullYear()}-01-01`); setTo(today); }
  };

  // Build product-wise data from bills
  const productData = (() => {
    const map = {};
    bills.forEach(bill => {
      (bill.items||[]).forEach(item => {
        const key = item.product_name;
        if (!map[key]) map[key] = { name: key, units: 0, revenue: 0, cost: 0 };
        map[key].units   += item.quantity || 0;
        map[key].revenue += parseFloat(item.total_price || 0);
        map[key].cost    += parseFloat(item.cost_price || 0) * (item.quantity || 0);
      });
    });
    return Object.values(map).sort((a,b) => b.revenue - a.revenue);
  })();

  // Customer leaderboard
  const customerData = (() => {
    const map = {};
    bills.forEach(b => {
      const k = b.customer_phone || b.customer_name;
      if (!map[k]) map[k] = { name: b.customer_name, phone: b.customer_phone, bills: 0, total: 0 };
      map[k].bills++;
      map[k].total += parseFloat(b.total || 0);
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  })();

  // Download handlers
  const handleDownload = () => {
    const label = REPORT_TYPES.find(r=>r.val===reportType)?.label || reportType;
    const fname = `${label.replace(/[^a-z0-9]/gi,'_')}_${from}_${to}.csv`;

    if (reportType === 'sales') {
      downloadCSV(fname, bills.map(b => [b.invoice_no, b.customer_name, b.customer_phone, b.item_count, b.subtotal, b.delivery_charge, b.discount, b.total, b.payment_method, new Date(b.created_at).toLocaleString()]),
        ['Invoice','Customer','Phone','Items','Subtotal','Delivery','Discount','Total','Payment','Date']);
    } else if (reportType === 'product') {
      downloadCSV(fname, productData.map(p => [p.name, p.units, p.revenue.toFixed(2), p.cost.toFixed(2), (p.revenue-p.cost).toFixed(2)]),
        ['Product','Units Sold','Revenue','Cost','Profit']);
    } else if (reportType === 'expenses') {
      const exp = summary?.periodExpenses || [];
      downloadCSV(fname, exp.map(e => [e.date, e.category, e.description||'', e.amount]),
        ['Date','Category','Description','Amount']);
    } else if (reportType === 'pnl') {
      downloadCSV(fname, [
        ['Gross Revenue', summary?.gross_revenue||0],
        ['Cost of Goods', summary?.cogs||0],
        ['Gross Profit', summary?.gross_profit||0],
        ['Expenses', summary?.totalExpenses||0],
        ['Net Profit', summary?.netProfit||0],
        ['Profit Margin %', summary?.gross_revenue>0?(((summary?.gross_profit||0)/summary?.gross_revenue)*100).toFixed(1)+'%':'0%'],
      ], ['Metric','Value']);
    } else if (reportType === 'customers') {
      downloadCSV(fname, customerData.map(c => [c.name, c.phone, c.bills, c.total.toFixed(2)]),
        ['Customer','Phone','Bills','Total Spent']);
    } else if (reportType === 'discount') {
      downloadCSV(fname, bills.filter(b=>b.discount>0).map(b => [b.invoice_no, b.customer_name, b.discount, b.discount_type, b.total, new Date(b.created_at).toLocaleString()]),
        ['Invoice','Customer','Discount','Type','Total','Date']);
    } else if (reportType === 'returns') {
      downloadCSV(fname, returns.map(r => [r.invoice_no, r.customer_name, r.item_count, r.reason||'', new Date(r.created_at).toLocaleString()]),
        ['Return No','Customer','Items','Reason','Date']);
    }
  };

  return (
    <>
      <div style={{marginBottom:16}}>
        <h2 style={{fontWeight:800,fontSize:18,marginBottom:2}}>📈 Reports & P&L</h2>
        <p style={{color:'#888',fontSize:12}}>Generate any report for any time period · Download as CSV</p>
      </div>

      {/* Filter card */}
      <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:14,border:'1px solid #f0f0f0'}}>
        <div style={{fontSize:12,fontWeight:800,textTransform:'uppercase',color:'#aaa',letterSpacing:0.5,marginBottom:10}}>Data Filter</div>

        {/* Quick presets */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {[{k:'today',l:'Today'},{k:'week',l:'Last 7 Days'},{k:'month',l:'This Month'},{k:'last_month',l:'Last Month'},{k:'year',l:'This Year'}].map(p=>(
            <button key={p.k} onClick={()=>setPreset(p.k)}
              style={{padding:'5px 14px',borderRadius:20,border:'1.5px solid #e8e8e8',background:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',color:'#555',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.target.style.borderColor='#e62e04';e.target.style.color='#e62e04';}}
              onMouseLeave={e=>{e.target.style.borderColor='#e8e8e8';e.target.style.color='#555';}}>
              {p.l}
            </button>
          ))}
        </div>

        {/* Date range + report type + payment */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:10,alignItems:'end',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:4}}>From</div>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="admin-input"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:4}}>To</div>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="admin-input"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:4}}>Report Type</div>
            <select value={reportType} onChange={e=>setReportType(e.target.value)} className="admin-input">
              {REPORT_TYPES.map(r=><option key={r.val} value={r.val}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:4}}>Payment Method</div>
            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} className="admin-input">
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_deposit">Bank Deposit</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn btn-danger" style={{height:38,minWidth:100}}>
            {loading ? '⏳ Loading…' : '📊 Generate'}
          </button>
        </div>
      </div>

      {generated && summary && (
        <>
          {/* Download button */}
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button onClick={handleDownload}
              style={{background:'#16a34a',color:'#fff',border:'none',padding:'9px 20px',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              ⬇️ Download CSV — {REPORT_TYPES.find(r=>r.val===reportType)?.label}
            </button>
          </div>

          {/* P&L Summary banner */}
          <div style={{background:'linear-gradient(135deg,#1b1b1b,#2d1c1c)',borderRadius:10,padding:'16px 20px',marginBottom:14,color:'#fff'}}>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1,opacity:0.5,marginBottom:12,fontWeight:800}}>
              P&L · {from} → {to}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:16}}>
              {[
                {l:'Gross Revenue', v:`Rs. ${(summary.gross_revenue||0).toLocaleString()}`, c:'#4ade80'},
                {l:'Cost of Goods',  v:`Rs. ${(summary.cogs||0).toLocaleString()}`, c:'#f87171'},
                {l:'Gross Profit',   v:`Rs. ${(summary.gross_profit||0).toLocaleString()}`, c:'#60a5fa'},
                {l:'Expenses',       v:`Rs. ${(summary.totalExpenses||0).toLocaleString()}`, c:'#fb923c'},
                {l:`Net ${summary.netProfit>=0?'Profit':'Loss'}`, v:`Rs. ${Math.abs(summary.netProfit||0).toLocaleString()}`, c:summary.netProfit>=0?'#4ade80':'#f87171'},
                {l:'Margin',         v:summary.gross_revenue>0?`${(((summary.gross_profit||0)/summary.gross_revenue)*100).toFixed(1)}%`:'0%', c:'#a78bfa'},
              ].map(item=>(
                <div key={item.l}>
                  <div style={{fontSize:10,opacity:0.5,textTransform:'uppercase',letterSpacing:0.5,marginBottom:2,fontWeight:700}}>{item.l}</div>
                  <div style={{fontSize:17,fontWeight:900,color:item.c,fontFamily:'Rubik,sans-serif'}}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SALES REPORT ── */}
          {reportType==='sales'&&(
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>💰 Sales Report ({bills.length} bills)</h3></div>
              <div style={{overflowX:'auto'}}>
                <table className="admin-table">
                  <thead><tr><th>Invoice</th><th>Customer</th><th>Phone</th><th>Items</th><th>Subtotal</th><th>Delivery</th><th>Discount</th><th>Total</th><th>Payment</th><th>Date</th></tr></thead>
                  <tbody>
                    {bills.map(b=>(
                      <tr key={b.id}>
                        <td><strong style={{color:'#e62e04',fontSize:12}}>{b.invoice_no}</strong></td>
                        <td style={{fontWeight:600}}>{b.customer_name}</td>
                        <td style={{fontSize:12,color:'#888'}}>{b.customer_phone}</td>
                        <td>{b.item_count}</td>
                        <td>Rs. {parseFloat(b.subtotal||b.total).toLocaleString()}</td>
                        <td style={{fontSize:12}}>{b.delivery_charge>0?`Rs. ${parseFloat(b.delivery_charge).toLocaleString()}`:'—'}</td>
                        <td style={{fontSize:12,color:'#16a34a'}}>{b.discount>0?`Rs. ${parseFloat(b.discount).toLocaleString()}`:'—'}</td>
                        <td style={{fontWeight:700}}>Rs. {parseFloat(b.total).toLocaleString()}</td>
                        <td style={{fontSize:12}}>{b.payment_method?.replace('_',' ')}</td>
                        <td style={{fontSize:12,color:'#aaa'}}>{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {bills.length===0&&<tr><td colSpan={10} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No bills in period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PRODUCT WISE REPORT ── */}
          {reportType==='product'&&(
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>📦 Product Wise Report ({productData.length} products)</h3></div>
              <div style={{overflowX:'auto'}}>
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th><th>Revenue Share</th></tr></thead>
                  <tbody>
                    {productData.map((p,i)=>{
                      const profit = p.revenue - p.cost;
                      const margin = p.revenue>0?((profit/p.revenue)*100).toFixed(1)+'%':'—';
                      const share  = summary.gross_revenue>0?((p.revenue/summary.gross_revenue)*100).toFixed(1)+'%':'—';
                      return (
                        <tr key={i}>
                          <td><div style={{width:24,height:24,borderRadius:'50%',background:i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#d97706':'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:11,color:i<3?'#fff':'#999'}}>{i+1}</div></td>
                          <td style={{fontWeight:700}}>{p.name}</td>
                          <td style={{fontWeight:700}}>{p.units}</td>
                          <td style={{fontWeight:700,color:'#16a34a'}}>Rs. {p.revenue.toLocaleString()}</td>
                          <td style={{color:'#888'}}>Rs. {p.cost.toLocaleString()}</td>
                          <td style={{fontWeight:700,color:profit>=0?'#0a68f4':'#e62e04'}}>Rs. {profit.toLocaleString()}</td>
                          <td style={{fontWeight:700,color:'#7c3aed'}}>{margin}</td>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,minWidth:60}}>
                                <div style={{width:share,height:'100%',background:'#e62e04',borderRadius:3,transition:'width 0.5s'}}/>
                              </div>
                              <span style={{fontSize:11,fontWeight:700,color:'#888',minWidth:32}}>{share}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {productData.length===0&&<tr><td colSpan={8} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No product sales in period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EXPENSES REPORT ── */}
          {reportType==='expenses'&&(
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>💸 Expenses ({summary.periodExpenses?.length||0})</h3></div>
              <table className="admin-table">
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                  {(summary.periodExpenses||[]).map((e,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:12,color:'#888'}}>{e.date}</td>
                      <td style={{fontWeight:600}}>{e.category}</td>
                      <td style={{color:'#888',fontSize:12}}>{e.description||'—'}</td>
                      <td style={{fontWeight:700,color:'#d97706'}}>Rs. {parseFloat(e.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!(summary.periodExpenses?.length)&&<tr><td colSpan={4} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No expenses in period</td></tr>}
                  {summary.periodExpenses?.length>0&&(
                    <tr style={{background:'#fafafa'}}>
                      <td colSpan={3} style={{fontWeight:800,fontSize:13,padding:'10px 14px'}}>Total</td>
                      <td style={{fontWeight:900,color:'#d97706',fontSize:14}}>Rs. {(summary.totalExpenses||0).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── P&L REPORT ── */}
          {reportType==='pnl'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div className="admin-card">
                <div className="admin-card-hdr"><h3>📊 P&L Breakdown</h3></div>
                <div style={{padding:'14px 18px'}}>
                  {[
                    {l:'Gross Revenue', v:summary.gross_revenue||0, c:'#16a34a'},
                    {l:'Cost of Goods Sold', v:-(summary.cogs||0), c:'#e62e04'},
                    {l:'Gross Profit', v:summary.gross_profit||0, c:'#0a68f4', border:true},
                    {l:'Expenses', v:-(summary.totalExpenses||0), c:'#d97706'},
                    {l:'Net Profit / Loss', v:summary.netProfit||0, c:summary.netProfit>=0?'#16a34a':'#e62e04', border:true, bold:true},
                  ].map(item=>(
                    <div key={item.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:item.border?'2px solid #f0f0f0':'1px solid #f9f9f9',fontWeight:item.bold?900:400}}>
                      <span style={{fontSize:13}}>{item.l}</span>
                      <span style={{fontSize:item.bold?15:13,fontWeight:item.bold?900:700,color:item.c}}>
                        {item.v>=0?'':'- '}Rs. {Math.abs(item.v).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-card">
                <div className="admin-card-hdr"><h3>💸 Expense Breakdown</h3></div>
                <div style={{padding:'12px 16px'}}>
                  {Object.entries((summary.periodExpenses||[]).reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{})).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                    <div key={cat} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                        <span style={{fontWeight:700}}>{cat}</span>
                        <span style={{fontWeight:700,color:'#d97706'}}>Rs. {amt.toLocaleString()}</span>
                      </div>
                      <div style={{background:'#f5f5f5',borderRadius:2,height:6}}>
                        <div style={{background:'#d97706',height:'100%',borderRadius:2,width:`${(amt/(summary.totalExpenses||1))*100}%`}}/>
                      </div>
                    </div>
                  ))}
                  {!summary.periodExpenses?.length&&<p style={{color:'#ccc',fontSize:13,textAlign:'center',padding:'1rem'}}>No expenses</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── CUSTOMERS LEADERBOARD ── */}
          {reportType==='customers'&&(
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>👥 Customer Leaderboard ({customerData.length})</h3></div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Bills</th><th>Total Spent</th><th>Avg Bill</th></tr></thead>
                <tbody>
                  {customerData.map((c,i)=>(
                    <tr key={i}>
                      <td><div style={{width:24,height:24,borderRadius:'50%',background:i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#d97706':'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:11,color:i<3?'#fff':'#999'}}>{i+1}</div></td>
                      <td style={{fontWeight:700}}>{c.name}</td>
                      <td style={{fontSize:12,color:'#888'}}>{c.phone}</td>
                      <td style={{fontWeight:700}}>{c.bills}</td>
                      <td style={{fontWeight:900,color:'#16a34a'}}>Rs. {c.total.toLocaleString()}</td>
                      <td style={{color:'#888',fontSize:12}}>Rs. {(c.total/c.bills).toFixed(0)}</td>
                    </tr>
                  ))}
                  {customerData.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DISCOUNTS REPORT ── */}
          {reportType==='discount'&&(
            <div className="admin-card">
              <div className="admin-card-hdr">
                <h3>🏷️ Discounts Given</h3>
                <span style={{fontSize:12,color:'#888'}}>Total: Rs. {bills.filter(b=>b.discount>0).reduce((s,b)=>s+parseFloat(b.discount),0).toLocaleString()}</span>
              </div>
              <table className="admin-table">
                <thead><tr><th>Invoice</th><th>Customer</th><th>Discount</th><th>Type</th><th>Bill Total</th><th>Date</th></tr></thead>
                <tbody>
                  {bills.filter(b=>b.discount>0).map(b=>(
                    <tr key={b.id}>
                      <td><strong style={{color:'#e62e04',fontSize:12}}>{b.invoice_no}</strong></td>
                      <td style={{fontWeight:600}}>{b.customer_name}</td>
                      <td style={{fontWeight:700,color:'#16a34a'}}>Rs. {parseFloat(b.discount).toLocaleString()}</td>
                      <td style={{fontSize:12}}>{b.discount_type==='percent'?'%':'Fixed'}</td>
                      <td style={{fontWeight:700}}>Rs. {parseFloat(b.total).toLocaleString()}</td>
                      <td style={{fontSize:12,color:'#aaa'}}>{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!bills.filter(b=>b.discount>0).length&&<tr><td colSpan={6} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No discounts given in period</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── RETURNS REPORT ── */}
          {reportType==='returns'&&(
            <div className="admin-card">
              <div className="admin-card-hdr"><h3>↩️ Returns Report ({returns.length})</h3></div>
              <table className="admin-table">
                <thead><tr><th>Return No</th><th>Customer</th><th>Items</th><th>Reason</th><th>Date</th></tr></thead>
                <tbody>
                  {returns.map((r,i)=>(
                    <tr key={i}>
                      <td><strong style={{color:'#7c3aed',fontSize:12}}>{r.invoice_no}</strong></td>
                      <td style={{fontWeight:600}}>{r.customer_name}</td>
                      <td>{r.item_count}</td>
                      <td style={{fontSize:12,color:'#888'}}>{r.reason||'—'}</td>
                      <td style={{fontSize:12,color:'#aaa'}}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {returns.length===0&&<tr><td colSpan={5} style={{textAlign:'center',color:'#ccc',padding:'2rem'}}>No returns in period</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!generated&&!loading&&(
        <div style={{textAlign:'center',padding:'4rem 2rem',color:'#ccc'}}>
          <div style={{fontSize:48,marginBottom:14}}>📊</div>
          <p style={{fontSize:14,fontWeight:600}}>Select a date range and report type, then click Generate</p>
        </div>
      )}
    </>
  );
}
