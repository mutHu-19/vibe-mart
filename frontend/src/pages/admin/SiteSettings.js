import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUploader from '../../components/ImageUploader';

function BannerSlidesManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState('');

  const load = () => {
    api.get('/banner-slides/admin').then(r => { setSlides(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const addSlide = async () => {
    if (!newImage) { showToast('Upload an image first', 'error'); return; }
    try {
      await api.post('/banner-slides', { image_url: newImage, link_url: newLink, sort_order: slides.length });
      showToast('Slide added ✅', 'success');
      setNewImage(''); setNewLink(''); setAdding(false);
      load();
    } catch (err) { showToast(err.response?.data?.error || 'Error adding slide', 'error'); }
  };

  const removeSlide = async (id) => {
    if (!window.confirm('Remove this slide?')) return;
    await api.delete(`/banner-slides/${id}`);
    load();
  };

  const toggleActive = async (s) => {
    await api.put(`/banner-slides/${s.id}`, { ...s, is_active: s.is_active ? 0 : 1 });
    load();
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index], b = slides[target];
    await Promise.all([
      api.put(`/banner-slides/${a.id}`, { ...a, sort_order: b.sort_order }),
      api.put(`/banner-slides/${b.id}`, { ...b, sort_order: a.sort_order }),
    ]);
    load();
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div className="admin-card" style={{ marginBottom: 14 }}>
      <div className="admin-card-hdr"><h3>🖼️ Homepage Slideshow ({slides.length}/5)</h3></div>
      <div style={{ padding: '16px 18px' }}>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          The rotating banner shown at the top of the homepage. Add 2–5 photos; each can optionally link somewhere when clicked.
        </p>

        {slides.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <img src={s.image_url} alt="" style={{ width: 70, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', opacity: s.is_active ? 1 : 0.4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: s.is_active ? '#333' : '#bbb', fontWeight: 700 }}>{s.is_active ? 'Active' : 'Hidden'}</div>
              <div style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.link_url || 'No link'}</div>
            </div>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              style={{ width: 26, height: 26, border: '1px solid #e8e8e8', background: '#fff', borderRadius: 4, cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1}
              style={{ width: 26, height: 26, border: '1px solid #e8e8e8', background: '#fff', borderRadius: 4, cursor: i === slides.length - 1 ? 'default' : 'pointer', opacity: i === slides.length - 1 ? 0.3 : 1 }}>↓</button>
            <button type="button" onClick={() => toggleActive(s)}
              style={{ padding: '5px 10px', border: '1px solid #e8e8e8', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              {s.is_active ? 'Hide' : 'Show'}
            </button>
            <button type="button" onClick={() => removeSlide(s.id)}
              style={{ width: 26, height: 26, border: 'none', background: '#ffece6', color: '#c62200', borderRadius: 4, cursor: 'pointer', fontWeight: 900 }}>×</button>
          </div>
        ))}

        {slides.length === 0 && <p style={{ color: '#aaa', fontSize: 13, padding: '10px 0' }}>No slides yet — add your first one below.</p>}

        {slides.length < 5 && (
          adding ? (
            <div style={{ marginTop: 14, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #eee' }}>
              <div className="admin-form-group">
                <label className="admin-label">Slide Image</label>
                <ImageUploader images={newImage ? [newImage] : []} onChange={urls => setNewImage(urls[0] || '')} max={1} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Link (optional)</label>
                <input className="admin-input" value={newLink} onChange={e => setNewLink(e.target.value)}
                  placeholder="e.g. a category or product URL" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={addSlide}
                  style={{ background: '#0288d1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                  Add Slide
                </button>
                <button type="button" onClick={() => { setAdding(false); setNewImage(''); setNewLink(''); }}
                  style={{ background: '#f5f5f5', color: '#888', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)}
              style={{ marginTop: 12, width: '100%', border: '1.5px dashed #d0d0d0', background: '#fafafa', color: '#888', padding: '10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              + Add Slide
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function SiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logo_url: '', shop_hours: '', delivery_policy: '', pricing_policy: '', preorder_policy: '',
    facebook_url: '', tiktok_url: '', whatsapp_number: '', featured_active: 1, hotdeals_active: 1,
  });

  useEffect(() => {
    api.get('/site-settings').then(r => {
      if (r.data) setForm(f => ({ ...f, ...r.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/site-settings', form);
      showToast('Site settings saved ✅', 'success');
    } catch (err) { showToast(err.response?.data?.error || 'Error saving', 'error'); }
    setSaving(false);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>🎨 Website Design</h2>
        <p style={{ color: '#888', fontSize: 12 }}>Logo, homepage slideshow, sections, footer policies and social links.</p>
      </div>

      <BannerSlidesManager />

      <form onSubmit={handleSave}>
        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>🏷️ Logo</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <ImageUploader images={form.logo_url ? [form.logo_url] : []} onChange={urls => setForm(f => ({ ...f, logo_url: urls[0] || '' }))} max={1} />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Shown top-left of the site. Leave empty to use the text logo.</div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>🎛️ Homepage Sections</h3></div>
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="admin-label">⭐ Featured Products</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[{ val: 1, label: 'Show' }, { val: 0, label: 'Hide' }].map(opt => (
                  <button key={opt.val} type="button" onClick={() => setForm(f => ({ ...f, featured_active: opt.val }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 4, border: `1.5px solid ${form.featured_active === opt.val ? '#0288d1' : '#e8e8e8'}`, background: form.featured_active === opt.val ? '#e0f0ff' : '#fff', color: form.featured_active === opt.val ? '#0277bd' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Pick which products show up in Products → "⭐ Featured".</div>
            </div>
            <div>
              <label className="admin-label">🔥 Hot Deals</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[{ val: 1, label: 'Show' }, { val: 0, label: 'Hide' }].map(opt => (
                  <button key={opt.val} type="button" onClick={() => setForm(f => ({ ...f, hotdeals_active: opt.val }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 4, border: `1.5px solid ${form.hotdeals_active === opt.val ? '#e62e04' : '#e8e8e8'}`, background: form.hotdeals_active === opt.val ? '#ffece6' : '#fff', color: form.hotdeals_active === opt.val ? '#c62200' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Pick which products show up in Products → "🔥 Hot Deal".</div>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>🕒 Shop Hours & Social Links</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <div className="admin-form-group">
              <label className="admin-label">Shop Open Hours</label>
              <input className="admin-input" value={form.shop_hours} onChange={e => setForm(f => ({ ...f, shop_hours: e.target.value }))}
                placeholder="e.g. Mon – Sat: 9.00 AM – 8.00 PM" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="admin-form-group">
                <label className="admin-label">📘 Facebook URL</label>
                <input className="admin-input" value={form.facebook_url} onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="https://facebook.com/…" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">🎵 TikTok URL</label>
                <input className="admin-input" value={form.tiktok_url} onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@…" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">💬 WhatsApp Number</label>
                <input className="admin-input" value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="94766522855" />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>🚚 Delivery Policy</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <RichTextEditor value={form.delivery_policy} onChange={html => setForm(f => ({ ...f, delivery_policy: html }))}
              placeholder="e.g. Islandwide delivery in 2-3 working days. Free delivery over Rs. 5000." />
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>💰 Pricing Policy</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <RichTextEditor value={form.pricing_policy} onChange={html => setForm(f => ({ ...f, pricing_policy: html }))}
              placeholder="e.g. All prices are inclusive of tax. Prices may change without prior notice." />
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 14 }}>
          <div className="admin-card-hdr"><h3>📦 Pre-Order Policy</h3></div>
          <div style={{ padding: '16px 18px' }}>
            <RichTextEditor value={form.preorder_policy} onChange={html => setForm(f => ({ ...f, preorder_policy: html }))}
              placeholder="e.g. Pre-order items require 50% advance payment. Delivery in 2-4 weeks." />
          </div>
        </div>

        <button type="submit" disabled={saving}
          style={{ width: '100%', background: '#0288d1', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Rubik, sans-serif', opacity: saving ? 0.7 : 1 }}>
          {saving ? '⏳ Saving…' : '💾 Save Website Settings'}
        </button>
      </form>
    </>
  );
}
