import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import TradeResultModal from './components/TradeResultModal';
import { AuthContext, AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import TradingPage from './pages/TradingPage';
import FundsPage from './pages/FundsPage';
import ProfilePage from './pages/ProfilePage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import NotificationPage from './pages/NotificationPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import SupportPage from './pages/SupportPage';
import NewsPage from './pages/NewsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Context
// import { AuthProvider } from './context/AuthContext'; // already imported above

// Theme
import darkTheme from './theme';

import socket from './socket';

const GlobalTradeResult = () => {
  const { showTradeResult, tradeResult, resultPrice, closeTradeResult } = React.useContext(AuthContext);
  return (
    <TradeResultModal
      open={showTradeResult}
      onClose={closeTradeResult}
      trade={tradeResult}
      currentPrice={resultPrice}
    />
  );
};

function App() {
  const [marketData, setMarketData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    setLoading(false);

    const handlePriceUpdate = (data) => {
      setMarketData(data);
    };

    socket.on('priceUpdate', handlePriceUpdate);

    return () => {
      socket.off('priceUpdate', handlePriceUpdate);
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
          <AppContent 
            marketData={marketData} 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent({ marketData, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const { showTradeResult } = React.useContext(AuthContext);
  const isHomePage = location.pathname === '/';

  return (
    <div 
      className={`App ${!isHomePage ? 'premium-gradient' : ''}`} 
      style={{ background: 'transparent', minHeight: '100vh' }}
      {...(showTradeResult ? { inert: '' } : {})}
    >
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
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
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
          <Route path="/history" element={<TransactionHistoryPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
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
      <GlobalTradeResult />
    </div>
  );
}


export default App;