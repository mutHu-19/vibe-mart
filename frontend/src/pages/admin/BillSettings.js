import React, { useState, useEffect } from 'react';
import { showToast } from '../../components/Toast';

const KEY = 'shoplk_bill_settings';
const DEFAULTS = { shop_name:'My Shop', phone:'', address:'', email:'', bank_name:'', account_no:'', account_name:'', branch:'', delivery_charge:350, footer_note:'Thank you for your purchase!', whatsapp_number:'' };

export default function BillSettings() {
  const [settings, setSettings] = useState(() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)||'{}') }; } catch { return DEFAULTS; } });
  const [saved, setSaved] = useState(false);

  const save = (e) => { e.preventDefault(); localStorage.setItem(KEY, JSON.stringify(settings)); setSaved(true); showToast('Settings saved!', 'success'); setTimeout(()=>setSaved(false),2000); };
  const field = (label, key, type='text', placeholder='') => (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.35rem' }}>{label}</label>
      <input type={type} value={settings[key]} onChange={e=>setSettings(p=>({...p,[key]:e.target.value}))} placeholder={placeholder} style={{ width:'100%', padding:'0.65rem 1rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
    </div>
  );

  return (
    <form onSubmit={save}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ fontWeight:700, marginBottom:'0.2rem' }}>Bill Settings</h2>
          <p style={{ color:'#aaa', fontSize:'0.85rem' }}>Configure your invoice and shop details</p>
        </div>
        <button type="submit" style={{ background: saved?'#27ae60':'#e94560', color:'#fff', border:'none', padding:'0.65rem 1.5rem', borderRadius:10, fontWeight:700, cursor:'pointer', transition:'background 0.3s' }}>
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', border:'1px solid #eee', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>🏪 Shop Information</div>
          {field('Shop Name', 'shop_name', 'text', 'My Shop')}
          {field('Phone', 'phone', 'tel', '+94 77 123 4567')}
          {field('Email', 'email', 'email', 'shop@email.com')}
          {field('Address', 'address', 'text', 'No. 1, Main Street, Colombo')}
          {field('WhatsApp Number', 'whatsapp_number', 'text', '94771234567')}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', border:'1px solid #eee', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>🏦 Bank Details</div>
            {field('Bank Name', 'bank_name', 'text', 'Commercial Bank')}
            {field('Account Number', 'account_no', 'text', '1234567890')}
            {field('Account Name', 'account_name', 'text', 'My Shop (Pvt) Ltd')}
            {field('Branch', 'branch', 'text', 'Colombo')}
          </div>

          <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', border:'1px solid #eee', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>🚚 Delivery & Invoice</div>
            {field('Default Delivery Charge (Rs.)', 'delivery_charge', 'number', '350')}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.35rem' }}>Footer Note</label>
              <textarea value={settings.footer_note} onChange={e=>setSettings(p=>({...p,footer_note:e.target.value}))} rows={2} style={{ width:'100%', padding:'0.65rem 1rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none', resize:'vertical' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Preview card */}
      <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', border:'1px solid #eee', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', marginTop:'1.25rem' }}>
        <div style={{ fontWeight:700, marginBottom:'1rem' }}>👁️ Invoice Preview</div>
        <div style={{ border:'1px dashed #e0e0e0', borderRadius:12, padding:'1.5rem', maxWidth:480 }}>
          <div style={{ textAlign:'center', marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#1a1a2e' }}>{settings.shop_name || 'My Shop'}</div>
            {settings.phone && <div style={{ fontSize:'0.85rem', color:'#888' }}>📞 {settings.phone}</div>}
            {settings.address && <div style={{ fontSize:'0.85rem', color:'#888' }}>📍 {settings.address}</div>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.25rem', fontSize:'0.85rem', marginBottom:'1rem' }}>
            <span style={{ color:'#888' }}>Invoice No:</span><span style={{ fontWeight:700 }}>INV-250529-0001</span>
            <span style={{ color:'#888' }}>Date:</span><span>{new Date().toLocaleDateString()}</span>
          </div>
          {settings.bank_name && (
            <div style={{ background:'#f8f9fa', borderRadius:8, padding:'0.75rem', fontSize:'0.82rem', marginTop:'0.5rem' }}>
              <div style={{ fontWeight:700, marginBottom:'0.3rem' }}>Bank Transfer Details:</div>
              <div>{settings.bank_name} · {settings.account_no}</div>
              <div style={{ color:'#888' }}>{settings.account_name} · {settings.branch}</div>
            </div>
          )}
          {settings.footer_note && <div style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.8rem', color:'#aaa', fontStyle:'italic' }}>{settings.footer_note}</div>}
        </div>
      </div>
    </form>
  );
}
