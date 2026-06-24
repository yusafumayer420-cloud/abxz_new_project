import React from 'react';
import { Box, Typography } from '@mui/material';
import { Home, ShowChart, CandlestickChart, AccountBalanceWallet, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Markets', icon: ShowChart, path: '/markets' },
  { label: 'Trade', icon: CandlestickChart, path: '/trading', isTrade: true },
  { label: 'Funds', icon: AccountBalanceWallet, path: '/funds' },
  { label: 'Profile', icon: Person, path: '/profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveIndex = () => {
    const paths = navItems.map(item => item.path);
    const idx = paths.indexOf(location.pathname);
    if (idx !== -1) return idx;
    if (location.pathname.startsWith('/trading')) return 2;
    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pb: 2, // Add padding bottom for the floating effect
        px: 2, // Add padding sides
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          background: 'rgba(5, 8, 22, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.08)', // Border all around
          borderRadius: '30px', // Bubble/pill shape
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          py: 0.75,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', // Add nice shadow for floating effect
        }}
      >
        {navItems.map((item, index) => {
          const isActive = activeIndex === index;
          const IconComponent = item.icon;

          if (item.isTrade) {
            return (
              <Box
                key={index}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  mt: -2.5,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00E5FF 0%, #4F7CFF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(0, 229, 255, 0.35), 0 0 40px rgba(0, 229, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 24, color: '#050816' }} />
                  </Box>
                </motion.div>
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    mt: 0.5,
                    color: '#00E5FF',
                    letterSpacing: '0.03em',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Box
              key={index}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                py: 0.75,
                px: 1.5,
                borderRadius: 2,
                position: 'relative',
                transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <IconComponent
                  sx={{
                    fontSize: 22,
                    color: isActive ? '#00E5FF' : '#94A3B8',
                    transition: 'color 0.2s ease',
                  }}
                />
              </motion.div>

              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: isActive ? 600 : 400,
                  mt: 0.25,
                  color: isActive ? '#00E5FF' : '#94A3B8',
                  transition: 'color 0.2s ease',
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </Typography>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#00E5FF',
                    boxShadow: '0 0 8px rgba(0, 229, 255, 0.6)',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default BottomNav;