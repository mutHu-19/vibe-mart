import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function ShopPopup() {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/popup').then(r => {
      if (!r.data) return;
      const p = r.data;

      // Check "show once per session"
      if (p.show_once) {
        const key = `shoplk_popup_seen_${p.id}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      }

      setPopup(p);

      // Show after delay
      const delay = (p.delay_seconds || 2) * 1000;
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }).catch(() => {});
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  const handleButtonClick = () => {
    if (popup?.button_url) {
      window.open(popup.button_url, '_blank');
    }
    handleClose();
  };

  if (!popup || dismissed) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9000,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />

      {/* Popup box */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: visible ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.85)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 9001,
        width: '92%',
        maxWidth: 460,
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        pointerEvents: visible ? 'auto' : 'none',
      }}>
        {/* Coloured header */}
        <div style={{
          background: popup.bg_color || '#0288d1',
          padding: '24px 20px 20px',
          position: 'relative',
          textAlign: 'center',
        }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 10, right: 12,
              background: 'rgba(255,255,255,0.2)',
              border: 'none', color: popup.text_color || '#fff',
              width: 28, height: 28, borderRadius: '50%',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, lineHeight: 1,
            }}>
            ×
          </button>

          {popup.title && (
            <div style={{
              color: popup.text_color || '#fff',
              fontSize: 20,
              fontWeight: 900,
              fontFamily: 'Rubik, sans-serif',
              lineHeight: 1.3,
              paddingRight: 24,
            }}>
              {popup.title}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px', textAlign: 'center' }}>
          <p style={{
            fontSize: 14, color: '#444',
            lineHeight: 1.7, marginBottom: 20,
            whiteSpace: 'pre-wrap',
          }}>
            {popup.message}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {/* Main action button */}
            <button
              onClick={handleButtonClick}
              style={{
                background: popup.bg_color || '#0288d1',
                color: popup.text_color || '#fff',
                border: 'none',
                padding: '11px 28px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'Rubik, sans-serif',
                transition: 'all 0.2s',
                boxShadow: `0 4px 12px ${popup.bg_color || '#0288d1'}44`,
              }}
              onMouseEnter={e => { e.target.style.opacity = '0.85'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'none'; }}
            >
              {popup.button_text || 'OK, Got it!'}
            </button>

            {/* Dismiss */}
            <button
              onClick={handleClose}
              style={{
                background: '#f5f5f5',
                color: '#888',
                border: 'none',
                padding: '11px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = '#e8e8e8'}
              onMouseLeave={e => e.target.style.background = '#f5f5f5'}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
