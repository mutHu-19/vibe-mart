import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { items, count, total, cartOpen, setCartOpen, updateQty, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const handleClose = () => {
    // Use history.back() so the history stack stays clean
    // (we pushed an entry when opening, this pops it)
    window.history.back();
  };

  return (
    <>
      <div className="cart-overlay" onClick={handleClose} />
      <div className="cart-drawer">
        <div className="cart-hdr">
          <h2>🛒 Cart ({count})</h2>
          <button className="cart-hdr-close" onClick={handleClose}>×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon">🛍️</div>
              <p>Your cart is empty</p>
              <button onClick={handleClose}
                style={{ marginTop: 16, background: '#0288d1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => {
              const key = `${item.product_id}-${item.variant_id || 'default'}`;
              return (
                <div key={key} className="cart-item">
                  {item.image
                    ? <img className="cart-item-img" src={item.image} alt={item.name} />
                    : <div className="cart-item-img" style={{ background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                  }
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    {(item.colour || item.size) && (
                      <div className="cart-item-variant">{[item.colour, item.size].filter(Boolean).join(' · ')}</div>
                    )}
                    <div className="cart-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                    <div className="cart-item-actions">
                      <button className="cart-qty-btn" onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}>−</button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}>+</button>
                      <button className="cart-item-del" onClick={() => removeItem(item.product_id, item.variant_id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Total</span>
              <span className="cart-total-val">Rs. {total.toLocaleString()}</span>
            </div>
            <div className="cart-sub">Delivery charges may apply</div>
            <button className="cart-checkout-btn" onClick={handleCheckout}>
              Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
