import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function FloatingButtons() {
  const [settings, setSettings] = useState({
    whatsapp_number: '94766522855',
    facebook_url: '',
  });

  useEffect(() => {
    // Pull from bill settings (shop_name, whatsapp etc already stored there)
    api.get('/popup').catch(() => {}); // warm connection, ignore
    const stored = JSON.parse(localStorage.getItem('shoplk_bill_settings') || '{}');
    setSettings(s => ({
      whatsapp_number: stored.whatsapp_number || process.env.REACT_APP_WHATSAPP || '94766522855',
      facebook_url: stored.facebook_url || '',
    }));
  }, []);

  const waUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('Hi! I have a question about your products.')}`;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 16,
      zIndex: 800,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: 'flex-end',
    }}>
      {/* Facebook button — only show if URL is set */}
      {settings.facebook_url && (
        <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#1877F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(24,119,242,0.5)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </div>
        </a>
      )}

      {/* WhatsApp button — always visible */}
      <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <div
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,211,102,0.55)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Pulse ring animation */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: '#25D366',
            animation: 'wa-pulse 2s infinite',
          }} />
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.099 1.501 5.823L0 24l6.335-1.493C8.027 23.48 9.987 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.637-.504-5.143-1.381l-.369-.219-3.759.886.927-3.651-.24-.382C2.537 15.64 2 13.876 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>
      </a>

      <style>{`
        @keyframes wa-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
