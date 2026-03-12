import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { People, SwapVert } from '@mui/icons-material';
import {
  Search,
  FilterList,
  MoreVert,
  PersonAdd,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Cancel,
  Visibility,
  Download,
  Refresh,
  Email,
  Phone,
  AccountBalanceWallet,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    kycStatus: '',
    deliveryTradeEnabled: true,
    wallet: {
      usdt: 0
    }
  });
  const [filters, setFilters] = useState({
    status: '',
    kyc: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filters, activeTab, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.fullName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.phone || '').includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'active') filtered = filtered.filter(user => !user.isBanned);
      if (filters.status === 'suspended') filtered = filtered.filter(user => user.isBanned);
    }

    // KYC filter
    if (filters.kyc) {
      filtered = filtered.filter(user => user.kycStatus === filters.kyc);
    }

    // Tab filter
    if (activeTab === 1) filtered = filtered.filter(u => !u.isBanned);
    if (activeTab === 3) filtered = filtered.filter(u => u.isBanned);
    if (activeTab === 4) filtered = filtered.filter(u => u.kycStatus === 'pending');

    // Sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (filters.sortBy === 'balance') {
        const balanceA = a.wallet?.usdt || 0;
        const balanceB = b.wallet?.usdt || 0;
        return balanceB - balanceA;
      } else if (filters.sortBy === 'trades') {
        return (b.tradingStats?.totalTrades || 0) - (a.tradingStats?.totalTrades || 0);
      }
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
    setEditData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      kycStatus: user.kycStatus || 'pending',
      deliveryTradeEnabled: user.deliveryTradeEnabled !== undefined ? user.deliveryTradeEnabled : true,
      wallet: {
        usdt: user.wallet?.usdt || 0,
      }
    });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewUser = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleEditUser = () => {
    setEditDialog(true);
    handleMenuClose();
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/api/admin/users/${selectedUser._id}`, editData);
      toast.success('User updated successfully');
      setEditDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm(`Are you sure you want to delete user ${selectedUser.fullName}?`)) {
      try {
        await api.delete(`/api/admin/users/${selectedUser._id}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
    handleMenuClose();
  };

  const handleBlockUser = async () => {
    try {
      if (selectedUser.isBanned) {
        await api.post(`/api/admin/users/${selectedUser._id}/unban`);
        toast.success('User unblocked');
      } else {
        await api.post(`/api/admin/users/${selectedUser._id}/ban`, { reason: 'Violation of terms' });
        toast.success('User blocked');
      }
      fetchUsers();
    } catch (error) {
      toast.error('Action failed');
    }
    handleMenuClose();
  };

  const handleVerifyKYC = async () => {
    try {
      await api.put(`/api/admin/users/${selectedUser._id}/kyc`, { status: 'verified' });
      toast.success('KYC verified');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to verify KYC');
    }
    handleMenuClose();
  };

  const getStatusColor = (user) => {
    if (user.isBanned) return 'error'; // Suspended
    return 'success'; // Active
  };

  const getStatusLabel = (user) => {
    if (user.isBanned) return 'suspended';
    return 'active';
  };

  const getKYCColor = (status) => {
    switch(status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`;
  };

  const getUserBalance = (user) => {
    return user.wallet?.usdt || 0;
  };

  const StatsCard = ({ title, value, icon, color, change }) => (
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
            <Typography variant="caption" sx={{ color: change >= 0 ? '#00D395' : '#FF6B6B' }}>
              {change >= 0 ? '+' : ''}{change}% from last month
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
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all user accounts and permissions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
          >
            Add User
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={users.length}
            icon={<People />}
            color="#4361EE"
            change={12.5}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="KYC Verified"
            value={users.filter(u => u.kycStatus === 'verified').length}
            icon={<Security />}
            color="#7209B7"
            change={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Balance"
            value={formatCurrency(users.reduce((sum, u) => sum + getUserBalance(u), 0))}
            icon={<AccountBalanceWallet />}
            color="#FF6B6B"
            change={-3.1}
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search users by name, email, or phone..."
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
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="KYC Status"
              value={filters.kyc}
              onChange={(e) => setFilters({ ...filters, kyc: e.target.value })}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
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
              <MenuItem value="balance">Highest Balance</MenuItem>
              <MenuItem value="trades">Most Trades</MenuItem>
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
          <Tab label="All Users" />
          <Tab label="Active" />
          <Tab label="Suspended" />
          <Tab label="KYC Pending" />
        </Tabs>
      </Paper>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Users ({filteredUsers.length})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredUsers.length === 0 ? (
            <Alert severity="info">
              No users found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>KYC</TableCell>
                    <TableCell>Delivery Trade</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Trades</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#00D395' }}>
                            {getInitials(user.fullName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {user.fullName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user._id.substring(user._id.length - 6)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="small" />
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone fontSize="small" />
                            {user.phone || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(user)}
                          size="small"
                          color={getStatusColor(user)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.kycStatus}
                          size="small"
                          color={getKYCColor(user.kycStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<SwapVert sx={{ fontSize: 14 }} />}
                          label={user.deliveryTradeEnabled !== false ? 'WIN' : 'LOSS'}
                          size="small"
                          color={user.deliveryTradeEnabled !== false ? 'success' : 'error'}
                          sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(getUserBalance(user))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.tradingStats?.totalTrades || 0}
                        </Typography>
                        <Typography variant="caption" color={(user.tradingStats?.profitLoss || 0) >= 0 ? '#00D395' : '#FF6B6B'}>
                          {formatCurrency(user.tradingStats?.profitLoss || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, user)}
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

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditUser}>
          <Edit sx={{ mr: 2 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleVerifyKYC}>
          <CheckCircle sx={{ mr: 2 }} />
          Verify KYC
        </MenuItem>
        <MenuItem onClick={handleBlockUser}>
          <Block sx={{ mr: 2 }} />
          {selectedUser?.isBanned ? 'Unblock User' : 'Block User'}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: '#FF6B6B' }}>
          <Delete sx={{ mr: 2 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* View User Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              User Details: {selectedUser.fullName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#00D395', width: 80, height: 80, fontSize: 32 }}>
                      {getInitials(selectedUser.fullName)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.fullName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        User ID: {selectedUser._id}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={getStatusLabel(selectedUser)} color={getStatusColor(selectedUser)} />
                        <Chip label={selectedUser.kycStatus} color={getKYCColor(selectedUser.kycStatus)} />
                        <Chip label={selectedUser.role} color="primary" />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contact Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedUser.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Account Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Join Date:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Trades:</strong> {selectedUser.tradingStats?.totalTrades || 0}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Profit/Loss:</strong> 
                        <span style={{ color: (selectedUser.tradingStats?.profitLoss || 0) >= 0 ? '#00D395' : '#FF6B6B', marginLeft: 8 }}>
                          {formatCurrency(selectedUser.tradingStats?.profitLoss || 0)}
                        </span>
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Wallet Balance
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {formatCurrency(getUserBalance(selectedUser))}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                      <Chip label={`USDT: ${selectedUser.wallet?.usdt || 0}`} variant="outlined" size="small" />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              <Button variant="contained" onClick={handleEditUser}>
                Edit User
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User: {selectedUser?.fullName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={editData.fullName}
              onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <TextField
              select
              label="KYC Status"
              fullWidth
              value={editData.kycStatus}
              onChange={(e) => setEditData({ ...editData, kycStatus: e.target.value })}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={editData.deliveryTradeEnabled}
                  onChange={(e) => setEditData({ ...editData, deliveryTradeEnabled: e.target.checked })}
                  color={editData.deliveryTradeEnabled ? 'success' : 'error'}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SwapVert sx={{ fontSize: 16, color: editData.deliveryTradeEnabled ? '#00D395' : '#FF6B6B' }} />
                  <Typography variant="body2" sx={{ color: editData.deliveryTradeEnabled ? '#00D395' : '#FF6B6B', fontWeight: 'bold' }}>
                    Delivery Trade Control: {editData.deliveryTradeEnabled ? 'Force Win' : 'Force Loss'}
                  </Typography>
                </Box>
              }
            />
            
              <Grid item xs={12}>
                <TextField
                  label="USDT Balance"
                  type="number"
                  fullWidth
                  value={editData.wallet.usdt}
                  onChange={(e) => setEditData({
                    ...editData,
                    wallet: { ...editData.wallet, usdt: parseFloat(e.target.value) || 0 }
                  })}
                />
              </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;