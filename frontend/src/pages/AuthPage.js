import React, { useState, useContext } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Email, 
  Lock,
  Phone,
  AccountCircle 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = ({ isRegister = false }) => {
  const navigate = useNavigate();
  const { login, register } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      
      const success = await register(formData.email, formData.password, formData.fullName);
      if (success) navigate('/');
    } else {
      const success = await login(formData.email, formData.password);
      if (success) navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            Crok<span style={{ color: '#00D395' }}>Trade</span>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isRegister ? 'Create your account' : 'Welcome back to your trading dashboard'}
          </Typography>
        </Box>

        {/* Form */}
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            {isRegister && (
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {!isRegister && (
              <Box sx={{ mb: 3, textAlign: 'right' }}>
                <Link
                  onClick={() => navigate('/forgot-password')}
                  sx={{
                    color: '#00D395',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>
            )}

            {isRegister && (
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#00D395',
                  fontWeight: 'bold',
                  py: 1.5,
                  mb: 2,
                  '&:hover': {
                    bgcolor: '#00b884'
                  }
                }}
              >
                {isRegister ? 'Create Account' : 'Sign In'}
              </Button>
            </motion.div>

            {/* Switch Mode */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link
                  href={isRegister ? '/login' : '/register'}
                  sx={{
                    color: '#00D395',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>

        {/* Features */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Why choose CrokTrade?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            {['🔒 Secure', '⚡ Fast', '💰 Low Fees', '📱 Mobile First'].map((feature, index) => (
              <Typography key={index} variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {feature}
              </Typography>
            ))}
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
};

export default AuthPage;