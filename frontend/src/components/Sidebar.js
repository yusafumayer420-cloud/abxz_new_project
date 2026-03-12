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
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Home,
  ShowChart,
  AccountBalanceWallet,
  Person,
  TrendingUp,
  SwapHoriz,
  Security,
  SupportAgent,
  BarChart,
  MenuOpen,
  ExpandLess,
  ExpandMore,
  Settings,
  Notifications,
  AccountBalance,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState({});

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Markets', icon: <ShowChart />, path: '/markets' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading/BTC-USDT' },
    { text: 'Wallet', icon: <AccountBalanceWallet />, path: '/funds' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const tradingItems = [
    { text: 'Spot Trading', icon: <SwapHoriz />, path: '/trading/spot' },
    { text: 'Perpetual', icon: <BarChart />, path: '/trading/perpetual', isComingSoon: true },
    { text: 'Delivery', icon: <AccountBalance />, path: '/trading/delivery', isComingSoon: true },
  ];

  const otherItems = [
    { text: 'Asset Management', icon: <AccountBalance />, path: '/assets', isComingSoon: true },
    { text: 'AI Trading', icon: <Settings />, path: '/ai-trading', isComingSoon: true },
    { text: 'Lending', icon: <TrendingUp />, path: '/lending', isComingSoon: true },
    { text: 'Support', icon: <SupportAgent />, path: '/support' },
    { text: 'Notifications', icon: <Notifications />, path: '/notifications', isComingSoon: true },
  ];

  const handleToggleSubmenu = (menu) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleNavigation = (item) => {
    if (item.isComingSoon) {
      toast(`${item.text} is coming soon!`, {
        icon: '🚀',
        style: {
          borderRadius: '10px',
          background: '#131A2E',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
      return;
    }
    navigate(item.path);
    onClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'linear-gradient(135deg, #0A0E17 0%, #131A2E 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Crok<span style={{ color: '#00D395' }}>Trade</span>
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <MenuOpen />
          </IconButton>
        </Box>

        <List>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'rgba(0, 211, 149, 0.1)' : 'transparent',
                  border: isActive(item.path) ? '1px solid rgba(0, 211, 149, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#00D395' : 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: { 
                      fontWeight: isActive(item.path) ? 'bold' : 'normal',
                      color: isActive(item.path) ? '#00D395' : 'white'
                    }
                  }}
                />
              </ListItem>
            </motion.div>
          ))}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

          {/* Trading Submenu */}
          <ListItem 
            button 
            onClick={() => handleToggleSubmenu('trading')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <TrendingUp />
            </ListItemIcon>
            <ListItemText primary="Trading" />
            {openSubmenu.trading ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={openSubmenu.trading} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {tradingItems.map((item) => (
                <ListItem
                  key={item.text}
                  button
                  onClick={() => handleNavigation(item)}
                  sx={{ 
                    pl: 4, 
                    mb: 0.5,
                    borderRadius: 2,
                    bgcolor: isActive(item.path) ? 'rgba(0, 211, 149, 0.1)' : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? '#00D395' : 'white', minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { 
                        fontSize: '0.875rem',
                        color: isActive(item.path) ? '#00D395' : 'rgba(255,255,255,0.8)'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

          {/* Other Items */}
          {otherItems.map((item, index) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                />
              </ListItem>
            </motion.div>
          ))}
        </List>

      </Box>
    </Drawer>
  );
};

export default Sidebar;