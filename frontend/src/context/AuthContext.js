import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin') || 'null'); } catch { return null; }
  });

  const login = (data) => {
    localStorage.setItem('admin', JSON.stringify(data.admin));
    localStorage.setItem('token', data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    setAdmin(null);
  };

  const token = localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
