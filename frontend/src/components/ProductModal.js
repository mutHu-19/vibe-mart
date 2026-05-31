import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { showToast } from './Toast';

export default function ProductModal({ slug, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(r => {
      setProduct(r.data);
      setLoading(false);
      // Auto-select first available variant colour/size
      const variants = r.data.variants || [];
      const colours = [...new Set(variants.filter(v => v.colour).map(v => v.colour))];
      const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
      if (colours.length) setSelectedColour(colours[0]);
      if (sizes.length) setSelectedSize(sizes[0]);
    }).catch(() => { setLoading(false); onClose(); });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [slug, onClose]);

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="spinner" />
      </div>
    </div>
  );
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const variants = product.variants || [];
  const colours = [...new Map(variants.filter(v => v.colour).map(v => [v.colour, v])).values()];
  const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];

  // Find matching variant for stock
  const matchVariant = () => {
    if (!variants.length) return null;
    return variants.find(v => {
      const colMatch = !selectedColour || v.colour === selectedColour;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      return colMatch && sizeMatch && v.is_active !== 0;
    }) || variants[0];
  };

  const currentVariant = matchVariant();
  const stockQty = currentVariant?.stock_qty ?? 999;
  const extraPrice = parseFloat(currentVariant?.extra_price || 0);
  const finalPrice = parseFloat(product.price) + extraPrice;
  const discount = product.compare_price && product.compare_price > finalPrice
    ? Math.round((1 - finalPrice / product.compare_price) * 100) : null;

  const handleAddCart = () => {
    if (stockQty === 0) { showToast('Out of stock', 'error'); return; }
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: images[0] || null,
      price: finalPrice,
      variant_id: currentVariant?.id || null,
      colour: selectedColour,
      size: selectedSize,
      quantity: qty,
    });
    showToast('Added to cart! 🛒', 'success');
    onClose();
  };

  const handleBuyNow = () => {
    handleAddCart();
    // navigate to checkout - handled via cart
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-drag-bar" />
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Images */}
        <div className="modal-imgs">
          {images.length > 0
            ? <img className="modal-main-img" src={images[activeImg] || images[0]} alt={product.name} />
            : <div className="modal-main-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
          }
        </div>
        {images.length > 1 && (
          <div className="modal-thumb-strip">
            {images.map((img, i) => (
              <img key={i} className={`modal-thumb ${i === activeImg ? 'active' : ''}`} src={img} alt="" onClick={() => setActiveImg(i)} />
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="modal-title">{product.name}</div>

          {/* Price */}
          <div className="modal-price-row">
            <span className="modal-price-main">Rs. {finalPrice.toLocaleString()}</span>
            {product.compare_price && (
              <span className="modal-price-orig">Rs. {parseFloat(product.compare_price).toLocaleString()}</span>
            )}
            {discount && <span className="modal-discount">-{discount}%</span>}
          </div>

          {/* Colours */}
          {colours.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="modal-section-title">Colour: <strong>{selectedColour || 'Select'}</strong></div>
              <div className="colour-swatches">
                {colours.map(v => (
                  <div
                    key={v.colour}
                    className={`colour-swatch ${selectedColour === v.colour ? 'selected' : ''}`}
                    style={{ background: v.colour_hex || '#ccc' }}
                    onClick={() => setSelectedColour(v.colour)}
                    title={v.colour}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="modal-section-title">Size: <strong>{selectedSize || 'Select'}</strong></div>
              <div className="size-btns">
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${selectedSize === s ? 'selected' : ''}`} onClick={() => setSelectedSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="qty-row">
            <div className="modal-section-title" style={{ marginBottom: 0 }}>Quantity:</div>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(stockQty, q + 1))}>+</button>
            </div>
            <div className="stock-info">
              {stockQty === 0 ? '❌ Out of stock' : stockQty < 5 ? `⚠️ Only ${stockQty} left` : `✅ In stock`}
            </div>
          </div>

          {/* CTA */}
          <button className="add-cart-btn" onClick={handleAddCart} disabled={stockQty === 0}>
            🛒 Add to Cart
          </button>
          <button className="buy-now-btn" onClick={handleBuyNow} disabled={stockQty === 0}>
            ⚡ Buy Now
          </button>

          {/* Description */}
          {product.description && (
            <div className="product-desc">
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</div>
              {product.description}
            </div>
          )}

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {[ '🔄 Easy Returns', '⭐ Verified Products'].map(b => (
              <span key={b} style={{ fontSize: 11, color: '#555', background: '#f5f5f5', padding: '4px 10px', borderRadius: 2, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
