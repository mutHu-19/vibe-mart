import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';
import RichTextEditor, { RichTextDisplay } from '../../components/RichTextEditor';

export default function CheckoutSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ process_info: '', cod_info: '', bank_info: '' });

  useEffect(() => {
    api.get('/checkout-content').then(r => {
      if (r.data) {
        setForm({
          process_info: r.data.process_info || '',
          cod_info: r.data.cod_info || '',
          bank_info: r.data.bank_info || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/checkout-content', form);
      showToast('Checkout content saved ✅', 'success');
    } catch (err) { showToast(err.response?.data?.error || 'Error saving', 'error'); }
    setSaving(false);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>🛒 Checkout Content</h2>
        <p style={{ color: '#888', fontSize: 12 }}>
          Extra info shown to customers on the checkout page — how the order process works,
          and instructions for each payment method. The rest of the checkout page (delivery
          details, order summary, etc.) stays exactly as it is.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Left — Edit forms */}
          <div>
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div className="admin-card-hdr"><h3>📝 How the Process Works</h3></div>
              <div style={{ padding: '16px 18px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Process description</label>
                  <RichTextEditor
                    value={form.process_info}
                    onChange={html => setForm(f => ({ ...f, process_info: html }))}
                    placeholder="e.g. 1. Place your order  2. We confirm on WhatsApp  3. We deliver in 2-3 days…"
                  />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    Shown near the top of the checkout page, above the delivery details form. Leave empty to hide this section.
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div className="admin-card-hdr"><h3>💵 Cash on Delivery — Instructions</h3></div>
              <div style={{ padding: '16px 18px' }}>
                <div className="admin-form-group">
                  <RichTextEditor
                    value={form.cod_info}
                    onChange={html => setForm(f => ({ ...f, cod_info: html }))}
                    placeholder="e.g. Please have the exact amount ready for our delivery rider."
                  />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    Shown when the customer selects "Cash on Delivery". Leave empty to hide.
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-hdr"><h3>🏦 Bank Deposit — Instructions</h3></div>
              <div style={{ padding: '16px 18px' }}>
                <div className="admin-form-group">
                  <RichTextEditor
                    value={form.bank_info}
                    onChange={html => setForm(f => ({ ...f, bank_info: html }))}
                    placeholder="e.g. Account Name: ShopLK  Account No: 1234567890  Bank: Sampath Bank, Negombo"
                  />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    Shown when the customer selects "Bank Deposit" — use this for your account details. Leave empty to hide.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Live preview */}
          <div>
            <div style={{ position: 'sticky', top: 70 }}>
              <div className="admin-card" style={{ marginBottom: 14 }}>
                <div className="admin-card-hdr"><h3>👁️ Preview — Process Info</h3></div>
                <div style={{ padding: '16px 18px', background: '#f9fafb' }}>
                  {form.process_info
                    ? <RichTextDisplay html={form.process_info} />
                    : <p style={{ color: '#aaa', fontSize: 13 }}>Nothing to show — section will be hidden.</p>}
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 14 }}>
                <div className="admin-card-hdr"><h3>👁️ Preview — Cash on Delivery</h3></div>
                <div style={{ padding: '16px 18px', background: '#f9fafb' }}>
                  {form.cod_info
                    ? <RichTextDisplay html={form.cod_info} />
                    : <p style={{ color: '#aaa', fontSize: 13 }}>Nothing to show — hidden on checkout.</p>}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-hdr"><h3>👁️ Preview — Bank Deposit</h3></div>
                <div style={{ padding: '16px 18px', background: '#f9fafb' }}>
                  {form.bank_info
                    ? <RichTextDisplay html={form.bank_info} />
                    : <p style={{ color: '#aaa', fontSize: 13 }}>Nothing to show — hidden on checkout.</p>}
                </div>
              </div>

              <button type="submit" disabled={saving}
                style={{ width: '100%', marginTop: 12, background: '#0288d1', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Rubik, sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? '⏳ Saving…' : '💾 Save Checkout Content'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}