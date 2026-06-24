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
      case 'unverified': return 'info';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(5, 8, 22, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        }}
      >
        <Toolbar sx={{ minHeight: 60, px: 2 }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 1.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                Crok<span style={{ color: '#00E5FF' }}>Trade</span>
              </Typography>
            </motion.div>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              onClick={() => window.location.reload()} 
              sx={{ 
                color: '#94A3B8',
                '&:hover': { color: '#FFFFFF' },
                transition: 'color 0.2s ease',
              }}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
            <NotificationBell />
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{ p: 0, ml: 0.5 }}
              >
                <Avatar
                  src={user?.profilePicture}
                  sx={{
                    bgcolor: '#00E5FF',
                    color: '#050816',
                    width: 34,
                    height: 34,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    border: '2px solid rgba(0, 229, 255, 0.3)',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: 'rgba(0, 229, 255, 0.6)',
                    },
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
            minWidth: 220,
            borderRadius: 3,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`KYC: ${user?.kycStatus || 'unverified'}`}
              size="small"
              color={getKYCColor(user?.kycStatus)}
              sx={{ fontSize: '0.65rem', height: 22 }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)' }} />

        <MenuItem onClick={handleProfile} sx={{ py: 1.25 }}>
          <Person sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Profile</Typography>
        </MenuItem>

        <MenuItem onClick={handleWallet} sx={{ py: 1.25 }}>
          <AccountBalanceWallet sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Wallet</Typography>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.25 }}>
          <Security sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Security</Typography>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.25 }}>
          <Settings sx={{ mr: 2, fontSize: 18, color: '#94A3B8' }} />
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)' }} />

        <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: '#FF5252' }}>
          <Logout sx={{ mr: 2, fontSize: 18 }} />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default TopBar;