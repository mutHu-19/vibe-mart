import React, { useState, useEffect } from 'react';
import { showToast } from '../../components/Toast';

const CATS = ['Rent','Utilities','Salaries','Transport','Marketing','Supplies','Maintenance','Other'];
const STORAGE_KEY = 'shoplk_expenses';

export default function Expenses() {
  const [expenses, setExpenses] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', amount:'', category:'Other', date: new Date().toISOString().slice(0,10), note:'' });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }, [expenses]);

  const save = (e) => {
    e.preventDefault();
    const exp = { ...form, id: Date.now(), amount: parseFloat(form.amount) };
    setExpenses(p => [exp, ...p]);
    showToast('Expense added', 'success');
    setShowForm(false);
    setForm({ title:'', amount:'', category:'Other', date: new Date().toISOString().slice(0,10), note:'' });
  };

  const del = (id) => { setExpenses(p => p.filter(e => e.id !== id)); showToast('Deleted'); };
  const total = expenses.reduce((s,e)=>s+e.amount,0);
  const thisMonth = expenses.filter(e=>e.date.slice(0,7)===new Date().toISOString().slice(0,7)).reduce((s,e)=>s+e.amount,0);

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ fontWeight:700, marginBottom:'0.2rem' }}>Expenses</h2>
          <p style={{ color:'#aaa', fontSize:'0.85rem' }}>Track business expenses</p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ background:'#e94560', color:'#fff', border:'none', padding:'0.6rem 1.25rem', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>+ Add Expense</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.25rem' }}>
        {[
          { label:'This Month', value:`Rs. ${thisMonth.toLocaleString()}`, icon:'📅', color:'#e94560' },
          { label:'Total Expenses', value:`Rs. ${total.toLocaleString()}`, icon:'💸', color:'#1a1a2e' },
          { label:'No. of Records', value:expenses.length, icon:'📋', color:'#8e44ad' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'1.25rem', border:'1px solid #eee', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:s.color, marginBottom:'0.2rem' }}>{s.value}</div>
            <div style={{ fontSize:'0.8rem', color:'#aaa' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
          <thead>
            <tr style={{ background:'#fafafa' }}>
              {['Date','Title','Category','Amount','Note',''].map(h=>(
                <th key={h} style={{ padding:'0.65rem 1rem', textAlign:'left', fontWeight:700, color:'#888', fontSize:'0.72rem', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map(e=>(
              <tr key={e.id} style={{ borderBottom:'1px solid #f8f8f8' }}>
                <td style={{ padding:'0.75rem 1rem', color:'#aaa' }}>{e.date}</td>
                <td style={{ padding:'0.75rem 1rem', fontWeight:600 }}>{e.title}</td>
                <td style={{ padding:'0.75rem 1rem' }}><span style={{ background:'#f0f2f5', borderRadius:20, padding:'0.2rem 0.65rem', fontSize:'0.75rem', fontWeight:600 }}>{e.category}</span></td>
                <td style={{ padding:'0.75rem 1rem', fontWeight:700, color:'#e94560' }}>Rs. {e.amount.toLocaleString()}</td>
                <td style={{ padding:'0.75rem 1rem', color:'#aaa', fontSize:'0.82rem' }}>{e.note||'—'}</td>
                <td style={{ padding:'0.75rem 1rem' }}><button onClick={()=>del(e.id)} style={{ background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontSize:'1rem' }}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length===0 && <div style={{ textAlign:'center', padding:'3rem', color:'#ccc' }}>No expenses recorded yet</div>}
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:440, width:'100%' }}>
            <button onClick={()=>setShowForm(false)} style={{ float:'right', background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#aaa' }}>×</button>
            <h3 style={{ fontWeight:700, marginBottom:'1.5rem' }}>Add Expense</h3>
            <form onSubmit={save}>
              {[
                { label:'Title', name:'title', type:'text', placeholder:'e.g. Monthly Rent' },
                { label:'Amount (Rs.)', name:'amount', type:'number', placeholder:'0.00' },
                { label:'Date', name:'date', type:'date' },
              ].map(f=>(
                <div key={f.name} style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.35rem' }}>{f.label}</label>
                  <input type={f.type} name={f.name} placeholder={f.placeholder} required value={form[f.name]} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.9rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
                </div>
              ))}
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.35rem' }}>Category</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ width:'100%', padding:'0.6rem 0.9rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.35rem' }}>Note (optional)</label>
                <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Additional notes..." style={{ width:'100%', padding:'0.6rem 0.9rem', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:'0.9rem', outline:'none' }} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:'0.75rem', borderRadius:10, border:'1.5px solid #e0e0e0', background:'#fff', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:2, padding:'0.75rem', borderRadius:10, border:'none', background:'#e94560', color:'#fff', cursor:'pointer', fontWeight:700 }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
