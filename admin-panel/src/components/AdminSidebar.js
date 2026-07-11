import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Security,
  TrendingUp,
  AccountBalanceWallet,
  SupportAgent,
  Settings,
  Logout,
  MenuOpen,
  ExpandLess,
  ExpandMore,
  Notifications,
  BarChart,
  Receipt,
  History,
  AdminPanelSettings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminSidebar = ({ open, onClose, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuth();
  const [openSubmenu, setOpenSubmenu] = useState({});

  const mainMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'User Management', icon: <People />, path: '/users' },
    { text: 'KYC Verification', icon: <Security />, path: '/kyc' },
    { text: 'Trading Management', icon: <TrendingUp />, path: '/trading' },
    { text: 'Transactions', icon: <AccountBalanceWallet />, path: '/transactions' },
    { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    { text: 'Support Center', icon: <SupportAgent />, path: '/support' },

    { text: 'System Settings', icon: <Settings />, path: '/settings' },
  ];



  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleToggleSubmenu = (menu) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#8b5cf6',
                width: 40,
                height: 40,
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              A
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Admin Panel
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v2.1.0
              </Typography>
            </Box>
          </Box>
          {!isMobile && (
            <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
              <MenuOpen />
            </IconButton>
          )}
        </Box>

      </Box>



      {/* Main Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          MAIN MENU
        </Typography>
        <List sx={{ '& .MuiListItem-root': { mb: 0.5 } }}>
          {mainMenuItems.map((item) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'rgba(0, 211, 149, 0.1)' : 'transparent',
                  border: isActive(item.path) ? '1px solid rgba(0, 211, 149, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: isActive(item.path) ? 'rgba(0, 211, 149, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive(item.path) ? '#8b5cf6' : 'white', 
                  minWidth: 40,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ 
                      fontWeight: isActive(item.path) ? 'bold' : 'normal',
                      color: isActive(item.path) ? '#8b5cf6' : 'white'
                    }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItem>
            </motion.div>
          ))}
        </List>


      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: '#f43f5e',
            '&:hover': {
              bgcolor: 'rgba(255, 107, 107, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#f43f5e', minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            System Status: <span style={{ color: '#8b5cf6' }}>● Online</span>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Last updated: Just now
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="left"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              background: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            width: open ? 280 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              background: 'linear-gradient(135deg, #0a0f1d 0%, #111827 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default AdminSidebar;