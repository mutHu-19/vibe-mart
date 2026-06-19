import React, { useRef, useEffect, useCallback } from 'react';

/**
 * RichTextEditor — lightweight WYSIWYG using contentEditable
 * Stores content as HTML string (sanitized to a safe subset of tags)
 */
export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && editorRef.current) {
      editorRef.current.innerHTML = value || '';
      isFirstRender.current = false;
    }
  }, [value]);

  const exec = useCallback((command, arg = null) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const ToolBtn = ({ icon, title, onClick, active }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()} // prevent losing focus/selection
      onClick={onClick}
      style={{
        width: 32, height: 32,
        border: '1.5px solid #e8e8e8',
        borderRadius: 6,
        background: active ? '#e0f0ff' : '#fff',
        color: active ? '#0277bd' : '#555',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {icon}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', background: '#f9f9f9', padding: '8px 10px', borderRadius: '8px 8px 0 0', border: '1.5px solid #e8e8e8', borderBottom: 'none' }}>
        <ToolBtn icon={<b>B</b>} title="Bold" onClick={() => exec('bold')} />
        <ToolBtn icon={<i>I</i>} title="Italic" onClick={() => exec('italic')} />
        <ToolBtn icon={<u>U</u>} title="Underline" onClick={() => exec('underline')} />
        <div style={{ width: 1, background: '#e8e8e8', margin: '4px 2px' }} />
        <ToolBtn icon="•" title="Bullet List" onClick={() => exec('insertUnorderedList')} />
        <ToolBtn icon="1." title="Numbered List" onClick={() => exec('insertOrderedList')} />
        <div style={{ width: 1, background: '#e8e8e8', margin: '4px 2px' }} />
        <ToolBtn icon="H" title="Heading" onClick={() => exec('formatBlock', '<h4>')} />
        <ToolBtn icon="¶" title="Paragraph" onClick={() => exec('formatBlock', '<p>')} />
        <div style={{ width: 1, background: '#e8e8e8', margin: '4px 2px' }} />
        <ToolBtn icon="✕" title="Clear Formatting" onClick={() => exec('removeFormat')} />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder || 'Write an attractive description…'}
        style={{
          minHeight: 120,
          maxHeight: 280,
          overflowY: 'auto',
          padding: '12px 14px',
          border: '1.5px solid #e8e8e8',
          borderRadius: '0 0 8px 8px',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#333',
          outline: 'none',
        }}
        className="rte-editable"
      />

      <style>{`
        .rte-editable:empty:before {
          content: attr(data-placeholder);
          color: #bbb;
        }
        .rte-editable b, .rte-editable strong { font-weight: 800; }
        .rte-editable i, .rte-editable em { font-style: italic; }
        .rte-editable ul, .rte-editable ol { margin: 6px 0 6px 20px; }
        .rte-editable h4 { font-size: 15px; font-weight: 800; margin: 8px 0 4px; color: #1b1b1b; }
        .rte-editable p { margin: 4px 0; }
      `}</style>
    </div>
  );
}

/**
 * RichTextDisplay — renders the saved HTML safely on the shop frontend
 * Strips any potentially dangerous tags/attributes before rendering
 */
export function RichTextDisplay({ html, style }) {
  const sanitize = (dirty) => {
    if (!dirty) return '';
    // Allow only a safe subset of tags
    const allowedTags = ['b','strong','i','em','u','ul','ol','li','p','br','h4','span'];
    const div = document.createElement('div');
    div.innerHTML = dirty;

    const clean = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 1) { // element
          if (!allowedTags.includes(child.tagName.toLowerCase())) {
            // Replace disallowed tag with its text content
            const text = document.createTextNode(child.textContent);
            child.replaceWith(text);
            return;
          }
          // Strip all attributes except none needed
          [...child.attributes].forEach(attr => child.removeAttribute(attr.name));
          clean(child);
        }
      });
    };
    clean(div);
    return div.innerHTML;
  };

  return (
    <div
      style={{ fontSize: 13, color: '#444', lineHeight: 1.7, ...style }}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
