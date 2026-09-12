import React, { createContext, useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (token && adminData) {
      setAdmin(JSON.parse(adminData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, otp) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
        otp
      });
      
      const { token, user } = response.data;
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        toast.error('Access denied. Admin role required.');
        return { success: false };
      }
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(user));
      setAdmin(user);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      const isRequireOTP = error.response?.status === 403 && error.response?.data?.requireOTP === true;
      
      if (isRequireOTP) {
        toast.success(message);
        return { success: false, requireOTP: true };
      }

      toast.error(message);
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
    toast.success('Logged out successfully');
  };

  const updateAdmin = (updates) => {
    const updatedAdmin = { ...admin, ...updates };
    setAdmin(updatedAdmin);
    localStorage.setItem('adminData', JSON.stringify(updatedAdmin));
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.permissions.includes('all')) return true;
    return admin.permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        login,
        logout,
        updateAdmin,
        hasPermission,
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook for using admin auth context
export const useAdminAuth = () => {
  const context = React.useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};