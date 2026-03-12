import React, { useContext, useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AccountBalanceWallet,
  SwapVert,
  Security,
  SupportAgent,
  BarChart,
  Notifications,
  ArrowUpward,
  ArrowDownward,
  Newspaper,
  OpenInNew,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BackgroundAnimation from '../components/BackgroundAnimation';

const HomePage = ({ marketData }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [quickActions] = useState([
    { icon: <AccountBalanceWallet />, label: 'Deposit', color: '#00D395', path: '/funds', state: { activeTab: 0 } },
    { icon: <SwapVert />, label: 'Withdraw', color: '#FF6B6B', path: '/funds', state: { activeTab: 1 } },
    { icon: <BarChart />, label: 'Trade', color: '#4361EE', path: '/trading' },
    { icon: <Security />, label: 'Security', color: '#7209B7', path: '/profile', state: { activeTab: 1 } },
  ]);

  const [features] = useState([
    { title: 'Asset Management', icon: '📊', desc: 'Manage your portfolio', path: '/assets', isComingSoon: true },
    { title: 'AI Trading', icon: '🤖', desc: 'Automated strategies', path: '/ai-trading', isComingSoon: true },
    { title: 'Lending', icon: '💰', desc: 'Earn interest', path: '/lending', isComingSoon: true },
    { title: 'Exchange', icon: '🔄', desc: 'Spot trading', path: '/trading' },
    { title: 'News', icon: '📰', desc: 'Market updates', path: '/news' },
    { title: 'Support', icon: '💬', desc: '24/7 help', path: '/support' },
  ]);

  useEffect(() => {
    setBalance(user?.wallet?.usdt || 0);
  }, [user, marketData]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news');
        setNews(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <>
      <BackgroundAnimation />
      <Container maxWidth="sm" sx={{ pb: 8, pt: 2, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Crok<span style={{ color: '#00D395' }}>Trade</span>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.fullName || 'Trader'} 👋
        </Typography>
      </Box>

      {/* Balance Card */}
      <motion.div whileHover={{ scale: 1.02 }}>
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Typography color="white" variant="body2">
              Total Balance
            </Typography>
            <Typography color="white" variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip
                label="+2.5% Today"
                size="small"
                sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <IconButton size="small" sx={{ color: 'white' }}>
                <Notifications />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={3} key={index}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                fullWidth
                sx={{
                  height: 80,
                  flexDirection: 'column',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 3,
                }}
                onClick={() => navigate(action.path, { state: action.state })}
              >
                <Box sx={{ color: action.color, mb: 1 }}>{action.icon}</Box>
                <Typography variant="caption">{action.label}</Typography>
              </Button>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Features Grid */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Features
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {features.map((feature, index) => (
          <Grid item xs={4} key={index}>
            <motion.div whileHover={{ y: -5 }}>
              <Card 
                onClick={() => {
                  if (feature.isComingSoon || !feature.path) {
                    toast(`${feature.title} is coming soon!`, {
                      icon: '🚀',
                      style: {
                        borderRadius: '10px',
                        background: '#131A2E',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      },
                    });
                  } else {
                    navigate(feature.path);
                  }
                }}
                sx={{ 
                  height: 120, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{feature.icon}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Market Overview */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Market Overview
      </Typography>
      <Card>
        <CardContent>
          {marketData.slice(0, 3).map((coin, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(0,211,149,0.1)', width: 36, height: 36 }}>
                  {coin.symbol.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {coin.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vol: ${(coin.volume / 1000000).toFixed(1)}M
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ${coin.price.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: coin.change24h >= 0 ? '#00D395' : '#FF6B6B' }}
                >
                  {coin.change24h >= 0 ? <ArrowUpward sx={{ fontSize: 12 }} /> : <ArrowDownward sx={{ fontSize: 12 }} />}
                  {Math.abs(coin.change24h)}%
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Latest News Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
        <Typography variant="h6">Latest News</Typography>
        <Button 
          size="small" 
          onClick={() => navigate('/news')}
          sx={{ color: '#00D395' }}
        >
          View All
        </Button>
      </Box>

      {loadingNews ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {news.map((item, index) => (
            <Grid item xs={12} key={index}>
              <motion.div whileHover={{ x: 5 }}>
                <Card 
                  onClick={() => window.open(item.link, '_blank')}
                  sx={{ 
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    '&:hover': { background: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#00D395', fontWeight: 'bold' }}>
                        {item.source}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: '500', lineHeight: 1.2 }}>
                      {item.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
    </>
  );
};

export default HomePage;