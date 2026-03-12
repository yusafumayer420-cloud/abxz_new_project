import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  Download,
  HourglassEmpty,
  Security,
  VerifiedUser,
  GppBad,
  Image,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';

const KYCVerification = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'newest',
  });


  useEffect(() => {
    fetchKYCRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, filters, activeTab]);

  const fetchKYCRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      const users = response.data.users || [];
      setKycRequests(users);
      setFilteredRequests(users);
    } catch (error) {
      toast.error('Failed to fetch KYC requests');
      console.error('Error fetching KYC requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...kycRequests];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.userName.toLowerCase().includes(term) ||
        request.userEmail.toLowerCase().includes(term) ||
        request.userId.toString().includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    // Document type filter
    if (filters.type) {
      filtered = filtered.filter(request => request.documentType === filters.type);
    }

    // Tab filter
    if (activeTab === 1) filtered = filtered.filter(r => r.status === 'pending');
    if (activeTab === 2) filtered = filtered.filter(r => r.status === 'under_review');
    if (activeTab === 3) filtered = filtered.filter(r => r.status === 'approved');
    if (activeTab === 4) filtered = filtered.filter(r => r.status === 'rejected');

    // Sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.submittedDate) - new Date(a.submittedDate);
      } else if (filters.sortBy === 'oldest') {
        return new Date(a.submittedDate) - new Date(b.submittedDate);
      }
      return 0;
    });

    setFilteredRequests(filtered);
  };

  const handleMenuClick = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleApprove = async () => {
    try {
      await api.put(`/api/admin/kyc/${selectedRequest._id}`, { status: 'verified' });
      toast.success(`KYC for ${selectedRequest.fullName} approved`);
      fetchKYCRequests();
      handleMenuClose();
      setViewDialog(false);
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/admin/kyc/${selectedRequest._id}`, { status: 'rejected' });
      toast.error(`KYC for ${selectedRequest.fullName} rejected`);
      fetchKYCRequests();
      handleMenuClose();
      setViewDialog(false);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const handleRequestReview = async () => {
    toast('Review requested');
    handleMenuClose();
  };

  const handleViewRequest = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <HourglassEmpty />;
      case 'under_review': return <Security />;
      case 'approved': return <VerifiedUser />;
      case 'rejected': return <GppBad />;
      default: return null;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const StatsCard = ({ title, value, icon, color, subtitle }) => (
    <Card className="admin-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            KYC Verification
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and verify user identity documents
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchKYCRequests}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
          >
            Export Reports
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending KYC"
            value={kycRequests.filter(r => r.kycStatus === 'pending').length.toString()}
            icon={<HourglassEmpty />}
            color="#FFC107"
            change="+5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Verified Today"
            value="0"
            icon={<VerifiedUser />}
            color="#00D395"
            change="+12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Rejected"
            value={kycRequests.filter(r => r.kycStatus === 'rejected').length.toString()}
            icon={<GppBad />}
            color="#FF6B6B"
            change="+2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={kycRequests.length.toString()}
            icon={<Security />}
            color="#4361EE"
            change="+45"
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, email, or user ID..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Document Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Passport">Passport</MenuItem>
              <MenuItem value="Driver License">Driver License</MenuItem>
              <MenuItem value="National ID">National ID</MenuItem>
              <MenuItem value="Residence Permit">Residence Permit</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </TextField>

            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 'bold' },
          }}
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Under Review" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {/* KYC Requests Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              KYC Requests ({filteredRequests.length})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredRequests.length === 0 ? (
            <Alert severity="info">
              No KYC requests found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Review Note</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#4361EE' }}>
                            {(request.fullName || request.userName || 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {request.fullName || request.userName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.kycDetails?.idType || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.kycStatus}
                          size="small"
                          color={getStatusColor(request.kycStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.kycDetails?.country || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {request.kycDetails?.reviewNote || 'No notes'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, request)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* KYC Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewRequest}>
          <Visibility sx={{ mr: 2 }} />
          View Documents
        </MenuItem>
        <MenuItem onClick={handleApprove}>
          <CheckCircle sx={{ mr: 2, color: '#00D395' }} />
          Approve KYC
        </MenuItem>
        <MenuItem onClick={handleRequestReview}>
          <Security sx={{ mr: 2, color: '#4361EE' }} />
          Request Review
        </MenuItem>
        <MenuItem onClick={handleReject}>
          <Cancel sx={{ mr: 2, color: '#FF6B6B' }} />
          Reject KYC
        </MenuItem>
      </Menu>

      {/* View Documents Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              KYC Documents - {selectedRequest.fullName || selectedRequest.userName || 'User'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: '#00D395', width: 60, height: 60, fontSize: 24 }}>
                      {(selectedRequest.fullName || selectedRequest.userName || 'U').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedRequest.fullName || selectedRequest.userName || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRequest.email} • {selectedRequest.kycDetails?.country || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={selectedRequest.kycDetails?.idType || 'N/A'} size="small" />
                        <Chip 
                          label={selectedRequest.kycStatus} 
                          size="small" 
                          color={getStatusColor(selectedRequest.kycStatus)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Submitted Documents
                  </Typography>
                  <ImageList cols={3} gap={16}>
                    <ImageListItem>
                      <img
                        src={selectedRequest.kycDocuments?.idFront}
                        alt="ID Front"
                        loading="lazy"
                        style={{ borderRadius: 8 }}
                      />
                      <ImageListItemBar
                        title="ID Front"
                        subtitle="Primary document"
                      />
                    </ImageListItem>
                    <ImageListItem>
                      <img
                        src={selectedRequest.kycDocuments?.idBack}
                        alt="ID Back"
                        loading="lazy"
                        style={{ borderRadius: 8 }}
                      />
                      <ImageListItemBar
                        title="ID Back"
                        subtitle="Back side"
                      />
                    </ImageListItem>
                    <ImageListItem>
                      <img
                        src={selectedRequest.kycDocuments?.selfie}
                        alt="Selfie"
                        loading="lazy"
                        style={{ borderRadius: 8 }}
                      />
                      <ImageListItemBar
                        title="Selfie with ID"
                        subtitle="Face verification"
                      />
                    </ImageListItem>
                  </ImageList>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Review Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      label="Review Notes"
                      multiline
                      rows={3}
                      placeholder="Add your review notes here..."
                      defaultValue={selectedRequest.kycDetails?.reviewNote}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        label="Document Type"
                        value={selectedRequest.kycDetails?.idType || 'N/A'}
                        fullWidth
                      />
                      <TextField
                        label="Country"
                        value={selectedRequest.kycDetails?.country || 'N/A'}
                        fullWidth
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Verification Guidelines:</strong>
                    </Typography>
                    <Typography variant="caption" component="div">
                      1. Check that all documents are clear and legible<br />
                      2. Verify that the ID is not expired<br />
                      3. Ensure the selfie matches the ID photo<br />
                      4. Confirm all personal information matches<br />
                      5. Look for signs of tampering or editing
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Cancel</Button>
              <Button onClick={handleReject} color="error" variant="outlined">
                Reject
              </Button>
              <Button onClick={handleRequestReview} variant="outlined">
                Request Changes
              </Button>
              <Button onClick={handleApprove} variant="contained">
                Approve KYC
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default KYCVerification;