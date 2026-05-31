import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const DELIVERY = 350;

export default function NewBill() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [payment, setPayment] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [addDelivery, setAddDelivery] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selVariant, setSelVariant] = useState(null);

  useEffect(() => {
    api.get('/products/admin/all').then(r => setProducts(r.data));
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  const filtered = products.filter(p => {
    const matchCat = !cat || String(p.category_id) === String(cat);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.is_active;
  });

  const openProduct = async (p) => {
    setSelectedProduct(p);
    setSelVariant(null);
    const { data } = await api.get(`/products/${p.slug}`);
    setVariants(data.variants || []);
    if (data.variants?.length === 1) setSelVariant(data.variants[0]);
  };

  const addToCart = () => {
    const v = selVariant || variants[0];
    const key = `${selectedProduct.id}-${v?.id || 'default'}`;
    const price = parseFloat(selectedProduct.price) + parseFloat(v?.extra_price || 0);
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key, product_id: selectedProduct.id, product_name: selectedProduct.name, variant_id: v?.id, size: v?.size, colour: v?.colour, colour_hex: v?.colour_hex, price, qty: 1, image: selectedProduct.images?.[0] }];
    });
    setSelectedProduct(null);
    showToast(`${selectedProduct.name} added`, 'success');
  };

  const updateQty = (key, qty) => {
    if (qty < 1) setCart(p => p.filter(i => i.key !== key));
    else setCart(p => p.map(i => i.key === key ? { ...i, qty } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = addDelivery ? DELIVERY : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!cart.length) { showToast('Add items to cart first', 'error'); return; }
    if (!customer.name || !customer.phone) { showToast('Customer name & phone required', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        payment_method: payment,
        delivery_charge: deliveryFee,
        items: cart.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, size: i.size, colour: i.colour, quantity: i.qty }))
      });
      showToast(`Invoice ${data.invoice_no} created!`, 'success');
      window.open(data.whatsapp_url, '_blank');
      setCart([]);
      setCustomer({ name: '', phone: '', address: '' });
      setPayment('cash_on_delivery');
      setAddDelivery(false);
    } catch (err) { showToast(err.response?.data?.error || 'Failed to create bill', 'error'); }
    setLoading(false);
  };

  const colours = selectedProduct ? [...new Map(variants.filter(v => v.colour).map(v => [v.colour, v])).values()] : [];
  const sizes = selectedProduct ? [...new Set(variants.filter(v => v.size).map(v => v.size))] : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', height: 'calc(100vh - 100px)' }}>

      {/* LEFT — Products */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {/* Search & Filter */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem', border: '1px solid #eee', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#aaa' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: '0.9rem', outline: 'none' }} />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: '0.6rem 0.9rem', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: '0.85rem', outline: 'none', color: '#333', cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: '0.85rem', paddingBottom: '0.5rem' }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => openProduct(p)} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #eee', cursor: 'pointer', transition: 'all 0.18s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(233,69,96,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; }}>
              {p.images?.[0]
                ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: 110, background: 'linear-gradient(135deg,#f5f5f5,#ebebeb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
              }
              <div style={{ padding: '0.6rem 0.75rem 0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem', lineHeight: 1.3, color: '#1a1a2e' }}>{p.name}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e94560' }}>Rs. {parseFloat(p.price).toFixed(2)}</div>
                <div style={{ fontSize: '0.7rem', color: p.total_stock > 0 ? '#27ae60' : '#e74c3c', fontWeight: 600, marginTop: '0.2rem' }}>
                  {p.total_stock > 0 ? `${p.total_stock} in stock` : 'Out of stock'}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#ccc' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Cart & Customer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflow: 'hidden' }}>
        {/* Customer */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem', border: '1px solid #eee' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: '#1a1a2e' }}>👤 Customer Details</div>
          <input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Customer name *" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '0.85rem', outline: 'none', marginBottom: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.55rem 0.65rem', background: '#f5f5f5', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>+94</div>
            <input value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="Phone *" style={{ flex: 1, padding: '0.55rem 0.75rem', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }} />
          </div>
          <input value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="Address" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }} />
        </div>

        {/* Cart Items */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>🛒 Cart ({cart.length})</span>
            {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#e94560', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Clear all</button>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ccc' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛍️</div>
                <p style={{ fontSize: '0.85rem' }}>Click a product to add</p>
              </div>
            ) : cart.map(item => (
              <div key={item.key} style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem', borderRadius: 10, marginBottom: '0.4rem', background: '#fafafa', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#aaa' }}>
                    {item.colour && `${item.colour}`}{item.colour && item.size && ' · '}{item.size && `${item.size}`}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e94560', marginTop: '0.1rem' }}>Rs. {(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <button onClick={() => updateQty(item.key, item.qty - 1)} style={{ width: 24, height: 24, border: '1.5px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.key, item.qty + 1)} style={{ width: 24, height: 24, border: '1.5px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Payment */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888', marginBottom: '0.35rem' }}>
            <span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" checked={addDelivery} onChange={e => setAddDelivery(e.target.checked)} style={{ cursor: 'pointer' }} />
              🚚 Add delivery (Rs. {DELIVERY})
            </label>
            <span style={{ fontSize: '0.85rem', color: '#888' }}>{addDelivery ? `Rs. ${DELIVERY}.00` : 'Rs. 0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', padding: '0.6rem 0', borderTop: '2px solid #f0f0f0', marginBottom: '0.75rem' }}>
            <span>Total</span><span style={{ color: '#e94560' }}>Rs. {grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[{ val: 'bank_deposit', icon: '🏦', label: 'Bank Deposit' }, { val: 'cash_on_delivery', icon: '💵', label: 'Cash on Delivery' }].map(opt => (
              <div key={opt.val} onClick={() => setPayment(opt.val)} style={{ border: `2px solid ${payment === opt.val ? '#e94560' : '#e8e8e8'}`, borderRadius: 10, padding: '0.6rem', cursor: 'pointer', textAlign: 'center', background: payment === opt.val ? '#fef5f7' : '#fff', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{opt.icon}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: payment === opt.val ? '#e94560' : '#555' }}>{opt.label}</div>
              </div>
            ))}
          </div>

          <button onClick={handlePlaceOrder} disabled={loading || !cart.length} style={{ width: '100%', background: cart.length ? '#e94560' : '#ccc', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: cart.length ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {loading ? '⏳ Processing...' : `✅ Create Bill — Rs. ${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Variant selector modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setSelectedProduct(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#aaa' }}>×</button>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '1.1rem' }}>{selectedProduct.name}</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e94560', marginBottom: '1.25rem' }}>Rs. {parseFloat(selectedProduct.price).toFixed(2)}</div>

            {colours.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.5rem' }}>Colour {selVariant?.colour && `— ${selVariant.colour}`}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {colours.map(v => (
                    <div key={v.colour} onClick={() => setSelVariant(v)} style={{ width: 32, height: 32, borderRadius: '50%', background: v.colour_hex || '#ccc', cursor: 'pointer', border: `3px solid ${selVariant?.colour === v.colour ? '#1a1a2e' : 'transparent'}`, transform: selVariant?.colour === v.colour ? 'scale(1.15)' : 'none', transition: 'all 0.15s' }} title={v.colour} />
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.5rem' }}>Size</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sizes.map(s => (
                    <button key={s} onClick={() => setSelVariant(variants.find(v => v.size === s))} style={{ padding: '0.35rem 0.9rem', border: `2px solid ${selVariant?.size === s ? '#1a1a2e' : '#e0e0e0'}`, borderRadius: 8, background: selVariant?.size === s ? '#1a1a2e' : '#fff', color: selVariant?.size === s ? '#fff' : '#333', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={addToCart} style={{ width: '100%', background: '#e94560', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              + Add to Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
