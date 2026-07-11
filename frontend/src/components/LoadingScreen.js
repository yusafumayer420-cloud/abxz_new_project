import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0A0E17 0%, #131A2E 100%)',
        color: 'white',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ color: '#00E5FF', mb: 3 }}
        />
      </motion.div>
      <Box
        component="img"
        src="/logo.png"
        alt="Cryptosimia Logo"
        sx={{
          height: 80,
          width: 80,
          objectFit: 'cover',
          display: 'block',
          mt: 2,
          borderRadius: '50%',
          mixBlendMode: 'normal',
          border: '2px solid rgba(0, 120, 255, 0.4)',
          boxShadow: '0 0 16px rgba(0, 120, 255, 0.5)',
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;