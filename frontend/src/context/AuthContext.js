import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin') || 'null'); } catch { return null; }
  });

  const login = (adminData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  // Helper: check if current user is super_admin
  const isSuperAdmin = admin?.role === 'super_admin';

  // Helper: check if current user can access a feature
  // staff role can: bills, expenses, customers, inventory, orders, invoices, bill-settings, change-password
  // staff role CANNOT: reports, dashboard financials, products (edit), categories, cost prices
  const canAccess = (feature) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    const staffAllowed = [
      'new-bill', 'expenses', 'customers', 'inventory',
      'orders', 'invoices', 'bill-settings', 'change-password'
    ];
    return staffAllowed.includes(feature);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isSuperAdmin, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
