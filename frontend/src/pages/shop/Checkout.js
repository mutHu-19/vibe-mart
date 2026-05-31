import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { showToast } from '../../components/Toast';
import api from '../../utils/api';

const DELIVERY = 350;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const grandTotal = total + DELIVERY;
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [payment, setPayment] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [placing, setPlacing] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleContinue = (e) => {
    e.preventDefault();
    if (items.length === 0) { showToast('Cart is empty', 'error'); return; }
    setShowPayModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!payment) { showToast('Select a payment method', 'error'); return; }
    setPlacing(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        size: item.size || null,
        colour: item.colour || null,
      }));
      const { data } = await api.post('/orders', {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        items: orderItems,
        payment_method: payment,
        delivery_charge: DELIVERY,
      });
      clearCart();
      navigate('/order-success', { state: { order: data, form, payment, items, total, grandTotal } });
    } catch (err) {
      showToast(err.response?.data?.error || 'Order failed', 'error');
    }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Your cart is empty</h2>
        <button onClick={() => navigate('/')}
          style={{ background: '#e62e04', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-head">🛒 Checkout <span>({items.length} items)</span></div>
      <form onSubmit={handleContinue}>
        <div className="checkout-layout">
          <div>
            {/* Customer Info */}
            <div className="checkout-card">
              <h3>👤 Delivery Details</h3>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" name="name" placeholder="e.g. Kamal Perera" required value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ padding: '10px 12px', background: '#f5f5f5', border: '1.5px solid #e8e8e8', borderRadius: 4, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                    🇱🇰 +94
                  </div>
                  <input className="form-input" name="phone" type="tel" placeholder="771234567" required value={form.phone} onChange={handleChange} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea className="form-input" name="address" placeholder="House No, Street, City, Postal Code" rows={3} required value={form.address} onChange={handleChange} style={{ resize: 'vertical' }} />
              </div>
            </div>

            {/* Delivery info */}
            <div className="checkout-card">
              <h3>🚚 Delivery Info</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['🕐 2-5 Days Delivery', '📦 Tracked Shipping', '🔒 Safe Packaging'].map(b => (
                  <span key={b} style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="order-sum-card">
              <h3>Order Summary</h3>
              {items.map((item, i) => (
                <div key={i} className="sum-item">
                  <div className="sum-item-name">
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{item.name}</div>
                    <div className="sum-item-detail">
                      {[item.colour, item.size].filter(Boolean).join(' · ')} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>Rs. {(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
              <div className="sum-item" style={{ fontSize: 13 }}>
                <span>Subtotal</span><span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="sum-item" style={{ fontSize: 13, color: '#16a34a' }}>
                <span>🚚 Delivery</span><span>Rs. {DELIVERY.toLocaleString()}</span>
              </div>
              <div className="sum-total">
                <span>Total</span>
                <span className="sum-val">Rs. {grandTotal.toLocaleString()}</span>
              </div>
              <button type="submit" className="place-order-btn">
                Continue to Payment →
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                {['🔒 Secure', '✅ Verified', '🇱🇰 Local'].map(b => (
                  <span key={b} style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: 0 }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: 460 }}>
            <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>💳 Select Payment</h3>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
            </div>

            <div className="pay-opts">
              {[
                { key: 'bank_deposit', icon: '🏦', title: 'Bank Deposit', desc: 'Transfer to our bank account' },
                { key: 'cash_on_delivery', icon: '💵', title: 'Cash on Delivery', desc: 'Pay when item arrives' },
              ].map(opt => (
                <div key={opt.key} className={`pay-opt ${payment === opt.key ? 'selected' : ''}`} onClick={() => setPayment(opt.key)}>
                  <div className="pay-icon">{opt.icon}</div>
                  <h4>{opt.title}</h4>
                  <p>{opt.desc}</p>
                </div>
              ))}
            </div>

            <button onClick={handlePlaceOrder} className="place-order-btn" disabled={!payment || placing}
              style={{ marginTop: 16, opacity: payment && !placing ? 1 : 0.5 }}>
              {placing ? '⏳ Placing Order…' : `✅ Place Order — Rs. ${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
