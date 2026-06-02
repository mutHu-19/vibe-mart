import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const PAYMENT_OPTS = [
  { val: 'cash', icon: '💵', label: 'Cash' },
  { val: 'bank_deposit', icon: '🏦', label: 'Bank' },
  { val: 'card', icon: '💳', label: 'Card' },
  { val: 'other', icon: '📱', label: 'Other' },
];

export default function NewBill() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [payment, setPayment] = useState('cash');
  const [delivery, setDelivery] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selVariant, setSelVariant] = useState(null);
  const [invoice, setInvoice] = useState(null); // for print modal
  const printRef = useRef();

  useEffect(() => {
    api.get('/products/admin/all').then(r => setProducts(r.data)).catch(()=>{});
    api.get('/categories').then(r => setCategories(Array.isArray(r.data) ? r.data : [])).catch(()=>{});
  }, []);

  const filtered = products.filter(p => {
    const matchCat = !cat || String(p.category_id) === String(cat);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.is_active;
  });

  const openProduct = async (p) => {
    setSelectedProduct(p);
    setSelVariant(null);
    try {
      const { data } = await api.get(`/products/${p.slug}`);
      setVariants(data.variants || []);
      if (data.variants?.length === 1) setSelVariant(data.variants[0]);
    } catch { setVariants([]); }
  };

  const addToCart = () => {
    const v = selVariant || variants[0] || null;
    const key = `${selectedProduct.id}-${v?.id || 'default'}`;
    const price = parseFloat(selectedProduct.price) + parseFloat(v?.extra_price || 0);
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key, product_id: selectedProduct.id, slug: selectedProduct.slug, product_name: selectedProduct.name, variant_id: v?.id||null, size: v?.size||null, colour: v?.colour||null, colour_hex: v?.colour_hex||null, price, qty: 1, image: selectedProduct.images?.[0] || null }];
    });
    setSelectedProduct(null);
    showToast(`${selectedProduct.name} added ✅`, 'success');
  };

  const updateQty = (key, qty) => {
    if (qty < 1) setCart(p => p.filter(i => i.key !== key));
    else setCart(p => p.map(i => i.key === key ? { ...i, qty } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryAmt = parseFloat(delivery) || 0;
  const discountAmt = parseFloat(discount) || 0;
  const grandTotal = subtotal + deliveryAmt - discountAmt;

  const handleCreateBill = async () => {
    if (!cart.length) { showToast('Add items first', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/bills', {
        customer_name: customer.name || 'Walk-in',
        customer_phone: customer.phone,
        customer_address: customer.address,
        payment_method: payment,
        delivery_charge: deliveryAmt,
        discount: discountAmt,
        notes,
        items: cart.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, size: i.size, colour: i.colour, quantity: i.qty }))
      });
      setInvoice(data.invoice);
      showToast(`Invoice ${data.invoice.invoice_no} created! 🎉`, 'success');
      setCart([]);
      setCustomer({ name: '', phone: '', address: '' });
      setPayment('cash');
      setDelivery('');
      setDiscount('');
      setNotes('');
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    setLoading(false);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=400,height=650');
    const shopSettings = JSON.parse(localStorage.getItem('shoplk_bill_settings') || '{}');
    const inv = invoice;
    w.document.write(`
      <html><head><title>Invoice ${inv.invoice_no}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; color: #000; }
        h1 { font-size: 16px; font-weight: 900; margin-bottom: 2px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .bold { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        th { text-align: left; font-size: 10px; color: #555; border-bottom: 1px solid #ddd; padding: 3px 0; }
        td { padding: 4px 0; vertical-align: top; font-size: 11px; }
        .total-row { font-size: 14px; font-weight: 900; }
        .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #888; }
      </style>
      </head><body>
      <div class="center">
        <h1>${shopSettings.shop_name || 'ShopLK'}</h1>
        ${shopSettings.address ? `<p>${shopSettings.address}</p>` : ''}
        ${shopSettings.phone ? `<p>${shopSettings.phone}</p>` : ''}
        <p style="font-size:10px;color:#888;">${new Date(inv.created_at).toLocaleString()}</p>
      </div>
      <div class="divider"></div>
      <div class="row"><span>Invoice:</span><span class="bold">${inv.invoice_no}</span></div>
      <div class="row"><span>Customer:</span><span>${inv.customer_name}</span></div>
      ${inv.customer_phone ? `<div class="row"><span>Phone:</span><span>${inv.customer_phone}</span></div>` : ''}
      ${inv.customer_address ? `<div class="row"><span>Address:</span><span style="max-width:180px;text-align:right">${inv.customer_address}</span></div>` : ''}
      <div class="divider"></div>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${inv.items.map(item => `
            <tr>
              <td>${item.product_name}${item.colour ? ` <span style="color:#888">${item.colour}</span>` : ''}${item.size ? ` <span style="color:#888">${item.size}</span>` : ''}</td>
              <td>${item.quantity}</td>
              <td>Rs.${parseFloat(item.unit_price).toFixed(2)}</td>
              <td>Rs.${parseFloat(item.total_price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="row"><span>Subtotal</span><span>Rs. ${parseFloat(inv.subtotal).toFixed(2)}</span></div>
      ${inv.delivery_charge > 0 ? `<div class="row"><span>Delivery</span><span>Rs. ${parseFloat(inv.delivery_charge).toFixed(2)}</span></div>` : ''}
      ${inv.discount > 0 ? `<div class="row"><span>Discount</span><span style="color:green">- Rs. ${parseFloat(inv.discount).toFixed(2)}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row total-row"><span>TOTAL</span><span>Rs. ${parseFloat(inv.total).toFixed(2)}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Payment</span><span class="bold">${inv.payment_method?.replace('_',' ').toUpperCase()}</span></div>
      ${inv.notes ? `<div style="margin-top:8px;font-size:11px;color:#555">Note: ${inv.notes}</div>` : ''}
      <div class="footer">
        <p>${shopSettings.footer_text || 'Thank you for your purchase!'}</p>
        <p style="margin-top:4px">${shopSettings.shop_name || 'ShopLK'}</p>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  const colours = selectedProduct ? [...new Map(variants.filter(v => v.colour).map(v => [v.colour, v])).values()] : [];
  const sizes = selectedProduct ? [...new Set(variants.filter(v => v.size).map(v => v.size))] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18 }}>🧾 New Bill / POS</h2>
          <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>All bills count toward P&L reports</p>
        </div>
      </div>

      {/* Main layout — stacks on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 12 }}>

        {/* LEFT — Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products…"
              className="admin-input" style={{ flex: 1 }} />
            <select value={cat} onChange={e => setCat(e.target.value)} className="admin-input" style={{ width: 150 }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Product grid — scrollable */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => openProduct(p)}
                style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e62e04'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'none'; }}>
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: 90, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                }
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#e62e04' }}>Rs. {parseFloat(p.price).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: p.total_stock > 0 ? '#16a34a' : '#e62e04', fontWeight: 700 }}>
                    {p.total_stock > 0 ? `${p.total_stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#ccc' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 13 }}>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Bill builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Customer */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: '#1b1b1b' }}>👤 Customer (optional)</div>
            <input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              placeholder="Name (or Walk-in)" className="admin-input" style={{ marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ padding: '9px 10px', background: '#f5f5f5', border: '1.5px solid #e8e8e8', borderRadius: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>+94</div>
              <input value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
                placeholder="Phone" className="admin-input" />
            </div>
            <input value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))}
              placeholder="Address" className="admin-input" />
          </div>

          {/* Cart */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #f0f0f0', flex: 1 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>🛒 Items ({cart.length})</span>
              {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#e62e04', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Clear</button>}
            </div>
            <div style={{ maxHeight: '22vh', overflowY: 'auto', padding: 8 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ccc' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🛍️</div>
                  <p style={{ fontSize: 12 }}>Click a product to add</p>
                </div>
              ) : cart.map(item => (
                <div key={item.key} style={{ display: 'flex', gap: 8, padding: '7px 8px', borderRadius: 6, marginBottom: 4, background: '#fafafa', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.product_name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{[item.colour, item.size].filter(Boolean).join(' · ')}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#e62e04' }}>Rs. {(item.price * item.qty).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.key, item.qty-1)} style={{ width: 22, height: 22, border: '1px solid #e8e8e8', borderRadius: 4, background: '#fff', cursor: 'pointer', fontWeight: 700 }}>−</button>
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty+1)} style={{ width: 22, height: 22, border: '1px solid #e8e8e8', borderRadius: 4, background: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals, delivery, discount */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 8 }}>
              <span>Subtotal</span><span style={{ fontWeight: 700 }}>Rs. {subtotal.toLocaleString()}</span>
            </div>

            {/* Delivery */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>🚚 Delivery</span>
              <input value={delivery} onChange={e => setDelivery(e.target.value)} type="number" min="0"
                placeholder="0" className="admin-input" style={{ flex: 1 }} />
            </div>

            {/* Discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>🏷️ Discount</span>
              <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" min="0"
                placeholder="0" className="admin-input" style={{ flex: 1 }} />
            </div>

            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', marginBottom: 8 }}>
                <span>Discount Applied</span><span>- Rs. {discountAmt.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 16, padding: '8px 0', borderTop: '2px solid #f0f0f0', marginBottom: 10 }}>
              <span>Total</span><span style={{ color: '#e62e04' }}>Rs. {grandTotal.toLocaleString()}</span>
            </div>

            {/* Notes */}
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="📝 Notes (optional)"
              className="admin-input" style={{ marginBottom: 10, fontSize: 12 }} />

            {/* Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
              {PAYMENT_OPTS.map(opt => (
                <div key={opt.val} onClick={() => setPayment(opt.val)}
                  style={{ border: `1.5px solid ${payment===opt.val?'#e62e04':'#e8e8e8'}`, borderRadius: 6, padding: '7px 4px', cursor: 'pointer', textAlign: 'center', background: payment===opt.val?'#fff1ee':'#fff', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{opt.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: payment===opt.val?'#e62e04':'#555' }}>{opt.label}</div>
                </div>
              ))}
            </div>

            <button onClick={handleCreateBill} disabled={loading || !cart.length}
              style={{ width: '100%', background: cart.length ? '#e62e04' : '#ccc', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 800, fontSize: 14, cursor: cart.length ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
              {loading ? '⏳ Creating…' : `🧾 Create Bill — Rs. ${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>

      {/* Variant selector modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-box" style={{ maxWidth: 400, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15 }}>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="modal-close" style={{ position: 'static' }}>×</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#e62e04', marginBottom: 16 }}>
                Rs. {parseFloat(selectedProduct.price).toLocaleString()}
              </div>

              {colours.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>
                    Colour {selVariant?.colour && `— ${selVariant.colour}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {colours.map(v => (
                      <div key={v.colour} onClick={() => setSelVariant(v)} title={v.colour}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: v.colour_hex||'#ccc', cursor: 'pointer', border: `3px solid ${selVariant?.colour===v.colour?'#e62e04':'transparent'}`, outline: `2px solid ${selVariant?.colour===v.colour?'#e62e04':'#e8e8e8'}`, transition: 'all 0.15s', transform: selVariant?.colour===v.colour?'scale(1.15)':'scale(1)' }} />
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>Size</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sizes.map(s => (
                      <button key={s} onClick={() => setSelVariant(variants.find(v => v.size===s))}
                        style={{ padding: '5px 14px', border: `2px solid ${selVariant?.size===s?'#e62e04':'#e8e8e8'}`, borderRadius: 4, background: selVariant?.size===s?'#fff1ee':'#fff', color: selVariant?.size===s?'#e62e04':'#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={addToCart}
                style={{ width: '100%', background: '#e62e04', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                + Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {invoice && (
        <div className="modal-overlay" onClick={() => setInvoice(null)}>
          <div className="modal-box" style={{ maxWidth: 420, borderRadius: 12, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#e62e04', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15 }}>🧾 Invoice Created!</h3>
              <button onClick={() => setInvoice(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {/* Invoice preview */}
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '14px', marginBottom: 14, fontSize: 13 }}>
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{JSON.parse(localStorage.getItem('shoplk_bill_settings')||'{}').shop_name || 'ShopLK'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(invoice.created_at).toLocaleString()}</div>
                </div>
                <div style={{ borderTop: '1px dashed #ddd', paddingTop: 10, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Invoice</span><strong style={{ color: '#e62e04' }}>{invoice.invoice_no}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Customer</span><span>{invoice.customer_name}</span></div>
                  {invoice.customer_phone && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#888' }}>Phone</span><span>{invoice.customer_phone}</span></div>}
                </div>
                <div style={{ borderTop: '1px dashed #ddd', marginTop: 8, paddingTop: 8 }}>
                  {invoice.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                      <span>{item.product_name}{item.colour ? ` · ${item.colour}` : ''}{item.size ? ` · ${item.size}` : ''} × {item.quantity}</span>
                      <span style={{ fontWeight: 700 }}>Rs. {parseFloat(item.total_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px dashed #ddd', marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span>Subtotal</span><span>Rs. {parseFloat(invoice.subtotal).toLocaleString()}</span></div>
                  {invoice.delivery_charge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span>Delivery</span><span>Rs. {parseFloat(invoice.delivery_charge).toLocaleString()}</span></div>}
                  {invoice.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: '#16a34a' }}><span>Discount</span><span>- Rs. {parseFloat(invoice.discount).toLocaleString()}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15, marginTop: 6 }}><span>TOTAL</span><span style={{ color: '#e62e04' }}>Rs. {parseFloat(invoice.total).toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, color: '#888' }}><span>Payment</span><span>{invoice.payment_method?.replace('_',' ').toUpperCase()}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlePrint} style={{ flex: 1, background: '#1b1b1b', color: '#fff', border: 'none', padding: '11px', borderRadius: 6, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🖨️ Print Invoice
                </button>
                <button onClick={() => setInvoice(null)} style={{ flex: 1, background: '#fff', color: '#555', border: '1.5px solid #e8e8e8', padding: '11px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
