import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  Settings,
  Logout,
  Person,
  Security,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/profile#security');
    handleClose();
  };

  const handleWallet = () => {
    navigate('/funds');
    handleClose();
  };

  const getKYCColor = (status) => {
    switch(status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(19, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Crok<span style={{ color: '#00D395' }}>Trade</span>
              </Typography>
            </motion.div>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => window.location.reload()} sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
            <NotificationBell />
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{ p: 0 }}
              >
                <Avatar
                  src={user?.profilePicture}
                  sx={{
                    bgcolor: '#00D395',
                    width: 36,
                    height: 36,
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {!user?.profilePicture && (user?.fullName?.charAt(0).toUpperCase() || 'U')}
                </Avatar>
              </IconButton>
            </motion.div>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #131A2E 0%, #0F172A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`KYC: ${user?.kycStatus || 'pending'}`}
              size="small"
              color={getKYCColor(user?.kycStatus)}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <MenuItem onClick={handleProfile}>
          <Person sx={{ mr: 2, fontSize: 20 }} />
          Profile
        </MenuItem>

        <MenuItem onClick={handleWallet}>
          <AccountBalanceWallet sx={{ mr: 2, fontSize: 20 }} />
          Wallet
        </MenuItem>

        <MenuItem onClick={handleSettings}>
          <Security sx={{ mr: 2, fontSize: 20 }} />
          Security
        </MenuItem>

        <MenuItem onClick={handleSettings}>
          <Settings sx={{ mr: 2, fontSize: 20 }} />
          Settings
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <MenuItem onClick={handleLogout} sx={{ color: '#FF6B6B' }}>
          <Logout sx={{ mr: 2, fontSize: 20 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default TopBar;