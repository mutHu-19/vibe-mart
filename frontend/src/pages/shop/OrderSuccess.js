import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) { navigate('/'); return null; }

  const { order, form, payment, items, total, grandTotal } = state;

  const payLabel = payment === 'bank_deposit' ? '🏦 Bank Deposit' : '💵 Cash on Delivery';

  const itemLines = (items || []).map(item =>
    `• ${item.name}${item.colour ? ` | ${item.colour}` : ''}${item.size ? ` | ${item.size}` : ''} × ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}`
  ).join('%0A');

  const waMsg = encodeURIComponent(
    `━━━━━━━━━━━━━━━━━━━━\n🧾 *ORDER CONFIRMATION*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 *Invoice:* ${order?.invoice_no || 'N/A'}\n\n` +
    `👤 *Customer:* ${form?.name}\n` +
    `📞 *Phone:* ${form?.phone}\n` +
    `📍 *Address:* ${form?.address}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n🛍️ *ORDER ITEMS*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
    (items || []).map(item =>
      `• ${item.name}${item.colour ? ` | ${item.colour}` : ''}${item.size ? ` | ${item.size}` : ''} × ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━\n💰 *PAYMENT SUMMARY*\n━━━━━━━━━━━━━━━━━━━━\n` +
    `Subtotal:  Rs. ${total?.toLocaleString()}\n` +
    `Delivery:  Rs. 350\n` +
    `*TOTAL:    Rs. ${grandTotal?.toLocaleString()}*\n\n` +
    `💳 *Payment:* ${payLabel}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n✅ Thank you for shopping with ShopLK!`
  );

  const waNumber = process.env.REACT_APP_WHATSAPP || '94766522855';
  const waUrl = order?.whatsapp_url || `https://wa.me/${waNumber}?text=${waMsg}`;

  return (
    <div className="success-page">
      <div className="success-icon">🎉</div>
      <div className="success-title">Order Placed!</div>
      <div className="success-sub">
        Thank you, <strong>{form?.name}</strong>! Your order has been received.
      </div>

      <div className="success-invoice-box">
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: '#e62e04' }}>
          📋 {order?.invoice_no || 'Order Confirmed'}
        </div>
        <div className="success-invoice-row"><span>Customer</span><span>{form?.name}</span></div>
        <div className="success-invoice-row"><span>Phone</span><span>{form?.phone}</span></div>
        <div className="success-invoice-row"><span>Address</span><span style={{ textAlign: 'right', maxWidth: 180 }}>{form?.address}</span></div>
        <div className="success-invoice-row"><span>Payment</span><span>{payLabel}</span></div>
        <div className="success-invoice-row"><span>Items</span><span>{(items || []).length} item(s)</span></div>
        <div className="success-invoice-row total"><span>Total</span><span>Rs. {grandTotal?.toLocaleString()}</span></div>
      </div>

      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
        <strong>📌 Next Steps:</strong><br />
        {payment === 'bank_deposit'
          ? 'Please make your bank transfer and send us confirmation via WhatsApp.'
          : 'Our team will contact you shortly to confirm your delivery.'
        }
      </div>

      <a href={waUrl} target="_blank" rel="noopener noreferrer">
        <button className="wa-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.099 1.501 5.823L0 24l6.335-1.493C8.027 23.48 9.987 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.637-.504-5.143-1.381l-.369-.219-3.759.886.927-3.651-.24-.382C2.537 15.64 2 13.876 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Confirm Order on WhatsApp
        </button>
      </a>

      <button className="back-btn" onClick={() => navigate('/')}>
        ← Continue Shopping
      </button>
    </div>
  );
}
