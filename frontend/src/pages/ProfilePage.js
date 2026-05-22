import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Security,
  VerifiedUser,
  CameraAlt,
  Edit,
  Save,
  Lock,
  QrCode,
  History,
  Receipt,
  Logout,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Pending,
  Upload,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import SecureImage from '../components/SecureImage';

const ProfilePage = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (location.state && typeof location.state.activeTab === 'number') {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({ idFront: false, idBack: false, selfie: false });
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    city: '',
    zipCode: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [kycDocuments, setKycDocuments] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [transactions, setTransactions] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [trades, setTrades] = useState([]);
  const [activitySubTab, setActivitySubTab] = useState(0);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        address: user.address || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
      });
      setVerificationStatus(user.kycStatus || 'unverified');
      setKycDocuments(user.kycDocuments || {});
    }
    
    fetchTransactions();
    fetchSecurityLogs();
    fetchTrades();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data.slice(0, 20)); // Fetch more to allow for filtering
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const response = await axios.get('/api/users/security-logs');
      setSecurityLogs(response.data.slice(0, 10)); // just recent
    } catch (error) {
      console.error('Failed to fetch security logs');
    }
  };

  const formatDevice = (device) => {
    if (!device) return 'Unknown';
    if (device.includes('Windows')) return 'Windows PC';
    if (device.includes('iPhone')) return 'iPhone';
    if (device.includes('Android')) return 'Android Device';
    if (device.includes('Macintosh')) return 'MacBook';
    if (device.includes('Linux')) return 'Linux PC';
    return 'Web Browser';
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get('/api/trading/my-trades');
      const allTrades = [...response.data.positions, ...response.data.openOrders];
      allTrades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTrades(allTrades.slice(0, 10)); // just recent
    } catch (error) {
      console.error('Failed to fetch trades');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('/api/users/profile', formData);
      updateUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    // Basic validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Update the user context with the new passwordChangedAt if returned, 
      // or just refresh user info if needed. For now just clear and close.
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      toast.success('Password changed successfully');
      
      // Refresh user data to get updated passwordChangedAt
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleKYCUpload = async (documentType, file) => {
    if (!file) return;
    if (verificationStatus === 'verified') {
      toast.error('Your account is already verified.');
      return;
    }

    setUploading(true);
    setUploadingDoc(prev => ({ ...prev, [documentType]: true }));
    try {
      const formData = new FormData();
      formData.append('type', documentType);
      formData.append('document', file);

      const response = await axios.post('/api/users/kyc/upload', formData, {
        timeout: 120000
      });

      // Update local state with the preview/file
      setKycDocuments(prev => ({
        ...prev,
        [documentType]: response.data.url || URL.createObjectURL(file)
      }));
      
      setVerificationStatus(response.data.status);
      
      // Update global user context so other components (like FundsPage) know KYC status
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('KYC Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      setUploadingDoc(prev => ({ ...prev, [documentType]: false }));
    }
  };


  const handleFileSelect = (documentType, event) => {
    const file = event.target.files[0];
    // Reset file input so the same file can be re-selected
    event.target.value = '';
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      handleKYCUpload(documentType, file);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Profile picture must be less than 50MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile', file);

      const response = await axios.post('/api/users/profile-picture', formData);

      // Update user context
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
      
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Profile Picture Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getVerificationIcon = () => {
    switch(verificationStatus) {
      case 'verified': return <VerifiedUser sx={{ color: '#00D395' }} />;
      case 'pending': return <Pending sx={{ color: '#FFC107' }} />;
      case 'rejected': return <Error sx={{ color: '#FF6B6B' }} />;
      case 'unverified': return <Upload sx={{ color: '#90CAF9' }} />;
      default: return <Pending />;
    }
  };

  const getVerificationColor = () => {
    switch(verificationStatus) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'unverified': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastChanged = (dateString) => {
    if (!dateString) return 'Never';
    const lastChanged = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastChanged);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    }
    return `${diffDays} days ago`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
              fontWeight: 'bold',
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 1.5, sm: 3 }
            },
          }}
        >
          <Tab label="Profile" icon={<Person />} iconPosition="start" />
          <Tab label="Security" icon={<Security />} iconPosition="start" />
          <Tab label="Verification" icon={<VerifiedUser />} iconPosition="start" />
          <Tab label="Activity" icon={<History />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column - Avatar & Basic Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <Avatar
                    src={user?.profilePicture}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 48,
                      bgcolor: '#00D395',
                      mb: 2,
                      border: '4px solid rgba(0, 211, 149, 0.2)'
                    }}
                  >
                    {!user?.profilePicture && (user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase())}
                  </Avatar>
                  <label htmlFor="profile-pic-upload">
                    <input
                      accept="image/*"
                      id="profile-pic-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleProfilePictureUpload}
                      disabled={uploading}
                    />
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        bgcolor: 'rgba(0, 211, 149, 0.9)',
                        color: 'white',
                        '&:hover': { bgcolor: '#00D395' },
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        width: 36,
                        height: 36
                      }}
                      disabled={uploading}
                    >
                      {uploading ? <CircularProgress size={20} color="inherit" /> : <CameraAlt sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </label>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {user?.fullName || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.email}
                </Typography>

                <Chip
                  label={`KYC: ${verificationStatus}`}
                  color={getVerificationColor()}
                  icon={getVerificationIcon()}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ textAlign: 'left', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Account Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Member Since"
                        secondary={user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Trading Level"
                        secondary="Verified Trader"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Referral Code"
                        secondary={user?.referralCode || 'N/A'}
                      />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Edit Profile */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Personal Information</Typography>
                  <Button
                    startIcon={editing ? <Save /> : <Edit />}
                    onClick={editing ? handleSaveProfile : () => setEditing(true)}
                    variant={editing ? 'contained' : 'outlined'}
                  >
                    {editing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-full-name"
                      name="fullName"
                      autoComplete="name"
                      fullWidth
                      label="Full Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-email"
                      name="email"
                      autoComplete="email"
                      fullWidth
                      label="Email"
                      value={formData.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-phone"
                      name="phone"
                      autoComplete="tel"
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-country"
                      name="country"
                      autoComplete="country-name"
                      fullWidth
                      label="Country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      id="profile-address"
                      name="address"
                      autoComplete="street-address"
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editing}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-city"
                      name="city"
                      autoComplete="address-level2"
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="profile-zip-code"
                      name="zipCode"
                      autoComplete="postal-code"
                      fullWidth
                      label="ZIP Code"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      disabled={!editing}
                    />
                  </Grid>
                </Grid>

                {editing && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Your profile information is used for account verification and communication.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Security Settings
                </Typography>

                {/* Password Section */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'stretch', sm: 'center' }, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 2 
                  }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Password
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last changed {formatLastChanged(user?.passwordChangedAt)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Lock />}
                      onClick={() => setShowChangePassword(true)}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 3,
                        width: { xs: '100%', sm: 'auto' },
                        boxShadow: '0 4px 14px 0 rgba(0, 211, 149, 0.39)',
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                  <Divider />
                </Box>


                {/* Security Logs */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Security Activity
                  </Typography>
                  <List>
                    {securityLogs.map((log) => (
                      <ListItem key={log._id || log.id} divider>
                        <ListItemIcon>
                          {log.status === 'success' ? (
                            <CheckCircle sx={{ color: '#00D395' }} />
                          ) : (
                            <Error sx={{ color: '#FF6B6B' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {log.action.replace('_', ' ').toUpperCase()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(log.createdAt)}
                              </Typography>
                            </Box>
                          }
                          secondary={`${formatDevice(log.device)} • ${log.ipAddress}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Verification Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6">Identity Verification</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complete KYC to unlock all features
                    </Typography>
                  </Box>
                  <Chip
                    label={verificationStatus.toUpperCase()}
                    color={getVerificationColor()}
                    icon={getVerificationIcon()}
                    size="medium"
                  />
                </Box>

                {verificationStatus === 'verified' ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Your identity has been verified. You can now access all trading features.
                  </Alert>
                ) : verificationStatus === 'pending' ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Your documents are under review. This usually takes 1-2 business days.
                  </Alert>
                ) : verificationStatus === 'rejected' ? (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Your verification was rejected. Please upload new documents.
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Please upload your identity documents to verify your account and unlock all features.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  {/* ID Front */}
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center', height: '100%', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                        ID Front
                      </Typography>
                      <Box
                        sx={{
                          height: { xs: 100, sm: 120 },
                          border: '2px dashed',
                          borderColor: kycDocuments.idFront ? 'transparent' : 'rgba(255,255,255,0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {kycDocuments.idFront ? (
                          <SecureImage
                            isMotion={true}
                            src={kycDocuments.idFront}
                            alt="ID Front"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 32, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="id-front"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('idFront', e)}
                        disabled={verificationStatus === 'verified'}
                      />
                      <label htmlFor="id-front">
                        <Button
                          component="span"
                          variant="contained"
                          size="medium"
                          disabled={uploadingDoc.idFront || verificationStatus === 'verified'}
                          fullWidth
                          sx={{ 
                            textTransform: 'none',
                            bgcolor: kycDocuments.idFront ? 'rgba(0, 211, 149, 0.1)' : 'primary.main',
                            color: kycDocuments.idFront ? '#00D395' : 'white',
                            '&:hover': { bgcolor: kycDocuments.idFront ? 'rgba(0, 211, 149, 0.2)' : 'primary.dark' }
                          }}
                        >
                          {uploadingDoc.idFront ? 'Uploading...' : kycDocuments.idFront ? (verificationStatus === 'verified' ? 'Verified' : 'Change Front') : 'Upload Front'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>

                  {/* ID Back */}
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center', height: '100%', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                        ID Back
                      </Typography>
                      <Box
                        sx={{
                          height: { xs: 100, sm: 120 },
                          border: '2px dashed',
                          borderColor: kycDocuments.idBack ? 'transparent' : 'rgba(255,255,255,0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {kycDocuments.idBack ? (
                          <SecureImage
                            isMotion={true}
                            src={kycDocuments.idBack}
                            alt="ID Back"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 32, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="id-back"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('idBack', e)}
                        disabled={verificationStatus === 'verified'}
                      />
                      <label htmlFor="id-back">
                        <Button
                          component="span"
                          variant="contained"
                          size="medium"
                          disabled={uploadingDoc.idBack || verificationStatus === 'verified'}
                          fullWidth
                          sx={{ 
                            textTransform: 'none',
                            bgcolor: kycDocuments.idBack ? 'rgba(0, 211, 149, 0.1)' : 'primary.main',
                            color: kycDocuments.idBack ? '#00D395' : 'white',
                            '&:hover': { bgcolor: kycDocuments.idBack ? 'rgba(0, 211, 149, 0.2)' : 'primary.dark' }
                          }}
                        >
                          {uploadingDoc.idBack ? 'Uploading...' : kycDocuments.idBack ? (verificationStatus === 'verified' ? 'Verified' : 'Change Back') : 'Upload Back'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>

                  {/* Selfie */}
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center', height: '100%', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                        Selfie
                      </Typography>
                      <Box
                        sx={{
                          height: { xs: 100, sm: 120 },
                          border: '2px dashed',
                          borderColor: kycDocuments.selfie ? 'transparent' : 'rgba(255,255,255,0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {kycDocuments.selfie ? (
                          <SecureImage
                            isMotion={true}
                            src={kycDocuments.selfie}
                            alt="Selfie"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 32, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="selfie"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('selfie', e)}
                        disabled={verificationStatus === 'verified'}
                      />
                      <label htmlFor="selfie">
                        <Button
                          component="span"
                          variant="contained"
                          size="medium"
                          disabled={uploadingDoc.selfie || verificationStatus === 'verified'}
                          fullWidth
                          sx={{ 
                            textTransform: 'none',
                            bgcolor: kycDocuments.selfie ? 'rgba(0, 211, 149, 0.1)' : 'primary.main',
                            color: kycDocuments.selfie ? '#00D395' : 'white',
                            '&:hover': { bgcolor: kycDocuments.selfie ? 'rgba(0, 211, 149, 0.2)' : 'primary.dark' }
                          }}
                        >
                          {uploadingDoc.selfie ? 'Uploading...' : kycDocuments.selfie ? (verificationStatus === 'verified' ? 'Verified' : 'Change Selfie') : 'Upload Selfie'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Verification Guidelines:
                  </Typography>
                  <Typography variant="caption" component="div">
                    • All documents must be clear and legible<br/>
                    • ID must be government-issued (Passport, Driver's License, National ID)<br/>
                    • Selfie must clearly show your face and the ID document<br/>
                    • Documents must not be expired<br/>
                    • Processing time: 1-2 business days
                  </Typography>
                </Alert>

                {(verificationStatus === 'pending' || verificationStatus === 'unverified') && (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!kycDocuments.idFront || !kycDocuments.idBack || !kycDocuments.selfie || uploading}
                    sx={{ 
                      mt: 3,
                      bgcolor: '#00D395',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: '#00b884' },
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                    onClick={() => toast.success('Your documents are being reviewed. Please wait 1-2 business days.')}
                  >
                    {!kycDocuments.idFront || !kycDocuments.idBack || !kycDocuments.selfie 
                      ? 'Upload All Documents to Submit' 
                      : 'Submit for Verification'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Activity Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Recent Activity
                </Typography>

                <Tabs value={activitySubTab} onChange={(e, v) => setActivitySubTab(v)} sx={{ mb: 3 }}>
                  <Tab label="Transactions" />
                  <Tab label="Trades" />
                  <Tab label="Logins" />
                </Tabs>

                {activitySubTab === 0 && (
                  transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">No recent transactions</Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {transactions.filter(tx => tx.type !== 'trade').slice(0, 10).map((tx) => (
                        <ListItem 
                          key={tx._id || tx.id} 
                          divider 
                          sx={{ 
                            py: 2, 
                            px: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                {tx.type === 'deposit' ? (
                                  <CheckCircle sx={{ color: '#00D395', fontSize: 20 }} />
                                ) : (
                                  <Receipt sx={{ color: '#FF6B6B', fontSize: 20 }} />
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.currency}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: tx.type === 'deposit' ? '#00D395' : '#FF6B6B' }}>
                              {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(tx.createdAt || tx.date)}
                            </Typography>
                            <Chip
                              label={tx.status}
                              size="small"
                              color={
                                tx.status === 'completed' ? 'success' :
                                tx.status === 'pending' ? 'warning' : 'default'
                              }
                              sx={{ 
                                height: '20px', 
                                fontSize: '0.65rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )
                )}

                {activitySubTab === 1 && (
                  (trades.length === 0 && transactions.filter(tx => tx.type === 'trade').length === 0) ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">No recent trades</Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {[...trades, ...transactions.filter(tx => tx.type === 'trade')].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 10).map((trade) => (
                        <ListItem 
                          key={trade._id || trade.id} 
                          divider 
                          sx={{ 
                            py: 2, 
                            px: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                <History sx={{ color: '#4361EE', fontSize: 20 }} />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {trade.pair || trade.metadata?.pair || 'Trade USDT'}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: trade.type === 'buy' || trade.type === 'long' || trade.metadata?.outcome === 'win' ? '#00D395' : '#FF6B6B' }}>
                              {trade.type === 'buy' || trade.type === 'long' || trade.metadata?.outcome === 'win' ? '+' : '-'}{trade.amount} {trade.currency || 'USDT'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 } }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(trade.createdAt || trade.date)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {trade.price || trade.metadata?.price ? `Price: ${trade.price || trade.metadata?.price}` : 'MARKET'}
                              </Typography>
                            </Box>
                            <Chip
                              label={trade.status}
                              size="small"
                              color={
                                trade.status === 'completed' ? 'success' :
                                trade.status === 'pending' ? 'warning' : 'default'
                              }
                              sx={{ 
                                height: '20px', 
                                fontSize: '0.65rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )
                )}

                {activitySubTab === 2 && (
                  securityLogs.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">No recent logins</Typography>
                    </Box>
                  ) : (
                    <List>
                      {securityLogs.map((log) => (
                        <ListItem key={log._id || log.id} divider>
                          <ListItemIcon>
                            {log.status === 'success' ? (
                              <CheckCircle sx={{ color: '#00D395' }} />
                            ) : (
                              <Error sx={{ color: '#FF6B6B' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                  {log.action.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(log.createdAt)}
                                </Typography>
                              </Box>
                            }
                            secondary={`${formatDevice(log.device)} • ${log.ipAddress}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      

      {/* Logout Button */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{ px: 4 }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onClose={() => setShowChangePassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            id="profile-current-password"
            name="currentPassword"
            autoComplete="current-password"
            fullWidth
            label="Current Password"
            type={showPassword.current ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}>
                    {showPassword.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="profile-new-password"
            name="newPassword"
            autoComplete="new-password"
            fullWidth
            label="New Password"
            type={showPassword.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
                    {showPassword.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="profile-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            fullWidth
            label="Confirm New Password"
            type={showPassword.confirm ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
                    {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangePassword(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;