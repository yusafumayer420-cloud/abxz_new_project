import React, { useState, useContext, useRef } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Link,
  IconButton, InputAdornment, Stepper, Step, StepLabel, CircularProgress,
  Avatar
} from '@mui/material';
import {
  Visibility, VisibilityOff, Person, Email, Lock, Phone,
  Group, ArrowBack, CloudUpload, PhotoCamera, CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, verifyOTP, refreshUser } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Account
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
    termsAccepted: false
  });
  const [otp, setOtp] = useState('');

  // Step 2: KYC
  const [kycFiles, setKycFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });

  // Step 3: Profile
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must accept the Terms of Service');
      return;
    }
    setLoading(true);
    const result = await register(formData.email, formData.password, formData.fullName, formData.referralCode);
    setLoading(false);
    if (result.success) {
      setShowOtp(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP');
      return;
    }
    setLoading(true);
    const result = await verifyOTP(formData.email, otp);
    setLoading(false);
    if (result.success) {
      setShowOtp(false);
      setCurrentStep(2);
    }
  };

  const handleKycFileChange = (type) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setKycFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
    }
  };

  const uploadKYC = async () => {
    const types = [];
    if (kycFiles.idFront) types.push('idFront');
    if (kycFiles.idBack) types.push('idBack');
    if (kycFiles.selfie) types.push('selfie');

    if (types.length === 0) {
      toast.error('Please upload at least one document or skip');
      return false;
    }

    setLoading(true);
    try {
      for (const type of types) {
        const formData = new FormData();
        formData.append('document', kycFiles[type]);
        formData.append('type', type);
        await axios.post('/api/users/kyc/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success('KYC documents uploaded successfully');
      refreshUser();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'KYC upload failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async () => {
    const success = await uploadKYC();
    if (success) {
      setCurrentStep(3);
    }
  };

  const handleProfilePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async () => {
    if (!profilePhoto) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('profile', profilePhoto);
      await axios.post('/api/users/profile-picture', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile photo uploaded!');
      refreshUser();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile upload failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Account', 'KYC', 'Profile'];

  const renderStepTracker = () => (
    <Stepper activeStep={currentStep - 1} alternativeLabel sx={{ mb: 4 }}>
      {steps.map((label, index) => (
        <Step key={label} completed={currentStep > index + 1}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/login')} sx={{ color: 'text.secondary' }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          {currentStep > 1 && (
            <Button 
              onClick={() => currentStep === 2 ? setCurrentStep(3) : navigate('/')} 
              sx={{ color: '#00E5FF', fontWeight: 'bold', textTransform: 'none' }}
            >
              Skip for now
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {currentStep === 1 && !showOtp && (
            <>
              <Typography variant="h5" fontWeight="bold">Create Account</Typography>
              <Typography variant="body2" color="text.secondary">Fill in your details to get started</Typography>
            </>
          )}
          {currentStep === 1 && showOtp && (
            <>
              <Typography variant="h5" fontWeight="bold">Verify Email</Typography>
              <Typography variant="body2" color="text.secondary">Enter the 6-digit code sent to {formData.email}</Typography>
            </>
          )}
          {currentStep === 2 && (
            <>
              <Typography variant="h5" fontWeight="bold">Verify Your Identity</Typography>
              <Typography variant="body2" color="text.secondary">Please complete KYC to secure your account and unlock all features</Typography>
            </>
          )}
          {currentStep === 3 && (
            <>
              <Typography variant="h5" fontWeight="bold">Add Profile Photo</Typography>
              <Typography variant="body2" color="text.secondary">Add a profile photo to personalize your account</Typography>
            </>
          )}
        </Box>

        {renderStepTracker()}

        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, background: 'rgba(25, 30, 45, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* STEP 1: ACCOUNT DETAILS */}
          {currentStep === 1 && !showOtp && (
            <form onSubmit={handleRegisterSubmit}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Full Name</Typography>
                <TextField fullWidth name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Email</Typography>
                <TextField fullWidth type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Phone Number</Typography>
                <TextField fullWidth type="tel" name="phone" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Password</Typography>
                <TextField fullWidth type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Referral Code (Optional)</Typography>
                <TextField fullWidth name="referralCode" placeholder="Enter referral code" value={formData.referralCode} onChange={handleChange} sx={{ mt: 0.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><Group fontSize="small" /></InputAdornment> }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} style={{ marginRight: '10px' }} />
                <Typography variant="body2" color="text.secondary">
                  I agree to the <Link sx={{ color: '#00E5FF' }}>Terms of Service</Link> and <Link sx={{ color: '#00E5FF' }}>Privacy Policy</Link>
                </Typography>
              </Box>

              <Button fullWidth type="submit" variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #00E5FF 0%, #00BCD4 100%)', color: '#050816', fontWeight: 'bold', py: 1.5, mb: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Next'}
              </Button>

              <Typography variant="body2" align="center" color="text.secondary">
                Already have an account? <Link onClick={() => navigate('/login')} sx={{ color: '#00E5FF', cursor: 'pointer', fontWeight: 'bold' }}>Sign In</Link>
              </Typography>
            </form>
          )}

          {/* STEP 1.5: OTP VERIFICATION */}
          {currentStep === 1 && showOtp && (
            <form onSubmit={handleVerifyOtp}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <TextField fullWidth variant="outlined" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="000000" inputProps={{ style: { textAlign: 'center', fontSize: '2rem', letterSpacing: '8px' } }} autoFocus />
              </Box>
              <Button fullWidth type="submit" variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #00E5FF 0%, #00BCD4 100%)', color: '#050816', fontWeight: 'bold', py: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
              </Button>
            </form>
          )}

          {/* STEP 2: KYC */}
          {currentStep === 2 && (
            <Box>
              {['idFront', 'idBack', 'selfie'].map((docType) => (
                <Box key={docType} sx={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 2, mb: 2, textAlign: 'center', position: 'relative' }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, textAlign: 'left' }}>
                    {docType === 'idFront' && 'ID Front Side'}
                    {docType === 'idBack' && 'ID Back Side'}
                    {docType === 'selfie' && 'ID with Selfie'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'left' }}>
                    {docType === 'idFront' && 'Upload the front side of your ID'}
                    {docType === 'idBack' && 'Upload the back side of your ID'}
                    {docType === 'selfie' && 'Take a selfie holding your ID'}
                  </Typography>
                  
                  <input accept="image/*" style={{ display: 'none' }} id={`upload-${docType}`} type="file" onChange={handleKycFileChange(docType)} />
                  <label htmlFor={`upload-${docType}`}>
                    <Box sx={{ cursor: 'pointer', p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.1)' }}>
                      {kycFiles[docType] ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#00E5FF' }}>
                          <CheckCircle fontSize="small" />
                          <Typography variant="body2">{kycFiles[docType].name}</Typography>
                        </Box>
                      ) : (
                        <>
                          <CloudUpload sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">Tap to upload</Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
              ))}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 3 }}>
                Supported formats: JPG, PNG (Max 5MB)
              </Typography>

              <Button fullWidth onClick={handleKycSubmit} variant="contained" disabled={loading} sx={{ background: 'linear-gradient(135deg, #00E5FF 0%, #00BCD4 100%)', color: '#050816', fontWeight: 'bold', py: 1.5, mb: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Next'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                <Lock fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Your data is 100% secure
              </Typography>
            </Box>
          )}

          {/* STEP 3: PROFILE */}
          {currentStep === 3 && (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 4, mt: 2 }}>
                <Avatar src={profilePreview} sx={{ width: 120, height: 120, border: '2px solid #00E5FF', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <IconButton onClick={() => fileInputRef.current?.click()} sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', border: '1px solid #333' }}>
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Upload your profile photo<br/>JPG, PNG (Max 5MB)</Typography>

              <input accept="image/*" style={{ display: 'none' }} ref={fileInputRef} type="file" onChange={handleProfilePhotoChange} />
              
              <Button fullWidth onClick={() => fileInputRef.current?.click()} variant="contained" sx={{ background: 'linear-gradient(135deg, #00E5FF 0%, #00BCD4 100%)', color: '#050816', fontWeight: 'bold', py: 1.5, mb: 2 }}>
                Upload from Gallery
              </Button>
              
              {profilePhoto && (
                <Button fullWidth onClick={handleProfileSubmit} variant="outlined" disabled={loading} sx={{ color: '#00E5FF', borderColor: '#00E5FF', fontWeight: 'bold', py: 1.5, mb: 2 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Setup'}
                </Button>
              )}

              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                <Lock fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }}/> Your data is 100% secure
              </Typography>
            </Box>
          )}

        </Paper>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;
