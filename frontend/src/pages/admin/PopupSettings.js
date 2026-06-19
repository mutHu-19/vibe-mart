import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { showToast } from '../../components/Toast';

const PRESET_COLORS = [
  { bg: '#0288d1', text: '#ffffff', label: 'Sky Blue' },
  { bg: '#e62e04', text: '#ffffff', label: 'Red' },
  { bg: '#16a34a', text: '#ffffff', label: 'Green' },
  { bg: '#7c3aed', text: '#ffffff', label: 'Purple' },
  { bg: '#d97706', text: '#ffffff', label: 'Orange' },
  { bg: '#0d1b2a', text: '#ffffff', label: 'Dark' },
  { bg: '#ffdd00', text: '#1b1b1b', label: 'Yellow' },
  { bg: '#ec4899', text: '#ffffff', label: 'Pink' },
];

export default function PopupSettings() {
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    button_text: 'OK, Got it!',
    button_url: '',
    bg_color: '#0288d1',
    text_color: '#ffffff',
    show_once: false,
    delay_seconds: 2,
    is_active: false,
  });

  useEffect(() => {
    api.get('/popup/settings').then(r => {
      if (r.data) {
        setPopup(r.data);
        setForm({
          title: r.data.title || '',
          message: r.data.message || '',
          button_text: r.data.button_text || 'OK, Got it!',
          button_url: r.data.button_url || '',
          bg_color: r.data.bg_color || '#0288d1',
          text_color: r.data.text_color || '#ffffff',
          show_once: !!r.data.show_once,
          delay_seconds: r.data.delay_seconds || 2,
          is_active: !!r.data.is_active,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { showToast('Message is required', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/popup', form);
      showToast('Popup saved ✅', 'success');
      setPopup(prev => ({ ...prev, ...form }));
    } catch (err) { showToast(err.response?.data?.error || 'Error saving', 'error'); }
    setSaving(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const { data } = await api.patch('/popup/toggle');
      setForm(f => ({ ...f, is_active: !!data.is_active }));
      setPopup(p => ({ ...p, is_active: data.is_active }));
      showToast(data.is_active ? '✅ Popup is now LIVE on the website!' : '⏸️ Popup disabled', data.is_active ? 'success' : '');
    } catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    setToggling(false);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>🔔 Website Popup</h2>
          <p style={{ color: '#888', fontSize: 12 }}>Show a popup message to customers when they visit the website</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPreview(true)} className="btn btn-outline">👁️ Preview</button>
          <button onClick={handleToggle} disabled={toggling}
            style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: toggling ? 'not-allowed' : 'pointer', border: 'none', background: form.is_active ? '#16a34a' : '#888', color: '#fff', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {toggling ? '⏳' : form.is_active ? '🟢 Active — Click to Disable' : '⚫ Inactive — Click to Enable'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ background: form.is_active ? '#dcfce7' : '#f5f5f5', border: `1.5px solid ${form.is_active ? '#86efac' : '#e8e8e8'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 20 }}>{form.is_active ? '🟢' : '⚫'}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: form.is_active ? '#15803d' : '#888' }}>
            {form.is_active ? 'Popup is LIVE on your website' : 'Popup is currently disabled'}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {form.is_active
              ? `Appears after ${form.delay_seconds}s · ${form.show_once ? 'Once per session' : 'Every visit'}`
              : 'Enable the popup to show it to customers'
            }
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

          {/* Left — Edit form */}
          <div>
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div className="admin-card-hdr"><h3>📝 Content</h3></div>
              <div style={{ padding: '16px 18px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Title <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input className="admin-input" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. 🎉 Special Offer!" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Message *</label>
                  <textarea className="admin-input" value={form.message} rows={4}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Write your popup message here…"
                    style={{ resize: 'vertical' }} required />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>You can use line breaks for formatting</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Button Text</label>
                    <input className="admin-input" value={form.button_text}
                      onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))}
                      placeholder="OK, Got it!" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Button URL <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                    <input className="admin-input" value={form.button_url}
                      onChange={e => setForm(f => ({ ...f, button_url: e.target.value }))}
                      placeholder="https://… (opens on click)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div className="admin-card-hdr"><h3>🎨 Appearance</h3></div>
              <div style={{ padding: '16px 18px' }}>
                {/* Color presets */}
                <div className="admin-form-group">
                  <label className="admin-label">Quick Color Presets</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <div key={c.label} onClick={() => setForm(f => ({ ...f, bg_color: c.bg, text_color: c.text }))}
                        title={c.label}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: c.bg, cursor: 'pointer',
                          border: `3px solid ${form.bg_color === c.bg ? '#1b1b1b' : 'transparent'}`,
                          transition: 'all 0.15s',
                          transform: form.bg_color === c.bg ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: `0 2px 8px ${c.bg}55`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {form.bg_color === c.bg && <span style={{ fontSize: 14 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom colors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Background Color</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={form.bg_color}
                        onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                        style={{ width: 44, height: 36, padding: 2, border: '1.5px solid #e8e8e8', borderRadius: 6, cursor: 'pointer' }} />
                      <input className="admin-input" value={form.bg_color}
                        onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                        style={{ fontFamily: 'monospace', fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Text Color</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={form.text_color}
                        onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))}
                        style={{ width: 44, height: 36, padding: 2, border: '1.5px solid #e8e8e8', borderRadius: 6, cursor: 'pointer' }} />
                      <input className="admin-input" value={form.text_color}
                        onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))}
                        style={{ fontFamily: 'monospace', fontSize: 12 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-hdr"><h3>⚙️ Behaviour</h3></div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Delay (seconds)</label>
                    <input className="admin-input" type="number" min={0} max={30} value={form.delay_seconds}
                      onChange={e => setForm(f => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Seconds after page load before popup appears</div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Show Frequency</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {[{ val: false, label: 'Every Visit' }, { val: true, label: 'Once per Session' }].map(opt => (
                        <button key={String(opt.val)} type="button"
                          onClick={() => setForm(f => ({ ...f, show_once: opt.val }))}
                          style={{ flex: 1, padding: '8px 6px', borderRadius: 6, border: `1.5px solid ${form.show_once === opt.val ? '#0288d1' : '#e8e8e8'}`, background: form.show_once === opt.val ? '#e0f0ff' : '#fff', color: form.show_once === opt.val ? '#0277bd' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Preview card */}
          <div>
            <div style={{ position: 'sticky', top: 70 }}>
              <div className="admin-card">
                <div className="admin-card-hdr"><h3>👁️ Live Preview</h3></div>
                <div style={{ padding: '16px', background: '#f5f5f5' }}>
                  {/* Mini popup preview */}
                  <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ background: form.bg_color, padding: '16px 14px', position: 'relative', textAlign: 'center', minHeight: 60 }}>
                      <div style={{ position: 'absolute', top: 6, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: form.text_color, fontWeight: 900 }}>×</div>
                      {form.title && (
                        <div style={{ color: form.text_color, fontSize: 14, fontWeight: 900, fontFamily: 'Rubik, sans-serif', paddingRight: 20, lineHeight: 1.3 }}>
                          {form.title || 'Your Title Here'}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {form.message || 'Your message will appear here…'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <div style={{ background: form.bg_color, color: form.text_color, padding: '7px 16px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                          {form.button_text || 'OK, Got it!'}
                        </div>
                        <div style={{ background: '#f0f0f0', color: '#888', padding: '7px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          Dismiss
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginTop: 12, fontSize: 12, color: '#92400e' }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>💡 Tips</div>
                <ul style={{ paddingLeft: 16, lineHeight: 2 }}>
                  <li>Keep messages short and clear</li>
                  <li>Use emojis to grab attention</li>
                  <li>Add a URL to take users to a sale page</li>
                  <li>Set delay to 0 for instant popup</li>
                  <li>"Once per session" is less annoying</li>
                </ul>
              </div>

              <button type="submit" disabled={saving}
                style={{ width: '100%', marginTop: 12, background: '#0288d1', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Rubik, sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? '⏳ Saving…' : '💾 Save Popup'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Full screen preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPreview(false)}>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            {/* Close */}
            <div style={{ background: form.bg_color, padding: '24px 20px 20px', position: 'relative', textAlign: 'center' }}>
              <button onClick={() => setPreview(false)}
                style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: form.text_color, width: 28, height: 28, borderRadius: '50%', fontSize: 16, cursor: 'pointer', fontWeight: 900 }}>×</button>
              {form.title && (
                <div style={{ color: form.text_color, fontSize: 20, fontWeight: 900, fontFamily: 'Rubik, sans-serif', lineHeight: 1.3, paddingRight: 24 }}>
                  {form.title}
                </div>
              )}
            </div>
            <div style={{ padding: '20px 24px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
                {form.message || 'Your message here…'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button style={{ background: form.bg_color, color: form.text_color, border: 'none', padding: '11px 28px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Rubik, sans-serif' }}>
                  {form.button_text || 'OK, Got it!'}
                </button>
                <button onClick={() => setPreview(false)} style={{ background: '#f5f5f5', color: '#888', border: 'none', padding: '11px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Dismiss
                </button>
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: '#aaa' }}>
                📋 Preview only — this is how it will look on the website
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
