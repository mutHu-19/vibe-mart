import React, { useState, useCallback } from 'react';

let showToastFn;

export function ToastContainer() {
  const [toast, setToast] = useState(null);

  showToastFn = useCallback((msg, type = 'default') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.msg}</div>;
}

export const showToast = (msg, type) => showToastFn?.(msg, type);
