import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { invoice_no, total, name } = location.state || {};

  useEffect(() => {
    // Replace history state so back from here goes to home, not checkout
    window.history.replaceState({ view: 'order-success' }, '');

    // On back press from this page, go home
    const handlePop = () => { navigate('/'); };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [navigate]);

  return (
    <div className="success-page">
      <div className="success-icon">🎉</div>
      <h1 className="success-title">Order Placed!</h1>
      <p className="success-sub">
        {name ? `Thank you, ${name}!` : 'Thank you!'} Your order has been received and we'll be in touch via WhatsApp shortly.
      </p>

      {invoice_no && (
        <div className="success-invoice-box">
          <div className="success-invoice-row">
            <span>Order Number</span>
            <strong style={{ color: '#0288d1' }}>{invoice_no}</strong>
          </div>
          {total && (
            <div className="success-invoice-row">
              <span>Total Amount</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
          )}
          <div className="success-invoice-row total">
            <span>Status</span>
            <span>⏳ Pending Confirmation</span>
          </div>
        </div>
      )}

      <button className="wa-btn" onClick={() => {
        const wa = process.env.REACT_APP_WHATSAPP || '94766522855';
        window.open(`https://wa.me/${wa}`, '_blank');
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.099 1.501 5.823L0 24l6.335-1.493C8.027 23.48 9.987 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.637-.504-5.143-1.381l-.369-.219-3.759.886.927-3.651-.24-.382C2.537 15.64 2 13.876 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        💬 Message Us on WhatsApp
      </button>

      <button className="back-btn" onClick={() => navigate('/')}>
        ← Continue Shopping
      </button>
    </div>
  );
}
