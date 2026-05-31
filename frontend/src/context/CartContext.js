import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shoplk_cart_v3') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('shoplk_cart_v3', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    // item: { product_id, slug, name, image, price, variant_id, colour, size, quantity }
    const key = `${item.product_id}-${item.variant_id || 'default'}-${item.colour || ''}-${item.size || ''}`;
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i);
      }
      return [...prev, { ...item, key, quantity: item.quantity || 1 }];
    });
    setCartOpen(true);
  };

  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  const updateQty = (index, qty) => {
    if (qty < 1) return removeItem(index);
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, cartOpen, setCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
