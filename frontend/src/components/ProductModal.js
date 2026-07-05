import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { showToast } from './Toast';
import { RichTextDisplay } from './RichTextEditor';

// Full-screen image viewer inline
function FullScreenViewer({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex(i => (i+1) % images.length);
      if (e.key === 'ArrowLeft')  setIndex(i => (i-1+images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [images.length, onClose]);

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.96)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <button onClick={onClose} style={{ position:'absolute',top:16,right:16,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:22,cursor:'pointer' }}>×</button>
      {images.length > 1 && (
        <div style={{ position:'absolute',top:20,left:'50%',transform:'translateX(-50%)',color:'rgba(255,255,255,0.7)',fontSize:13,background:'rgba(255,255,255,0.1)',padding:'3px 14px',borderRadius:20 }}>
          {index+1} / {images.length}
        </div>
      )}
      {images.length > 1 && (
        <>
          <button onClick={e=>{e.stopPropagation();setIndex(i=>(i-1+images.length)%images.length);setScale(1);}}
            style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:26,cursor:'pointer' }}>‹</button>
          <button onClick={e=>{e.stopPropagation();setIndex(i=>(i+1)%images.length);setScale(1);}}
            style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:26,cursor:'pointer' }}>›</button>
        </>
      )}
      <img src={images[index]} alt="" onClick={e=>{e.stopPropagation();setScale(s=>s===1?2:1);}}
        style={{ maxWidth:'92vw',maxHeight:'88vh',objectFit:'contain',transform:`scale(${scale})`,transition:'transform 0.25s',cursor:scale===1?'zoom-in':'zoom-out',userSelect:'none' }}
        draggable={false} />
      {images.length > 1 && (
        <div onClick={e=>e.stopPropagation()} style={{ position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6,padding:'4px' }}>
          {images.map((img,i)=>(
            <img key={i} src={img} alt="" onClick={()=>{setIndex(i);setScale(1);}}
              style={{ width:46,height:46,objectFit:'cover',borderRadius:6,cursor:'pointer',
                border:i===index?'2px solid #fff':'2px solid transparent',opacity:i===index?1:0.45,transition:'all 0.15s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductModal({ slug, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [fading, setFading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(r => {
      setProduct(r.data);
      setLoading(false);
      const v = r.data.variants || [];
      const fc = v.find(x=>x.colour); const fs = v.find(x=>x.size);
      if (fc) setSelectedColour(fc.colour);
      if (fs) setSelectedSize(fs.size);
    }).catch(() => { setLoading(false); onClose(); });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [slug, onClose]);

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300 }}>
        <div className="spinner" />
      </div>
    </div>
  );
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const variants = product.variants || [];
  const colours = [...new Map(variants.filter(v=>v.colour).map(v=>[v.colour,v])).values()];
  const sizes = [...new Set(variants.filter(v=>v.size).map(v=>v.size))];

  const currentVariant = variants.find(v =>
    (!selectedColour || v.colour===selectedColour) && (!selectedSize || v.size===selectedSize)
  ) || variants[0];

  const colourVariant = colours.find(v=>v.colour===selectedColour);
  const variantImg = colourVariant?.image_url || null;
  const allImages = variantImg ? [variantImg,...images.filter(u=>u!==variantImg)] : images;
  const displayImg = allImages[activeImg] || allImages[0] || null;

  const stockQty = currentVariant?.stock_qty ?? 999;
  const extraPrice = parseFloat(currentVariant?.extra_price||0);
  const finalPrice = parseFloat(product.price) + extraPrice;
  const discount = product.compare_price && product.compare_price > finalPrice
    ? Math.round((1-finalPrice/product.compare_price)*100) : null;

  const handleColour = (colour) => {
    setFading(true);
    setTimeout(() => { setSelectedColour(colour); setActiveImg(0); setFading(false); }, 150);
  };

  const handleAddCart = () => {
    if (stockQty === 0) { showToast('Out of stock','error'); return; }
    addItem({ product_id:product.id, slug:product.slug, name:product.name,
      image:variantImg||images[0]||null, price:finalPrice,
      variant_id:currentVariant?.id||null, colour:selectedColour, size:selectedSize, quantity:qty });
    showToast('Added to cart! 🛒','success');
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-drag-bar" />
          <button className="modal-close" onClick={onClose}>×</button>

          {/* Main image — click opens full screen */}
          <div style={{ position:'relative', background:'#f9f9f9' }}>
            {displayImg ? (
              <img className="modal-main-img" src={displayImg} alt={product.name}
                onClick={()=>setFullScreen(true)}
                style={{ opacity:fading?0:1, transition:'opacity 0.15s', cursor:'zoom-in' }} />
            ) : (
              <div className="modal-main-img" style={{ display:'flex',alignItems:'center',justifyContent:'center',fontSize:64 }}>📦</div>
            )}
            {displayImg && (
              <div onClick={()=>setFullScreen(true)}
                style={{ position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.45)',borderRadius:'50%',width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:16 }}>
                🔍
              </div>
            )}
            {selectedColour && variantImg && (
              <div style={{ position:'absolute',bottom:8,left:8,background:'rgba(0,0,0,0.55)',color:'#fff',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700 }}>
                {selectedColour}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="modal-thumb-strip">
              {allImages.map((img,i)=>(
                <img key={i} className={`modal-thumb ${i===activeImg?'active':''}`} src={img} alt=""
                  onClick={()=>setActiveImg(i)}
                  style={{ border:`2px solid ${i===activeImg?'#0288d1':'transparent'}` }} />
              ))}
            </div>
          )}

          <div className="modal-body">
            <div className="modal-title">{product.name}</div>
            <div className="modal-price-row">
              <span className="modal-price-main">Rs. {finalPrice.toLocaleString()}</span>
              {product.compare_price && <span className="modal-price-orig">Rs. {parseFloat(product.compare_price).toLocaleString()}</span>}
              {discount && <span className="modal-discount">-{discount}%</span>}
            </div>

            {colours.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div className="modal-section-title">Colour: <strong style={{color:'#1b1b1b'}}>{selectedColour||'Select'}</strong></div>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:6 }}>
                  {colours.map(v=>{
                    const sel = selectedColour===v.colour;
                    return (
                      <div key={v.colour} onClick={()=>handleColour(v.colour)} title={v.colour}
                        style={{ cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                        {v.image_url ? (
                          <div style={{ width:52,height:52,borderRadius:6,overflow:'hidden',border:`2.5px solid ${sel?'#0288d1':'#e8e8e8'}`,transition:'all 0.15s',transform:sel?'scale(1.08)':'scale(1)' }}>
                            <img src={v.image_url} alt={v.colour} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width:32,height:32,borderRadius:'50%',background:v.colour_hex||'#ccc',border:`2.5px solid ${sel?'#0288d1':'transparent'}`,outline:`2px solid ${sel?'#0288d1':'#e8e8e8'}`,transition:'all 0.15s',transform:sel?'scale(1.15)':'scale(1)' }} />
                        )}
                        <span style={{ fontSize:10,fontWeight:700,color:sel?'#0288d1':'#888',maxWidth:56,textAlign:'center',lineHeight:1.2 }}>{v.colour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div className="modal-section-title">Size: <strong>{selectedSize||'Select'}</strong></div>
                <div className="size-btns">
                  {sizes.map(s=>(
                    <button key={s} className={`size-btn ${selectedSize===s?'selected':''}`} onClick={()=>setSelectedSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="qty-row">
              <div className="modal-section-title" style={{ marginBottom:0 }}>Qty:</div>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={()=>setQty(q=>Math.min(stockQty,q+1))}>+</button>
              </div>
              <div className="stock-info">
                {stockQty===0?'❌ Out of stock':stockQty<5?`⚠️ Only ${stockQty} left`:'✅ In stock'}
              </div>
            </div>

            <button className="add-cart-btn" onClick={handleAddCart} disabled={stockQty===0}>🛒 Add to Cart</button>
            <button className="buy-now-btn" onClick={handleAddCart} disabled={stockQty===0}>⚡ Buy Now</button>

            {/* ── Rich text description ── */}
            {product.description && (
              <div className="product-desc">
                <div style={{ fontWeight:700,marginBottom:8,fontSize:12,textTransform:'uppercase',letterSpacing:0.5,color:'#888' }}>Description</div>
                <RichTextDisplay html={product.description} />
              </div>
            )}

            <div style={{ display:'flex',gap:8,marginTop:16,flexWrap:'wrap' }}>
              {['🚚 Free Delivery','🔄 Easy Returns','🔒 Secure Payment','⭐ Genuine Products'].map(b=>(
                <span key={b} style={{ fontSize:11,color:'#555',background:'#f5f5f5',padding:'4px 10px',borderRadius:2,fontWeight:600 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full screen viewer */}
      {fullScreen && allImages.length > 0 && (
        <FullScreenViewer images={allImages} startIndex={activeImg} onClose={()=>setFullScreen(false)} />
      )}
    </>
  );
}
