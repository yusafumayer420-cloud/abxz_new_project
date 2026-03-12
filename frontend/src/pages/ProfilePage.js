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
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState('pending');
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
      setVerificationStatus(user.kycStatus || 'pending');
      setKycDocuments(user.kycDocuments || {});
    }
    
    fetchTransactions();
    fetchSecurityLogs();
    fetchTrades();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data.slice(0, 10)); // just recent
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);

      const response = await axios.post('/api/users/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state with the preview/file
      setKycDocuments(prev => ({
        ...prev,
        [documentType]: response.data.url || URL.createObjectURL(file)
      }));
      
      setVerificationStatus('pending');
      
      // Update global user context so other components (like FundsPage) know KYC is pending
      const userRes = await axios.get('/api/users/profile');
      updateUser(userRes.data);
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('KYC Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };


  const handleFileSelect = (documentType, event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      handleKYCUpload(documentType, file);
    }
  };

  const getVerificationIcon = () => {
    switch(verificationStatus) {
      case 'verified': return <VerifiedUser sx={{ color: '#00D395' }} />;
      case 'pending': return <Pending sx={{ color: '#FFC107' }} />;
      case 'rejected': return <Error sx={{ color: '#FF6B6B' }} />;
      default: return <Pending />;
    }
  };

  const getVerificationColor = () => {
    switch(verificationStatus) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
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
    <Container maxWidth="md" sx={{ py: 4, pb: 8 }}>
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
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 'bold' },
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
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 48,
                      bgcolor: '#00D395',
                      mb: 2,
                    }}
                  >
                    {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      bgcolor: 'rgba(0, 211, 149, 0.1)',
                      '&:hover': { bgcolor: 'rgba(0, 211, 149, 0.2)' },
                    }}
                  >
                    <CameraAlt />
                  </IconButton>
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
                      fullWidth
                      label="Country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
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
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                      <ListItem key={log.id} divider>
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
                          secondary={`${log.device} • ${log.ipAddress}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button fullWidth variant="text" sx={{ mt: 2 }}>
                    View All Activity
                  </Button>
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
                ) : (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Your verification was rejected. Please upload new documents.
                  </Alert>
                )}

                <Grid container spacing={3}>
                  {/* ID Front */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        ID Card Front
                      </Typography>
                      <Box
                        sx={{
                          height: 200,
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
                          <motion.img
                            src={kycDocuments.idFront}
                            alt="ID Front"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 48, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="id-front"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('idFront', e)}
                      />
                      <label htmlFor="id-front">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<Upload />}
                          disabled={uploading}
                          fullWidth
                        >
                          {uploading ? 'Uploading...' : kycDocuments.idFront ? 'Change' : 'Upload'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>

                  {/* ID Back */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        ID Card Back
                      </Typography>
                      <Box
                        sx={{
                          height: 200,
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
                          <motion.img
                            src={kycDocuments.idBack}
                            alt="ID Back"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 48, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="id-back"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('idBack', e)}
                      />
                      <label htmlFor="id-back">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<Upload />}
                          disabled={uploading}
                          fullWidth
                        >
                          {uploading ? 'Uploading...' : kycDocuments.idBack ? 'Change' : 'Upload'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>

                  {/* Selfie */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Selfie with ID
                      </Typography>
                      <Box
                        sx={{
                          height: 200,
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
                          <motion.img
                            src={kycDocuments.selfie}
                            alt="Selfie"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        ) : (
                          <Upload sx={{ fontSize: 48, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <input
                        type="file"
                        accept="image/*"
                        id="selfie"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect('selfie', e)}
                      />
                      <label htmlFor="selfie">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<Upload />}
                          disabled={uploading}
                          fullWidth
                        >
                          {uploading ? 'Uploading...' : kycDocuments.selfie ? 'Change' : 'Upload'}
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

                {verificationStatus === 'pending' && (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 3 }}
                    onClick={() => toast.success('Documents submitted for verification')}
                  >
                    Submit for Verification
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
                    <List>
                      {transactions.map((tx) => (
                        <ListItem key={tx._id || tx.id} divider>
                          <ListItemIcon>
                            {tx.type === 'deposit' ? (
                              <CheckCircle sx={{ color: '#00D395' }} />
                            ) : tx.type === 'withdrawal' ? (
                              <Receipt sx={{ color: '#FF6B6B' }} />
                            ) : (
                              <History sx={{ color: '#4361EE' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.currency}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {tx.amount} {tx.currency}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {tx.toAddress ? `To: ${tx.toAddress.substring(0, 16)}...` : tx.metadata?.pair || ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(tx.createdAt || tx.date)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={tx.status}
                            size="small"
                            color={
                              tx.status === 'completed' ? 'success' :
                              tx.status === 'pending' ? 'warning' : 'default'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )
                )}

                {activitySubTab === 1 && (
                  trades.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">No recent trades</Typography>
                    </Box>
                  ) : (
                    <List>
                      {trades.map((trade) => (
                        <ListItem key={trade._id || trade.id} divider>
                          <ListItemIcon>
                            <History sx={{ color: '#4361EE' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {trade.pair}
                                </Typography>
                                <Typography variant="body2" color={trade.type === 'buy' || trade.type === 'long' ? '#00D395' : '#FF6B6B'}>
                                  {trade.type.toUpperCase()} {trade.amount}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Price: {trade.price}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(trade.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={trade.status}
                            size="small"
                            color={
                              trade.status === 'completed' ? 'success' :
                              trade.status === 'pending' ? 'warning' : 'default'
                            }
                            sx={{ ml: 2 }}
                          />
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
                            secondary={`${log.device} • ${log.ipAddress}`}
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