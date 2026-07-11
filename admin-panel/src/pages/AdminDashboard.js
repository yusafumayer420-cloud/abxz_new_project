import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AccountBalanceWallet,
  Security,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Refresh,
  Download,
  BarChart,
  PieChart,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import api from '../api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUsers: 0,
    verifiedUsers: 0,
    totalTrades: 0,
    completedTrades: 0,
    totalVolume: 0,
    todayTrades: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });

  const [signupData, setSignupData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/stats');
      const data = response.data;
      setStats(data);
      
      // Update signup chart data
      if (data.signups) {
        setSignupData(data.signups.map(s => ({
          day: s._id,
          users: s.count
        })));
      }

      // Update Pie Data from real asset distribution
      if (data.assetDistribution) {
        setPieData([
          { name: 'USDT', value: data.assetDistribution.usdt || 0, color: '#26A17B' },
        ]);
      }

      // Use real recent activities
      if (data.recentActivities) {
        setRecentActivities(data.recentActivities.map(act => ({
          ...act,
          time: new Date(act.time).toLocaleString()
        })));
      }

    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      change: `Total Registered`,
      icon: <People sx={{ fontSize: 40, color: '#4361EE' }} />,
      color: '#4361EE',
      progress: 100,
    },
    {
      title: 'Total Volume',
      value: `$${(stats.totalVolume || 0).toLocaleString()}`,
      change: `Today: ${stats.todayTrades || 0}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      color: '#8b5cf6',
      progress: 60,
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades?.toLocaleString() || '0',
      change: `${stats.completedTrades || 0} Completed`,
      icon: <TrendingUp sx={{ fontSize: 40, color: '#7209B7' }} />,
      color: '#7209B7',
      progress: stats.totalTrades ? (stats.completedTrades / stats.totalTrades) * 100 : 0,
    },
    {
      title: 'KYC Verified',
      value: stats.verifiedUsers?.toLocaleString() || '0',
      change: `${((stats.verifiedUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% Ratio`,
      icon: <Security sx={{ fontSize: 40, color: '#f43f5e' }} />,
      color: '#f43f5e',
      progress: stats.totalUsers ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0,
    },
  ];

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your platform today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>

        </Box>
      </Box>



      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="admin-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {stat.change}
                      </Typography>
                    </Box>
                    {stat.icon}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stat.progress} 
                    sx={{ 
                      bgcolor: `${stat.color}20`,
                      height: 6,
                      borderRadius: 3,
                      '& .MuiLinearProgress-bar': { 
                        bgcolor: stat.color,
                        borderRadius: 3,
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Volume Chart */}
        <Grid item xs={12} md={8}>
          <Card className="admin-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Trading Volume Overview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip icon={<Timeline />} label="Volume" size="small" />
                  <Chip icon={<People />} label="Users" size="small" variant="outlined" />
                </Box>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#4361EE" 
                      strokeWidth={2}
                      dot={{ fill: '#4361EE', r: 4 }}
                      activeDot={{ r: 6, fill: '#4361EE' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Asset Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="80%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
                  {pieData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%', mr: 1 }} />
                      <Typography variant="caption">{item.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities & Quick Stats */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card className="admin-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Activities
                </Typography>
                <Button size="small">View All</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
                              {activity.user.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {activity.user}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{activity.action}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {activity.amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status}
                            size="small"
                            color={getStatusColor(activity.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quick Stats
              </Typography>
              <Box sx={{ '& > *': { mb: 2 } }}>
                {[
                  { label: 'Total Users', value: stats.totalUsers || '0', change: '', icon: '👥' },
                  { label: 'Avg. Trade Size', value: `$${(stats.quickStats?.avgTradeSize || 0).toLocaleString()}`, change: '', icon: '💰' },
                  { label: 'Support Tickets', value: stats.quickStats?.openSupportTickets || '0', change: '', icon: '💬' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ fontSize: 24 }}>{stat.icon}</Box>
                        <Box>
                          <Typography variant="body2">{stat.label}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </Box>
                      {stat.change && (
                        <Chip
                          label={stat.change}
                          size="small"
                          color={stat.change.startsWith('+') ? 'success' : 'error'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(0, 211, 149, 0.05)', border: '1px solid rgba(0, 211, 149, 0.1)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  System Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    All systems operational
                  </Typography>
                  <Chip label="Normal" size="small" color="success" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;