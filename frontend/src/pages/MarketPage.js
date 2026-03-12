import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  FilterList,
  Refresh,
  ShowChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket from '../socket';

const MarketPage = ({ marketData }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(['BTC/USDT', 'ETH/USDT']);
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filteredPairs, setFilteredPairs] = useState([]);

  const tabs = ['Cryptos', 'ETF', 'Forex', 'US Stocks', 'HK Stock'];

  const mockCryptoData = [
    { pair: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104, marketCap: 1380000000000 },
    { pair: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210, marketCap: 254000000000 },
    { pair: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412, marketCap: 46000000000 },
    { pair: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594, marketCap: 28000000000 },
    { pair: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066, marketCap: 13000000000 },
    { pair: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567, marketCap: 14000000000 },
    { pair: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267, marketCap: 8300000000 },
    { pair: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235, marketCap: 4100000000 },
    { pair: 'BNB/USDT', price: 585.42, change24h: 0.45, volume: 1487543210, marketCap: 90000000000 },
    { pair: 'MATIC/USDT', price: 0.78, change24h: 1.23, volume: 425678432, marketCap: 7200000000 },
    { pair: 'AVAX/USDT', price: 36.85, change24h: -0.89, volume: 325678432, marketCap: 13600000000 },
    { pair: 'LINK/USDT', price: 14.32, change24h: 2.15, volume: 456783210, marketCap: 8400000000 },
  ];

  const mockETFData = [
    { symbol: 'Germany ETF', price: 1.86, change24h: 0.59, volume: 12543210 },
    { symbol: 'Nikkei ETF', price: 1.46, change24h: 0.07, volume: 9876543 },
    { symbol: 'Nasdaq ETF', price: 1.935, change24h: 0.05, volume: 23456789 },
    { symbol: 'France CAC40', price: 1.668, change24h: 0.37, volume: 8765432 },
    { symbol: 'Gold ETF', price: 7.588, change24h: -0.42, volume: 34567890 },
  ];


  useEffect(() => {
    let data = [];
    switch (activeTab) {
      case 0:
        data = marketData.length > 0 ? marketData.filter(p => !p.symbol.includes('ETF')) : mockCryptoData;
        break;
      case 1:
        data = marketData.length > 0 ? marketData.filter(p => p.symbol.includes('ETF')) : mockETFData;
        break;
      default:
        data = marketData.length > 0 ? marketData : mockCryptoData;
    }

    // Map symbol to pair for UI consistency if needed
    data = data.map(item => ({
      ...item,
      pair: item.symbol || item.pair,
      marketCap: item.marketCap || (item.price * 1000000) // Mock market cap if missing
    }));

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => 
        item.pair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    data.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'volume') {
        aValue = a.volume;
        bValue = b.volume;
      } else if (sortBy === 'price') {
        aValue = a.price;
        bValue = b.price;
      } else if (sortBy === 'change') {
        aValue = a.change24h;
        bValue = b.change24h;
      } else if (sortBy === 'marketCap') {
        aValue = a.marketCap || 0;
        bValue = b.marketCap || 0;
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Move favorites to top
    if (activeTab === 0) {
      data.sort((a, b) => {
        const aIsFavorite = favorites.includes(a.pair);
        const bIsFavorite = favorites.includes(b.pair);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
    }

    setFilteredPairs(data);
  }, [activeTab, searchTerm, sortBy, sortOrder, favorites, marketData]);

  const toggleFavorite = (pair) => {
    setFavorites(prev => 
      prev.includes(pair) 
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const handleTradeClick = (pair) => {
    navigate(`/trading/${pair.replace('/', '-')}`);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ? '▼' : '▲';
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2 }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Markets
      </Typography>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search pairs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                ×
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Market Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total Market Cap
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              $2.4T
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              24h Volume
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              $64B
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              BTC Dominance
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              51.2%
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontSize: '0.75rem', fontWeight: 'bold', minWidth: 'auto', px: 2 },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab} />
          ))}
        </Tabs>
      </Paper>

      {/* Sort Controls */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={() => handleSort('volume')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Vol {getSortIcon('volume')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('price')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Price {getSortIcon('price')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('change')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            24h % {getSortIcon('change')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSort('marketCap')}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
          >
            Cap {getSortIcon('marketCap')}
        </Button>
      </Box>
    )}

    {/* Market List */}
    <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '40%', fontWeight: 'bold' }}>Pair</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>24h %</TableCell>

          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPairs.map((item, index) => (
            <TableRow 
              key={item.pair || item.symbol} 
              hover
              sx={{ 
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0, 211, 149, 0.05)' }
              }}
              onClick={() => activeTab === 0 && handleTradeClick(item.pair)}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {activeTab === 0 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.pair);
                      }}
                      sx={{ mr: 1 }}
                    >
                      {favorites.includes(item.pair) ? (
                        <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                      ) : (
                        <StarBorder sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {item.pair || item.symbol}
                    </Typography>
                    {item.volume && (
                      <Typography variant="caption" color="text.secondary">
                        Vol: ${(item.volume / 1000000).toFixed(1)}M
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  ${typeof item.price === 'number' ? item.price.toLocaleString('en-US', {
                    minimumFractionDigits: item.price < 1 ? 4 : 2,
                    maximumFractionDigits: item.price < 1 ? 4 : 2
                  }) : item.price}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={`${item.change24h >= 0 ? '+' : ''}${item.change24h}%`}
                  size="small"
                  sx={{
                    bgcolor: item.change24h >= 0 ? 'rgba(0, 211, 149, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    color: item.change24h >= 0 ? '#00D395' : '#FF6B6B',
                    fontWeight: 'bold',
                    minWidth: 70,
                  }}
                  icon={item.change24h >= 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Hot Pairs Section */}
    {activeTab === 0 && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
          Hot Pairs
        </Typography>
        <Grid container spacing={2}>
          {mockCryptoData.slice(0, 4).map((pair, index) => (
            <Grid item xs={6} key={index}>
              <motion.div whileHover={{ y: -5 }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {pair.pair}
                      </Typography>
                      <Chip
                        label={`${pair.change24h}%`}
                        size="small"
                        sx={{
                          bgcolor: pair.change24h >= 0 ? 'rgba(0, 211, 149, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                          color: pair.change24h >= 0 ? '#00D395' : '#FF6B6B',
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ${pair.price.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Vol: ${(pair.volume / 1000000).toFixed(1)}M
                    </Typography>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                      onClick={() => handleTradeClick(pair.pair)}
                    >
                      Trade
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </>
    )}

    {/* ETF Info Section */}
    {activeTab === 1 && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
          ETF Trading Hours
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  US Market Hours
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  09:30 - 16:00 EST
                </Typography>
              </Box>
              <Chip label="Open" color="success" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  HK Market Hours
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  09:30 - 16:00 HKT
                </Typography>
              </Box>
              <Chip label="Closed" color="default" size="small" />
            </Box>
          </CardContent>
        </Card>
      </>
    )}
  </Container>
);
};

export default MarketPage;