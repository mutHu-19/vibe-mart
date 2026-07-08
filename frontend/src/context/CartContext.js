import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shoplk_cart_v3') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpenState] = useState(false);
  const isPop = useRef(false);

  useEffect(() => {
    localStorage.setItem('shoplk_cart_v3', JSON.stringify(items));
  }, [items]);

  // Listen for back button — if cart is open, close it instead of navigating away
  useEffect(() => {
    const handlePop = (e) => {
      isPop.current = true;
      const state = e.state || {};
      if (cartOpen && state.view !== 'cart') {
        // Back was pressed while cart was open — close the cart
        setCartOpenState(false);
        // Re-push the underlying state so further back presses work correctly
        window.history.pushState(state, '');
      }
      isPop.current = false;
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [cartOpen]);

  const setCartOpen = (open) => {
    if (open && !cartOpen) {
      // Opening cart — push a history entry so back button can close it
      if (!isPop.current) {
        window.history.pushState({ view: 'cart' }, '');
      }
    } else if (!open && cartOpen) {
      // Closing cart programmatically (X button, checkout click etc.)
      // Don't navigate — just update state. The history entry will be
      // cleaned up naturally if the user presses back from the next page.
    }
    setCartOpenState(open);
  };

  const addItem = (item) => {
    setItems(prev => {
      const key = `${item.product_id}-${item.variant_id || 'default'}`;
      const existing = prev.find(i => `${i.product_id}-${i.variant_id || 'default'}` === key);
      if (existing) {
        return prev.map(i => `${i.product_id}-${i.variant_id || 'default'}` === key
          ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i);
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeItem = (productId, variantId) => {
    const key = `${productId}-${variantId || 'default'}`;
    setItems(prev => prev.filter(i => `${i.product_id}-${i.variant_id || 'default'}` !== key));
  };

  const updateQty = (productId, variantId, qty) => {
    const key = `${productId}-${variantId || 'default'}`;
    if (qty < 1) { removeItem(productId, variantId); return; }
    setItems(prev => prev.map(i =>
      `${i.product_id}-${i.variant_id || 'default'}` === key ? { ...i, quantity: qty } : i
    ));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, cartOpen, setCartOpen, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
