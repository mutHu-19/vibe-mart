import React, { useState, useEffect, useRef } from 'react';
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
  const [imgTransition, setImgTransition] = useState(false);
  const { addItem } = useCart();
  const imgRef = useRef();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(r => {
      setProduct(r.data);
      setLoading(false);
      const variants = r.data.variants || [];
      const firstColour = variants.find(v => v.colour);
      const firstSize = variants.find(v => v.size);
      if (firstColour) setSelectedColour(firstColour.colour);
      if (firstSize) setSelectedSize(firstSize.size);
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

  const productImages = Array.isArray(product.images) ? product.images : [];
  const variants = product.variants || [];
  // Unique colours (with their variant data)
  const colours = [...new Map(variants.filter(v => v.colour).map(v => [v.colour, v])).values()];
  // Unique sizes
  const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];

  // Find current variant
  const currentVariant = variants.find(v => {
    const colMatch = !selectedColour || v.colour === selectedColour;
    const sizeMatch = !selectedSize || v.size === selectedSize;
    return colMatch && sizeMatch;
  }) || variants[0];

  // ── Key logic: determine which image to show ──
  // If selected colour has its own image_url → use it as main image
  // Otherwise fall back to product images array
  const colourVariant = colours.find(v => v.colour === selectedColour);
  const variantImage = colourVariant?.image_url || null;

  // Build the full image list for thumbnails:
  // variant image first (if exists), then product images
  const allImages = variantImage
    ? [variantImage, ...productImages.filter(u => u !== variantImage)]
    : productImages;

  const displayImage = allImages[activeImg] || allImages[0] || null;

  const stockQty = currentVariant?.stock_qty ?? 999;
  const extraPrice = parseFloat(currentVariant?.extra_price || 0);
  const finalPrice = parseFloat(product.price) + extraPrice;
  const discount = product.compare_price && product.compare_price > finalPrice
    ? Math.round((1 - finalPrice / product.compare_price) * 100) : null;

  // When colour changes → animate image swap
  const handleColourSelect = (colour) => {
    setImgTransition(true);
    setTimeout(() => {
      setSelectedColour(colour);
      setActiveImg(0); // reset to first (which will be the variant image)
      setImgTransition(false);
    }, 150);
  };

  const handleAddCart = () => {
    if (stockQty === 0) { showToast('Out of stock', 'error'); return; }
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: variantImage || productImages[0] || null,
      price: finalPrice,
      variant_id: currentVariant?.id || null,
      colour: selectedColour,
      size: selectedSize,
      quantity: qty,
    });
    showToast('Added to cart! 🛒', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-drag-bar" />
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Main image with fade transition on colour change */}
        <div className="modal-imgs" style={{ position: 'relative', background: '#f9f9f9' }}>
          {displayImage ? (
            <img
              ref={imgRef}
              className="modal-main-img"
              src={displayImage}
              alt={product.name}
              style={{ transition: 'opacity 0.15s ease', opacity: imgTransition ? 0 : 1 }}
            />
          ) : (
            <div className="modal-main-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
          )}
          {/* Colour label overlay */}
          {selectedColour && variantImage && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              {selectedColour}
            </div>
          )}
        </div>

        {/* Thumbnail strip — shows all images including variant images */}
        {allImages.length > 1 && (
          <div className="modal-thumb-strip">
            {allImages.map((img, i) => (
              <img key={i} className={`modal-thumb ${i === activeImg ? 'active' : ''}`}
                src={img} alt=""
                onClick={() => setActiveImg(i)}
                style={{ border: i === activeImg ? '2px solid #e62e04' : '2px solid transparent' }}
              />
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

          {/* Colours — with image preview on each swatch */}
          {colours.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="modal-section-title">
                Colour: <strong style={{ color: '#1b1b1b' }}>{selectedColour || 'Select'}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {colours.map(v => {
                  const isSelected = selectedColour === v.colour;
                  return (
                    <div key={v.colour} onClick={() => handleColourSelect(v.colour)}
                      title={v.colour}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                      {/* If variant has image — show mini image preview, else show colour circle */}
                      {v.image_url ? (
                        <div style={{
                          width: 52, height: 52, borderRadius: 6, overflow: 'hidden',
                          border: `2.5px solid ${isSelected ? '#e62e04' : '#e8e8e8'}`,
                          transition: 'all 0.15s',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: isSelected ? '0 2px 8px rgba(230,46,4,0.3)' : 'none',
                        }}>
                          <img src={v.image_url} alt={v.colour} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: v.colour_hex || '#ccc',
                          border: `2.5px solid ${isSelected ? '#e62e04' : 'transparent'}`,
                          outline: `2px solid ${isSelected ? '#e62e04' : '#e8e8e8'}`,
                          transition: 'all 0.15s',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: isSelected ? '0 2px 8px rgba(230,46,4,0.3)' : '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#e62e04' : '#888', maxWidth: 56, textAlign: 'center', lineHeight: 1.2 }}>
                        {v.colour}
                      </span>
                    </div>
                  );
                })}
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
          <button className="buy-now-btn" onClick={handleAddCart} disabled={stockQty === 0}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {[ '🔒 Secure Payment', '⭐ Verified Products'].map(b => (
              <span key={b} style={{ fontSize: 11, color: '#555', background: '#f5f5f5', padding: '4px 10px', borderRadius: 2, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
