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
          sx={{ color: '#00D395', mb: 3 }}
        />
      </motion.div>
      <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
        Crok<span style={{ color: '#00D395' }}>Trade</span>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;