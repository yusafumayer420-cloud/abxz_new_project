import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Components
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import LiveChat from './components/LiveChat';

// Pages
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import TradingPage from './pages/TradingPage';
import FundsPage from './pages/FundsPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import SupportPage from './pages/SupportPage';
import NewsPage from './pages/NewsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Context
import { AuthProvider } from './context/AuthContext';

// Theme
import darkTheme from './theme';

import socket from './socket';

function App() {
  const [marketData, setMarketData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Listen for real-time price updates
    socket.on('priceUpdate', (data) => {
      setMarketData(data);
    });

    return () => {
      clearTimeout(timer);
      socket.off('priceUpdate');
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider>
        <CssBaseline />
        <Router>
          <div className="App" style={{ background: 'transparent', minHeight: '100vh' }}>
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: '#131A2E',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage isRegister />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              {/* Protected Routes with Layout */}
              <Route element={
                <ProtectedRoute>
                  <>
                    <TopBar onMenuClick={() => setSidebarOpen(true)} />
                    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <Outlet />
                    <LiveChat />
                    <BottomNav />
                  </>
                </ProtectedRoute>
              }>
                <Route path="/" element={<HomePage marketData={marketData} />} />
                <Route path="/markets" element={<MarketPage marketData={marketData} />} />
                <Route path="/trading/:pair?" element={<TradingPage socket={socket} />} />
                <Route path="/funds" element={<FundsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/news" element={<NewsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/*" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
              
              {/* Redirect to home if route not found */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;