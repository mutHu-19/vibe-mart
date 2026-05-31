import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={() => setCartOpen(false)} />
      <div className="cart-drawer">
        <div className="cart-hdr">
          <h2>🛒 My Cart ({items.length})</h2>
          <button className="cart-hdr-close" onClick={() => setCartOpen(false)}>×</button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <button onClick={() => setCartOpen(false)}
              style={{ marginTop: 16, background: '#e62e04', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, i) => (
                <div key={i} className="cart-item">
                  {item.image
                    ? <img className="cart-item-img" src={item.image} alt={item.name} />
                    : <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                  }
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-variant">
                      {[item.colour, item.size].filter(Boolean).join(' · ') || 'Standard'}
                    </div>
                    <div className="cart-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                    <div className="cart-item-actions">
                      <button className="cart-qty-btn" onClick={() => updateQty(i, item.quantity - 1)}>−</button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateQty(i, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-del" onClick={() => removeItem(i)} title="Remove">🗑️</button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="cart-total-val">Rs. {total.toLocaleString()}</span>
              </div>
              <div className="cart-sub">Delivery charge calculated at checkout</div>
              <button className="cart-checkout-btn" onClick={() => { setCartOpen(false); navigate('/checkout'); }}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
