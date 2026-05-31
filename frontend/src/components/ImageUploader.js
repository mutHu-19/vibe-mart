import React, { useState, useRef } from 'react';
import api from '../utils/api';

/**
 * ImageUploader
 * Admin uploads image → backend → ImgBB → URL stored in DB
 *
 * Props:
 *   images:   string[]          current URLs
 *   onChange: (urls) => void    called with updated URL array
 *   max:      number            max images allowed (default 5)
 */
export default function ImageUploader({ images = [], onChange, max = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef();

  const current = images.filter(Boolean);

  const uploadFiles = async (files) => {
    if (!files || !files.length) return;
    const remaining = max - current.length;
    if (remaining <= 0) {
      alert(`Maximum ${max} images allowed. Remove one first.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadProgress(`Uploading ${toUpload.length} image${toUpload.length > 1 ? 's' : ''}…`);

    try {
      const formData = new FormData();
      toUpload.forEach(f => formData.append('images', f));

      const { data } = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrls = data.urls || [];
      onChange([...current, ...newUrls]);
      setUploadProgress('');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
      setUploadProgress('');
    }
    setUploading(false);
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e) => {
    uploadFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (current.length >= max) { alert(`Max ${max} images`); return; }
    if (!url.startsWith('http')) { alert('Enter a valid URL starting with http'); return; }
    onChange([...current, url]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removeImage = (index) => {
    onChange(current.filter((_, i) => i !== index));
  };

  const moveLeft = (index) => {
    if (index === 0) return;
    const arr = [...current];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onChange(arr);
  };

  const moveRight = (index) => {
    if (index === current.length - 1) return;
    const arr = [...current];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onChange(arr);
  };

  return (
    <div>
      {/* Image previews */}
      {current.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {current.map((url, i) => (
            <div key={i} style={{
              position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden',
              border: `2px solid ${i === 0 ? '#e62e04' : '#e8e8e8'}`, flexShrink: 0,
              boxShadow: i === 0 ? '0 0 0 2px rgba(230,46,4,0.2)' : 'none',
            }}>
              <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              {/* Main badge */}
              {i === 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(230,46,4,0.88)', color: '#fff', fontSize: 9, fontWeight: 900, textAlign: 'center', padding: '2px 0', letterSpacing: 0.5 }}>
                  MAIN PHOTO
                </div>
              )}

              {/* Move arrows */}
              {current.length > 1 && (
                <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 2 }}>
                  {i > 0 && (
                    <button type="button" onClick={() => moveLeft(i)}
                      style={{ width: 18, height: 18, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ‹
                    </button>
                  )}
                  {i < current.length - 1 && (
                    <button type="button" onClick={() => moveRight(i)}
                      style={{ width: 18, height: 18, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ›
                    </button>
                  )}
                </div>
              )}

              {/* Remove button */}
              <button type="button" onClick={() => removeImage(i)}
                style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, background: 'rgba(230,46,4,0.9)', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}

          {/* Add more slot (if under max) */}
          {current.length < max && !uploading && (
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 90, height: 90, borderRadius: 8, border: '2px dashed #d0d0d0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#e62e04'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d0d0d0'}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>+</div>
              <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Add photo</div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}
        </div>
      )}

      {/* Drop zone (shown when no images yet) */}
      {current.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#e62e04' : '#d0d0d0'}`,
            borderRadius: 8, padding: '24px 16px', textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragOver ? '#fff1ee' : '#fafafa',
            transition: 'all 0.2s', marginBottom: 8,
          }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, border: '3px solid #f0f0f0', borderTopColor: '#e62e04', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{uploadProgress}</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#444', marginBottom: 4 }}>
                {dragOver ? 'Drop images here!' : 'Click to upload or drag & drop'}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                JPG · PNG · WEBP · GIF<br />
                Up to {max} images · Max 32MB each<br />
                <strong style={{ color: '#888' }}>First image = main product photo</strong>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      {/* Upload progress bar (when images already exist) */}
      {uploading && current.length > 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, border: '2px solid #f0f0f0', borderTopColor: '#e62e04', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{uploadProgress}</span>
        </div>
      )}

      {/* OR — add by URL link */}
      {!uploading && current.length < max && (
        <div style={{ marginTop: current.length > 0 ? 0 : 6 }}>
          {!showUrlInput ? (
            <button type="button" onClick={() => setShowUrlInput(true)}
              style={{ background: 'none', border: '1px solid #e8e8e8', borderRadius: 4, padding: '6px 12px', fontSize: 11, color: '#999', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
              🔗 Or paste an image URL instead
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                autoFocus
                style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e8e8e8', borderRadius: 4, fontSize: 13, outline: 'none' }} />
              <button type="button" onClick={handleAddUrl}
                style={{ background: '#1b1b1b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Add URL
              </button>
              <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                style={{ background: '#f5f5f5', color: '#888', border: 'none', borderRadius: 4, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {current.length >= max && (
        <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
          ✅ {max}/{max} images · Remove one to add more
        </div>
      )}
    </div>
  );
}
