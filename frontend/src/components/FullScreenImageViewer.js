import React, { useState, useEffect, useCallback } from 'react';

/**
 * FullScreenImageViewer
 * Props:
 *   images: string[] — array of image URLs
 *   startIndex: number — which image to open on
 *   onClose: () => void
 */
export default function FullScreenImageViewer({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [dragStart, setDragStart] = useState(null);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % images.length);
    setScale(1);
  }, [images.length]);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + images.length) % images.length);
    setScale(1);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [next, prev, onClose]);

  // Touch swipe support
  const handleTouchStart = (e) => setDragStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (dragStart === null) return;
    const diff = dragStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
    }
    setDragStart(null);
  };

  const toggleZoom = () => setScale(s => s === 1 ? 2 : 1);

  if (!images?.length) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fsv-fade 0.2s ease',
      }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, fontWeight: 300,
        }}
      >
        ×
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700,
          background: 'rgba(255,255,255,0.1)', padding: '4px 14px', borderRadius: 20,
        }}>
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            color: '#fff', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt=""
        onClick={e => { e.stopPropagation(); toggleZoom(); }}
        style={{
          maxWidth: '92vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          transform: `scale(${scale})`,
          transition: 'transform 0.25s ease',
          cursor: scale === 1 ? 'zoom-in' : 'zoom-out',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            color: '#fff', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ›
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 8, maxWidth: '90vw', overflowX: 'auto', padding: '4px',
          }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              onClick={() => { setIndex(i); setScale(1); }}
              style={{
                width: 48, height: 48, objectFit: 'cover', borderRadius: 6,
                cursor: 'pointer', flexShrink: 0,
                border: i === index ? '2px solid #fff' : '2px solid transparent',
                opacity: i === index ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fsv-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
