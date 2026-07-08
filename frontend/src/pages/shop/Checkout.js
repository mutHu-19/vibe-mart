import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', payment: 'cod', notes: '' });
  const [loading, setLoading] = useState(false);

  // Push a history entry when this page mounts, so the back button
  // goes to the shop (home) instead of exiting the site
  React.useEffect(() => {
    if (!window.history.state?.view || window.history.state.view === 'home') {
      window.history.replaceState({ view: 'checkout' }, '');
    }
    // On back, popstate fires; React Router handles navigating back to /
    const handlePop = () => { navigate('/'); };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [navigate]);

  const handleBack = () => { navigate(-1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) return;
    setLoading(true);
    try {
      const subtotal = total;
      const delivery = 0;
      const grandTotal = subtotal + delivery;
      const invoice_no = `WEB-${Date.now()}`;

      const orderData = {
        invoice_no,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        payment_method: form.payment,
        notes: form.notes,
        subtotal,
        delivery_charge: delivery,
        total: grandTotal,
        items: items.map(i => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          product_name: i.name,
          colour: i.colour,
          size: i.size,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        })),
      };

      await api.post('/orders', orderData);

      // WhatsApp message
      const wa = process.env.REACT_APP_WHATSAPP || '94766522855';
      const itemLines = items.map(i =>
        `• ${i.name}${i.colour ? ` (${i.colour})` : ''}${i.size ? ` ${i.size}` : ''} x${i.quantity} = Rs.${(i.price * i.quantity).toLocaleString()}`
      ).join('\n');
      const msg = `🛒 *New Order — ${invoice_no}*\n\n👤 *${form.name}*\n📞 ${form.phone}\n📍 ${form.address}\n\n${itemLines}\n\n💰 *Total: Rs.${grandTotal.toLocaleString()}*\n💳 Payment: ${form.payment === 'cod' ? 'Cash on Delivery' : 'Bank Deposit'}\n${form.notes ? `\n📝 ${form.notes}` : ''}`;
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');

      clearCart();
      navigate('/order-success', { state: { invoice_no, total: grandTotal, name: form.name } });
    } catch (err) {
      alert('Order failed. Please try again.');
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Cart is empty</h2>
        <button onClick={() => navigate('/')} style={{ background: '#0288d1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={handleBack}
          style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <h1 className="checkout-head" style={{ margin: 0 }}>Checkout <span>({items.length} items)</span></h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          <div>
            <div className="checkout-card">
              <h3>👤 Delivery Details</h3>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+94 77 123 4567" required />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea className="form-input" rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="House number, street, city" required style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions" />
              </div>
            </div>

            <div className="checkout-card">
              <h3>💳 Payment Method</h3>
              <div className="pay-opts">
                {[
                  { val: 'cod', icon: '💵', title: 'Cash on Delivery', desc: 'Pay when you receive' },
                  { val: 'bank_deposit', icon: '🏦', title: 'Bank Deposit', desc: 'Transfer before delivery' },
                ].map(opt => (
                  <div key={opt.val} className={`pay-opt ${form.payment === opt.val ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, payment: opt.val }))}>
                    <div className="pay-icon">{opt.icon}</div>
                    <h4>{opt.title}</h4>
                    <p>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="order-sum-card">
              <h3>🧾 Order Summary</h3>
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant_id}`} className="sum-item">
                  <div className="sum-item-name">
                    {item.name}
                    <div className="sum-item-detail">{[item.colour, item.size].filter(Boolean).join(' · ')} × {item.quantity}</div>
                  </div>
                  <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="sum-total">
                <span>Total</span>
                <span className="sum-val">Rs. {total.toLocaleString()}</span>
              </div>
              <button type="submit" className="place-order-btn" disabled={loading}>
                {loading ? '⏳ Placing…' : '📲 Place Order via WhatsApp'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 10 }}>
                You'll be redirected to WhatsApp to confirm your order
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
