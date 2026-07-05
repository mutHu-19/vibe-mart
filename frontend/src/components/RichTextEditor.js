import React, { useRef, useEffect, useCallback } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current && editorRef.current) {
      editorRef.current.innerHTML = value || '';
      isFirst.current = false;
    }
  }, [value]);

  const exec = useCallback((cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  };

  const ToolBtn = ({ children, title, onClick }) => (
    <button type="button" title={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      style={{ width:30,height:30,border:'1.5px solid #e8e8e8',borderRadius:5,background:'#fff',
        color:'#444',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',
        alignItems:'center',justifyContent:'center',transition:'all 0.15s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.borderColor='#0288d1';}}
      onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#e8e8e8';}}>
      {children}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex',gap:5,flexWrap:'wrap',background:'#f9f9f9',
        padding:'8px 10px',borderRadius:'8px 8px 0 0',
        border:'1.5px solid #e8e8e8',borderBottom:'none' }}>
        <ToolBtn title="Bold" onClick={() => exec('bold')}><b>B</b></ToolBtn>
        <ToolBtn title="Italic" onClick={() => exec('italic')}><i>I</i></ToolBtn>
        <ToolBtn title="Underline" onClick={() => exec('underline')}><u>U</u></ToolBtn>
        <div style={{ width:1,background:'#e8e8e8',margin:'3px 2px' }} />
        <ToolBtn title="Bullet list" onClick={() => exec('insertUnorderedList')}>•</ToolBtn>
        <ToolBtn title="Numbered list" onClick={() => exec('insertOrderedList')}>1.</ToolBtn>
        <div style={{ width:1,background:'#e8e8e8',margin:'3px 2px' }} />
        <ToolBtn title="Heading" onClick={() => exec('formatBlock','<h4>')}>H</ToolBtn>
        <ToolBtn title="Paragraph" onClick={() => exec('formatBlock','<p>')}>¶</ToolBtn>
        <div style={{ width:1,background:'#e8e8e8',margin:'3px 2px' }} />
        <ToolBtn title="Clear formatting" onClick={() => exec('removeFormat')}>✕</ToolBtn>
      </div>

      {/* Editable area */}
      <div ref={editorRef} contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder || 'Write an attractive product description…'}
        style={{ minHeight:140,maxHeight:300,overflowY:'auto',padding:'12px 14px',
          border:'1.5px solid #e8e8e8',borderRadius:'0 0 8px 8px',
          fontSize:13,lineHeight:1.7,color:'#333',outline:'none',background:'#fff' }}
        className="rte-editable"
      />

      <style>{`
        .rte-editable:empty:before { content: attr(data-placeholder); color: #bbb; pointer-events: none; }
        .rte-editable:focus { border-color: #0288d1 !important; }
        .rte-editable b, .rte-editable strong { font-weight: 800; }
        .rte-editable i, .rte-editable em { font-style: italic; color: #444; }
        .rte-editable u { text-decoration: underline; }
        .rte-editable ul { list-style: disc; margin: 6px 0 6px 22px; }
        .rte-editable ol { list-style: decimal; margin: 6px 0 6px 22px; }
        .rte-editable li { margin: 3px 0; }
        .rte-editable h4 { font-size: 15px; font-weight: 800; margin: 10px 0 4px; color: #1b1b1b; }
        .rte-editable p { margin: 4px 0; }

        .rte-display b, .rte-display strong { font-weight: 800; }
        .rte-display i, .rte-display em { font-style: italic; }
        .rte-display u { text-decoration: underline; }
        .rte-display ul { list-style: disc; margin: 6px 0 6px 22px; }
        .rte-display ol { list-style: decimal; margin: 6px 0 6px 22px; }
        .rte-display li { margin: 3px 0; }
        .rte-display h4 { font-size: 15px; font-weight: 800; margin: 10px 0 4px; color: #1b1b1b; }
        .rte-display p { margin: 4px 0; }
      `}</style>
    </div>
  );
}

// Safe HTML renderer for the shop frontend
export function RichTextDisplay({ html, style }) {
  const sanitize = (dirty) => {
    if (!dirty) return '';
    const allowed = ['b','strong','i','em','u','ul','ol','li','p','br','h4','span'];
    const div = document.createElement('div');
    div.innerHTML = dirty;
    const clean = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 1) {
          if (!allowed.includes(child.tagName.toLowerCase())) {
            child.replaceWith(document.createTextNode(child.textContent));
            return;
          }
          [...child.attributes].forEach(attr => child.removeAttribute(attr.name));
          clean(child);
        }
      });
    };
    clean(div);
    return div.innerHTML;
  };
  return (
    <div className="rte-display"
      style={{ fontSize:13,color:'#444',lineHeight:1.7,...style }}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
