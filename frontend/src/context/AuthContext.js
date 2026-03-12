import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import socket from '../socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      socket.emit('join_user', parsedUser._id);
      refreshUser(); // Get fresh data on mount
    }
    setLoading(false);

    // Global real-time listeners
    socket.on('balance_updated', () => {
      console.log('Balance update received');
      refreshUser();
    });

    socket.on('transaction_updated', (data) => {
      console.log('Transaction update received');
      refreshUser();
    });

    socket.on('trade_updated', (data) => {
      console.log('Trade update received');
      refreshUser();
    });

    return () => {
      socket.off('balance_updated');
      socket.off('transaction_updated');
      socket.off('trade_updated');
      if (user) {
        socket.emit('leave_user', user._id);
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      socket.emit('join_user', user._id);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        fullName
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      socket.emit('join_user', user._id);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (user) {
      socket.emit('leave_user', user._id);
    }
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};