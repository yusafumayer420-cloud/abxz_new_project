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
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AccountBalanceWallet,
  SwapVert,
  Security,
  SupportAgent,
  BarChart,
  ArrowUpward,
  ArrowDownward,
  Newspaper,
  OpenInNew,
  ChevronLeft,
  ChevronRight,
  CurrencyExchange,
  Article,
  HeadsetMic,
  VerifiedUser,
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
    { title: 'Exchange', icon: <CurrencyExchange />, desc: 'Spot trading', path: '/trading', color: '#00D395', gradient: 'linear-gradient(135deg, rgba(0,211,149,0.15), rgba(0,211,149,0.05))' },
    { title: 'News', icon: <Article />, desc: 'Market updates', path: '/news', color: '#4361EE', gradient: 'linear-gradient(135deg, rgba(67,97,238,0.15), rgba(67,97,238,0.05))' },
    { title: 'Support', icon: <HeadsetMic />, desc: '24/7 help', path: '/support', color: '#F72585', gradient: 'linear-gradient(135deg, rgba(247,37,133,0.15), rgba(247,37,133,0.05))' },
    { title: 'KYC', icon: <VerifiedUser />, desc: 'Verify identity', path: '/profile', state: { activeTab: 2 }, color: '#FFB703', gradient: 'linear-gradient(135deg, rgba(255,183,3,0.15), rgba(255,183,3,0.05))' },
  ]);

  useEffect(() => {
    setBalance(user?.wallet?.usdt || 0);
  }, [user, marketData]);

  const getCoinIcon = (symbol) => {
    const base = symbol.split('/')[0].toLowerCase();
    return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${base}.svg`;
  };

  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const slides = [
    {
      title: 'Start Trading Today',
      subtitle: 'Access 10+ live crypto markets with real-time Binance prices.',
      cta: 'Trade Now',
      path: '/trading',
      gradient: 'linear-gradient(135deg, #00D395 0%, #0a9e70 100%)',
      icon: '🚀',
    },
    {
      title: 'Zero Hidden Fees',
      subtitle: 'Transparent pricing. No surprises. Keep more of your profits.',
      cta: 'View Markets',
      path: '/markets',
      gradient: 'linear-gradient(135deg, #4361EE 0%, #7209B7 100%)',
      icon: '💎',
    },
    {
      title: 'Bank-Grade Security',
      subtitle: 'Your funds are protected with enterprise-level encryption.',
      cta: 'Learn More',
      path: '/profile',
      gradient: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
      icon: '🔒',
    },
    {
      title: 'Verify Your Identity',
      subtitle: 'Complete KYC to unlock full withdrawal limits and all features.',
      cta: 'Verify Now',
      path: '/profile',
      state: { activeTab: 2 },
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      icon: '✅',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideDirection(1);
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (dir) => {
    setSlideDirection(dir);
    setSlideIndex((prev) => (prev + dir + slides.length) % slides.length);
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news');
        setNews(response.data.slice(0, 6));
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
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card 
          onClick={() => navigate('/history')}
          sx={{ 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            cursor: 'pointer'
          }}
        >
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
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={3} sm={3} key={index}>
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
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {features.map((feature, index) => (
          <Grid item xs={3} sm={3} key={index}>
            <motion.div whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Card
                onClick={() => navigate(feature.path, { state: feature.state })}
                sx={{
                  height: 115,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: feature.gradient,
                  border: '1px solid',
                  borderColor: `${feature.color}30`,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: `${feature.color}80`,
                    boxShadow: `0 8px 24px ${feature.color}25`,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: '10px !important' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `${feature.color}20`,
                      mb: 0.75,
                      '& svg': { fontSize: 22, color: feature.color },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Market Overview */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Market Overview
        </Typography>
        <Button 
          size="small" 
          onClick={() => navigate('/markets')}
          sx={{ color: '#00D395', textTransform: 'none', fontWeight: 'bold' }}
        >
          View All
        </Button>
      </Box>
      <Card>
        <CardContent>
          {marketData.slice(0, 10).map((coin, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: index < 9 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    width: 40,
                    height: 40,
                    border: '1px solid rgba(255,255,255,0.1)',
                    p: '4px',
                  }}
                >
                  <img
                    src={getCoinIcon(coin.symbol)}
                    alt={coin.symbol}
                    crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = coin.symbol.split('/')[0].charAt(0);
                    }}
                  />
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

      {/* Promotional Slideshow */}
      <Box sx={{ position: 'relative', mt: 3, mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <AnimatePresence initial={false} custom={slideDirection} mode="wait">
          <motion.div
            key={slideIndex}
            custom={slideDirection}
            variants={{
              enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <Box
              sx={{
                background: slides[slideIndex].gradient,
                borderRadius: 3,
                p: 3,
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h2" sx={{ fontSize: 36, mb: 0.5 }}>
                  {slides[slideIndex].icon}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', lineHeight: 1.2 }}>
                  {slides[slideIndex].title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', mt: 0.5 }}>
                  {slides[slideIndex].subtitle}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => navigate(slides[slideIndex].path, { state: slides[slideIndex].state })}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
                    textTransform: 'none',
                    fontSize: '0.75rem',
                  }}
                >
                  {slides[slideIndex].cta} →
                </Button>
                {/* Dot indicators */}
                <Box sx={{ display: 'flex', gap: 0.6 }}>
                  {slides.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => { setSlideDirection(i > slideIndex ? 1 : -1); setSlideIndex(i); }}
                      sx={{
                        width: i === slideIndex ? 18 : 7,
                        height: 7,
                        borderRadius: 4,
                        bgcolor: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </motion.div>
        </AnimatePresence>
        {/* Prev / Next arrows */}
        <IconButton
          size="small"
          onClick={() => goToSlide(-1)}
          sx={{
            position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.3)', color: '#fff', p: 0.4,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => goToSlide(1)}
          sx={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.3)', color: '#fff', p: 0.4,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

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