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
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  BarChart,
  Timeline,
  AccountBalance,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Visibility,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { io } from 'socket.io-client';

const TradingManagement = () => {
  const [socket, setSocket] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    pair: '',
    type: '',
    status: '',
    sortBy: 'newest',
  });

  const [marketSettings, setMarketSettings] = useState({
    tradingEnabled: true,
    maintenanceMode: false,
    maxLeverage: 100,
    fundingRate: 0.01,
    takerFee: 0.1,
    makerFee: 0.05,
  });

  const [chartData, setChartData] = useState([]);

  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'];

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/trades', { params: filters });
      setTrades(response.data.trades || []);
      setFilteredTrades(response.data.trades || []);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/stats');
      const { tradeStats24h } = response.data;
      
      // Process stats for chart (last 24 hours)
      const data = [];
      const now = new Date();
      const currentHour = now.getHours();
      
      // Initialize map for 24 hours
      const statsMap = {};
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(currentHour - i);
        const hour = d.getHours();
        const date = d.toISOString().split('T')[0]; // Simple date key
        const key = `${date}-${hour}`;
        
        statsMap[key] = {
          hour: `${hour}:00`,
          volume: 0,
          trades: 0,
          fees: 0
        };
        data.push(statsMap[key]); // Preserve order
      }
      
      if (tradeStats24h) {
        tradeStats24h.forEach(stat => {
           const key = `${stat._id.date}-${stat._id.hour}`;
           // We need to match precise date/hour. 
           // Our map keys are approximate if date changes. 
           // Let's simplify: just map received stats to nearest hour in our list?
           // Actually, exact match is better.
           
           // If we find the key in our initialized map, update it
           if (statsMap[key]) {
             statsMap[key].volume = stat.volume;
             statsMap[key].trades = stat.count;
             statsMap[key].fees = stat.fees;
           }
        });
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const filterTrades = useCallback(() => {
    let filtered = [...trades];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trade =>
        (trade.userId?.fullName || '').toLowerCase().includes(term) ||
        (trade.userId?.email || '').toLowerCase().includes(term) ||
        trade._id.toLowerCase().includes(term) ||
        trade.pair.toLowerCase().includes(term)
      );
    }
    if (filters.pair) filtered = filtered.filter(trade => trade.pair === filters.pair);
    if (filters.type) filtered = filtered.filter(trade => trade.type === filters.type);
    if (filters.status) filtered = filtered.filter(trade => trade.status === filters.status);
    if (activeTab === 1) filtered = filtered.filter(t => t.status === 'pending');
    if (activeTab === 2) filtered = filtered.filter(t => t.status === 'completed');
    if (activeTab === 3) filtered = filtered.filter(t => t.type === 'long' || t.type === 'buy');
    if (activeTab === 4) filtered = filtered.filter(t => t.type === 'short' || t.type === 'sell');
    filtered.sort((a, b) => {
      if (filters.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (filters.sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (filters.sortBy === 'pnl_high') return (b.pnl || 0) - (a.pnl || 0);
      if (filters.sortBy === 'pnl_low') return (a.pnl || 0) - (b.pnl || 0);
      if (filters.sortBy === 'volume') return (b.total || 0) - (a.total || 0);
      return 0;
    });
    setFilteredTrades(filtered);
  }, [trades, searchTerm, filters, activeTab]);



  useEffect(() => {
    // Connect to socket
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('adminToken') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to trading socket');
      newSocket.emit('join_admin');
    });

    newSocket.on('new_trade', (trade) => {
      toast.success(`New ${trade.type} trade placed`);
      setTrades(prev => [trade, ...prev]);
      fetchStats();
    });

    newSocket.on('trade_updated', (updatedTrade) => {
      setTrades(prev => prev.map(t => t._id === updatedTrade._id ? updatedTrade : t));
      if (selectedTrade?._id === updatedTrade._id) {
        setSelectedTrade(updatedTrade);
      }
      fetchStats();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchTrades();
    fetchStats();
  }, [fetchTrades, fetchStats]);

  useEffect(() => {
    filterTrades();
  }, [filterTrades]);

  const handleMenuClick = (event, trade) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewTrade = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleCloseTrade = async () => {
    if (!selectedTrade) return;
    setProcessingId(selectedTrade._id);
    try {
      await api.put(`/api/trading/order/${selectedTrade._id}/status`, { status: 'completed' });
      toast.success(`Trade closed successfully`);
      fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close trade');
    } finally {
      setProcessingId(null);
      handleMenuClose();
    }
  };

  const handleCancelTrade = async () => {
    if (!selectedTrade) return;
    setProcessingId(selectedTrade._id);
    try {
      await api.put(`/api/trading/order/${selectedTrade._id}/status`, { status: 'cancelled' });
      toast.success(`Trade cancelled`);
      fetchTrades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel trade');
    } finally {
      setProcessingId(null);
      handleMenuClose();
    }
  };

  const handleEditTrade = () => {
    toast(`Edit trade ${selectedTrade?._id}`);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    return type === 'long' ? 'success' : 'error';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCrypto = (amount) => {
    return amount.toFixed(4);
  };

  const calculateTotalVolume = () => {
    return trades.reduce((sum, trade) => sum + (trade.amount * trade.entryPrice), 0);
  };

  const calculateTotalFees = () => {
    return trades.reduce((sum, trade) => sum + (trade.amount * trade.entryPrice * 0.001), 0);
  };

  const handleSettingChange = (key, value) => {
    setMarketSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`Setting ${key} updated to ${value}`);
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
            {change && (
              <Typography variant="caption" sx={{ color: change >= 0 ? '#00D395' : '#FF6B6B' }}>
                {change >= 0 ? '+' : ''}{change}% from yesterday
              </Typography>
            )}
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
            Trading Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage all trading activity
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTrades}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
          >
            Export Data
          </Button>
          <Button
            variant="outlined"
            startIcon={marketSettings.tradingEnabled ? <Pause /> : <PlayArrow />}
            onClick={() => handleSettingChange('tradingEnabled', !marketSettings.tradingEnabled)}
            color={marketSettings.tradingEnabled ? 'success' : 'error'}
          >
            {marketSettings.tradingEnabled ? 'Pause Trading' : 'Resume Trading'}
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Trades"
            value={trades.length.toLocaleString()}
            icon={<Timeline />}
            color="#4361EE"
            change="+4.5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Volume"
            value={`$${trades.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}`}
            icon={<AccountBalance />}
            color="#00D395"
            change="+12.3%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Trades"
            value={trades.filter(t => t.status === 'active').length.toString()}
            icon={<PlayArrow />}
            color="#7209B7"
            change="+2.1%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Fees"
            value={`$${trades.reduce((sum, t) => sum + (t.fee || 0), 0).toLocaleString()}`}
            icon={<BarChart />}
            color="#FF6B6B"
            change="+8.7%"
          />
        </Grid>
      </Grid>

      {/* Trading Volume Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            24-Hour Trading Volume
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#131A2E', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                  formatter={(value) => [formatCurrency(value), 'Volume']}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#00D395" 
                  strokeWidth={2}
                  dot={{ fill: '#00D395', r: 4 }}
                  activeDot={{ r: 6, fill: '#00D395' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>



      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search trades by user, ID, or pair..."
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

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Pair</InputLabel>
              <Select
                value={filters.pair}
                label="Pair"
                onChange={(e) => setFilters({ ...filters, pair: e.target.value })}
              >
                <MenuItem value="">All Pairs</MenuItem>
                {pairs.map(pair => (
                  <MenuItem key={pair} value={pair}>{pair}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="long">Long</MenuItem>
                <MenuItem value="short">Short</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="pnl_high">Highest PnL</MenuItem>
                <MenuItem value="pnl_low">Lowest PnL</MenuItem>
                <MenuItem value="volume">Largest Volume</MenuItem>
              </Select>
            </FormControl>

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
          <Tab label="All Trades" />
          <Tab label="Open Positions" />
          <Tab label="Closed Trades" />
          <Tab label="Long Positions" />
          <Tab label="Short Positions" />
        </Tabs>
      </Paper>

      {/* Trades Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Trade History ({filteredTrades.length})
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredTrades.length === 0 ? (
            <Alert severity="info">
              No trades found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trade ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Pair</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Entry Price</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Leverage</TableCell>
                    <TableCell>Profit/Loss</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trade._id.slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#00D395', width: 32, height: 32 }}>
                            {(trade.userId?.fullName || trade.userName || 'U').charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{trade.userId?.fullName || trade.userName || 'Unknown'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trade.pair}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: getTypeColor(trade.type) + '20',
                            color: getTypeColor(trade.type),
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">${(trade.entryPrice || 0).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${trade.leverage}x`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: (trade.pnl || 0) >= 0 ? '#00D395' : '#FF6B6B',
                            fontWeight: 'bold',
                          }}
                        >
                          {(trade.pnl || 0).toLocaleString()} ({(trade.pnlPercentage || 0).toFixed(2)}%)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.status}
                          size="small"
                          color={getStatusColor(trade.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, trade)}
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

      {/* Trade Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewTrade}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        {selectedTrade?.status === 'pending' && (
          <MenuItem onClick={handleCloseTrade} disabled={processingId === selectedTrade?._id}>
            <Stop sx={{ mr: 2 }} />
            {processingId === selectedTrade?._id ? 'Closing...' : 'Close Trade'}
          </MenuItem>
        )}
        {selectedTrade?.status === 'pending' && (
          <MenuItem onClick={handleCancelTrade} disabled={processingId === selectedTrade?._id}>
            <Cancel sx={{ mr: 2 }} />
            {processingId === selectedTrade?._id ? 'Cancelling...' : 'Cancel Trade'}
          </MenuItem>
        )}
        <MenuItem onClick={handleEditTrade}>
          <Edit sx={{ mr: 2 }} />
          Edit Trade
        </MenuItem>
      </Menu>

      {/* View Trade Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTrade && (
          <>
            <DialogTitle>
              Trade Details - {selectedTrade.id}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#00D395', width: 60, height: 60, fontSize: 24 }}>
                      {(selectedTrade.userId?.fullName || selectedTrade.userName || 'U').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedTrade.userId?.fullName || selectedTrade.userName || 'Unknown'}
                      </Typography>
                       <Typography variant="body2" color="text.secondary">
                         User ID: {(typeof selectedTrade.userId === 'object' ? selectedTrade.userId?._id : selectedTrade.userId) || 'N/A'}
                       </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={selectedTrade.type.toUpperCase()} 
                          color={getTypeColor(selectedTrade.type)}
                        />
                        <Chip 
                          label={selectedTrade.status} 
                          color={getStatusColor(selectedTrade.status)}
                        />
                        <Chip label={`${selectedTrade.leverage}x`} />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Trade Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Pair:</strong> {selectedTrade.pair}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Entry Price:</strong> {formatCurrency(selectedTrade.entryPrice)}
                      </Typography>
                      {selectedTrade.exitPrice && (
                        <Typography variant="body2">
                          <strong>Exit Price:</strong> {formatCurrency(selectedTrade.exitPrice)}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Amount:</strong> {formatCrypto(selectedTrade.amount)} ({selectedTrade.pair.split('/')[0]})
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Value:</strong> {formatCurrency(selectedTrade.amount * selectedTrade.entryPrice)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Performance
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ '& > *': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>P&L:</strong> 
                        <span style={{ 
                          color: selectedTrade.pnl >= 0 ? '#00D395' : '#FF6B6B',
                          marginLeft: 8,
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(selectedTrade.pnl || 0)}
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        <strong>P&L Percentage:</strong> 
                        <span style={{ 
                          color: selectedTrade.pnlPercentage >= 0 ? '#00D395' : '#FF6B6B',
                          marginLeft: 8
                        }}>
                          {selectedTrade.pnlPercentage?.toFixed(2)}%
                        </span>
                      </Typography>
                      <Typography variant="body2">
                        <strong>Opened:</strong> {new Date(selectedTrade.openedAt).toLocaleString()}
                      </Typography>
                      {selectedTrade.closedAt && (
                        <Typography variant="body2">
                          <strong>Closed:</strong> {new Date(selectedTrade.closedAt).toLocaleString()}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Duration:</strong> {selectedTrade.duration}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity={selectedTrade.status === 'open' ? 'info' : 'success'}>
                    <Typography variant="body2">
                      <strong>Trade Status:</strong> {selectedTrade.status.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {selectedTrade.status === 'open' 
                        ? 'This position is currently open and active.' 
                        : 'This trade has been completed and closed.'}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              {selectedTrade.status === 'open' && (
                <Button onClick={handleCloseTrade} variant="contained" color="primary">
                  Close Trade
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TradingManagement;