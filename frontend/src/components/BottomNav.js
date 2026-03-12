import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, ShowChart, AccountBalanceWallet, Person, CandlestickChart } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const paths = ['/', '/markets', '/trading', '/funds', '/profile'];
    const currentIndex = paths.indexOf(location.pathname);
    if (currentIndex !== -1) {
      setValue(currentIndex);
    }
  }, [location]);

  const navItems = [
    { label: 'Home', icon: <Home />, path: '/' },
    { label: 'Markets', icon: <ShowChart />, path: '/markets' },
    { label: 'Trade', icon: <CandlestickChart />, path: '/trading', isTrade: true },
    { label: 'Funds', icon: <AccountBalanceWallet />, path: '/funds' },
    { label: 'Profile', icon: <Person />, path: '/profile' },
  ];

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(19, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          navigate(navItems[newValue].path);
        }}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 12px',
            color: 'rgba(255, 255, 255, 0.6)',
            '&.Mui-selected': {
              color: '#00D395',
            },
          },
        }}
      >
        {navItems.map((item, index) =>
          item.isTrade ? (
            <BottomNavigationAction
              key={index}
              label={
                <motion.span
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: value === index ? 1 : 0.6 }}
                  style={{ fontSize: '0.75rem', marginTop: '4px', color: '#00D395', fontWeight: 600 }}
                >
                  {item.label}
                </motion.span>
              }
              icon={
                <motion.div
                  animate={{ scale: value === index ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    background: 'linear-gradient(135deg, #00D395, #00a876)',
                    borderRadius: '50%',
                    width: 46,
                    height: 46,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 2,
                    boxShadow: '0 4px 15px rgba(0, 211, 149, 0.4)',
                    color: '#fff',
                    marginTop: -10,
                  }}
                >
                  {item.icon}
                </motion.div>
              }
              sx={{
                '&.MuiBottomNavigationAction-root': {
                  color: '#00D395 !important',
                },
              }}
            />
          ) : (
            <BottomNavigationAction
              key={index}
              label={
                <motion.span
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: value === index ? 1 : 0.6 }}
                  style={{ fontSize: '0.75rem', marginTop: '4px' }}
                >
                  {item.label}
                </motion.span>
              }
              icon={
                <motion.div
                  animate={{ scale: value === index ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {item.icon}
                </motion.div>
              }
            />
          )
        )}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;