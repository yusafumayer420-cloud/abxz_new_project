import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Slider,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Timeline,
  CancelOutlined,
  AccountBalanceWallet,
  AccessTime,
  EmojiEvents,
  History,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Delivery contract time slots definition
// ---------------------------------------------------------------------------
const DELIVERY_SLOTS = [
  { seconds: 60,   label: '60s',   profit: 13, minAmount: 500 },
  { seconds: 180,  label: '180s',  profit: 15, minAmount: 10000 },
  { seconds: 300,  label: '300s',  profit: 20, minAmount: 30000 },
  { seconds: 600,  label: '600s',  profit: 27, minAmount: 50000 },
  { seconds: 900,  label: '900s',  profit: 75, minAmount: 100000 },
  { seconds: 1800, label: '1800s', profit: 90, minAmount: 300000 },
];

// ---------------------------------------------------------------------------
// CountdownTimer component
// ---------------------------------------------------------------------------
const CountdownTimer = ({ expiresAt, onExpired }) => {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.ceil((end - now) / 1000));
    setRemaining(diff);
    setTotal(diff + 1);

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpired && onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Time remaining</Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: remaining < 10 ? '#FF6B6B' : '#00D395' }}>
          {mins > 0 ? `${mins}m ` : ''}{secs}s
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: remaining < 10 ? '#FF6B6B' : '#00D395',
          }
        }}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// DeliveryOrderBook component (matches screenshot style)
// ---------------------------------------------------------------------------
const DeliveryOrderBook = ({ orderBook, price }) => {
  // Calculate max amount for depth bars
  const maxAmount = Math.max(
    ...orderBook.asks.map(a => a.amount),
    ...orderBook.bids.map(b => b.amount),
    1
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Price(USDT)</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Number(BTC)</Typography>
      </Box>

      {/* Asks (Sells) - Red */}
      <Box sx={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px', mb: 1 }}>
        {orderBook.asks.slice(0, 7).map((ask, i) => (
          <Box key={i} sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', px: 1, py: '2px', cursor: 'pointer' }}>
            <Box sx={{ 
              position: 'absolute', right: 0, top: 0, bottom: 0, 
              width: `${(ask.amount / maxAmount) * 100}%`, 
              bgcolor: 'rgba(255, 107, 107, 0.15)',
              zIndex: 0,
              transition: 'width 0.3s'
            }} />
            <Typography variant="caption" sx={{ color: '#FF6B6B', fontWeight: 'bold', zIndex: 1, fontSize: '0.75rem' }}>
              {ask.price.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#fff', zIndex: 1, fontSize: '0.75rem' }}>
              {ask.amount.toFixed(4)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Current Price Middle Section */}
      <Box sx={{ py: 2, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', my: 1 }}>
        <Typography variant="h6" sx={{ color: '#FF6B6B', fontWeight: 'bold', lineHeight: 1 }}>
          {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          ≈ {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </Typography>
      </Box>

      {/* Bids (Buys) - Green */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {orderBook.bids.slice(0, 7).map((bid, i) => (
          <Box key={i} sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', px: 1, py: '2px', cursor: 'pointer' }}>
            <Box sx={{ 
              position: 'absolute', right: 0, top: 0, bottom: 0, 
              width: `${(bid.amount / maxAmount) * 100}%`, 
              bgcolor: 'rgba(0, 211, 149, 0.15)',
              zIndex: 0,
              transition: 'width 0.3s'
            }} />
            <Typography variant="caption" sx={{ color: '#00D395', fontWeight: 'bold', zIndex: 1, fontSize: '0.75rem' }}>
              {bid.price.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#fff', zIndex: 1, fontSize: '0.75rem' }}>
              {bid.amount.toFixed(4)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// DeliveryTab component
// ---------------------------------------------------------------------------
const DeliveryTab = ({ price, socket, user, orderBook }) => {
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [posTab, setPosTab] = useState(0); // 0=hold, 1=history
  const [activeTrades, setActiveTrades] = useState([]);
  const [historyTrades, setHistoryTrades] = useState([]);

  const fetchDeliveryTrades = useCallback(async () => {
    try {
      const res = await axios.get('/api/trading/delivery-trades');
      setActiveTrades(res.data.active || []);
      setHistoryTrades(res.data.history || []);
    } catch (e) {
      console.error('Delivery trades fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryTrades();
  }, [fetchDeliveryTrades]);

  useEffect(() => {
    if (!socket) return;

    socket.on('trade_updated', (updated) => {
      if (updated.tradeMode === 'delivery' &&
          (updated.userId === user?._id || updated.userId?._id === user?._id)) {
        fetchDeliveryTrades();
        if (updated.outcome === 'win') {
          toast.success(`🎉 Trade Won! +${updated.profitAmount?.toFixed(2)} USDT`);
        } else if (updated.outcome === 'loss') {
          toast.error('❌ Trade Lost');
        }
      }
    });

    socket.on('balance_updated', () => {
      // parent will re-fetch via its own listener; here just refresh trades
      fetchDeliveryTrades();
    });

    return () => {
      socket.off('trade_updated');
      socket.off('balance_updated');
    };
  }, [socket, user, fetchDeliveryTrades]);

  const handleTrade = async (side) => {
    const amtNum = parseFloat(amount);
    if (!user) { toast.error('Please login to trade'); return; }
    if (!amount || isNaN(amtNum) || amtNum <= 0) { toast.error('Enter a valid amount'); return; }
    if (amtNum < selectedSlot.minAmount) {
      toast.error(`Minimum amount for ${selectedSlot.label} is ${selectedSlot.minAmount.toLocaleString()} USDT`);
      return;
    }
    if (amtNum > (user?.wallet?.usdt || 0)) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/trading/delivery-order', {
        pair: 'BTC/USDT',
        type: side, // 'long' or 'short'
        deliverySeconds: selectedSlot.seconds,
        price: parseFloat(price),
        amount: amtNum,
      });
      toast.success(`${side === 'long' ? 'Buy Long' : 'Buy Short'} order placed! Expires in ${selectedSlot.label}`);
      setAmount('');
      fetchDeliveryTrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Left Side: Order Form */}
        <Grid item xs={12} md={7.5}>
          {/* Header */}
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>Cross</Typography>
            <Typography variant="caption" color="text.secondary">Delivery Contract</Typography>
          </Paper>

          {/* Delivery Time Slots */}
          <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold', letterSpacing: 1 }}>
              DELIVERY TIME
            </Typography>

            {/* Column headers */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5, pr: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Profit %</Typography>
            </Box>

            <Grid container spacing={1}>
              {DELIVERY_SLOTS.map((slot) => {
                const isSelected = selectedSlot.seconds === slot.seconds;
                return (
                  <Grid item xs={6} key={slot.seconds}>
                    <Box
                      onClick={() => setSelectedSlot(slot)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        border: `1px solid ${isSelected ? '#4361EE' : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? 'rgba(67,97,238,0.2)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': {
                          border: '1px solid rgba(67,97,238,0.5)',
                          background: 'rgba(67,97,238,0.1)',
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#fff' : 'text.secondary', fontSize: '0.8rem' }}>
                        {slot.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#00D395', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {slot.profit}~{slot.profit}%
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Amount input */}
          <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Minimum notice */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Minimum {selectedSlot.minAmount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>USDT</Typography>
            </Box>

            {/* Available balance */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: 'rgba(0,211,149,0.06)', borderRadius: 1, border: '1px solid rgba(0,211,149,0.15)' }}>
              <AccountBalanceWallet sx={{ color: '#00D395', fontSize: 16 }} />
              <Typography variant="caption" color="text.secondary">Available:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#00D395' }}>
                {(user?.wallet?.usdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Amount (USDT)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              sx={{ mb: 1.5 }}
              inputProps={{ min: selectedSlot.minAmount, step: '100' }}
              helperText={
                amount && parseFloat(amount) < selectedSlot.minAmount
                  ? `Minimum for ${selectedSlot.label} is ${selectedSlot.minAmount.toLocaleString()} USDT`
                  : `Profit: +${selectedSlot.profit}% | Timer: ${selectedSlot.label}`
              }
              error={!!amount && parseFloat(amount) < selectedSlot.minAmount}
            />

            {/* Quick percent buttons */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <Button
                  key={pct}
                  size="small"
                  variant="outlined"
                  onClick={() => setAmount(Math.floor((user?.wallet?.usdt || 0) * pct).toString())}
                  sx={{ flex: 1, fontSize: '0.7rem', borderColor: 'rgba(255,255,255,0.2)', py: 0.5 }}
                >
                  {pct * 100}%
                </Button>
              ))}
            </Box>

            {/* Selected slot summary */}
            <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(67,97,238,0.08)', border: '1px solid rgba(67,97,238,0.2)', borderRadius: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Timer</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4361EE' }}>
                    {selectedSlot.label}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Profit Rate</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#00D395' }}>
                    {selectedSlot.profit}%
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Est. Win</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#00D395' }}>
                    +{amount ? (parseFloat(amount || 0) * selectedSlot.profit / 100).toFixed(2) : '0.00'} USDT
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Buy Long / Buy Short */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={() => handleTrade('long')}
                  sx={{
                    bgcolor: '#00D395',
                    color: '#000',
                    fontWeight: 'bold',
                    py: 1.5,
                    fontSize: '0.9rem',
                    '&:hover': { bgcolor: '#00b87e' },
                    '&:disabled': { bgcolor: 'rgba(0,211,149,0.3)' },
                    borderRadius: 2,
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp fontSize="small" />
                      Buy Long
                    </Box>
                  )}
                </Button>
              </motion.div>

              <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled={loading}
                  onClick={() => handleTrade('short')}
                  sx={{
                    color: '#FF6B6B !important',
                    borderColor: '#FF6B6B !important',
                    backgroundColor: 'rgba(29, 27, 27, 0.4) !important',
                    fontWeight: 'bold',
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '50px',
                    textTransform: 'none',
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 107, 107, 0.1) !important',
                      borderColor: '#ff5252 !important'
                    },
                    '&:disabled': { 
                      color: 'rgba(255, 107, 107, 0.3) !important',
                      borderColor: 'rgba(255, 107, 107, 0.2) !important'
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Sell/Short'}
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Order Book */}
        <Grid item xs={12} md={4.5}>
          <Paper sx={{ p: 1, height: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <DeliveryOrderBook orderBook={orderBook} price={price} />
          </Paper>
        </Grid>
      </Grid>

      {/* Hold / Historical Positions */}
      <Box>
        <Tabs
          value={posTab}
          onChange={(e, v) => setPosTab(v)}
          variant="fullWidth"
          sx={{ mb: 1, '& .MuiTab-root': { fontSize: '0.8rem' } }}
        >
          <Tab label={`Hold position (${activeTrades.length})`} icon={<AccessTime sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label={`Historical position`} icon={<History sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>

        {posTab === 0 && (
          <Card>
            {activeTrades.length === 0 ? (
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <AccessTime sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">You currently have no positions.</Typography>
                <Typography variant="caption" color="text.secondary">Place a delivery order to open a position</Typography>
              </CardContent>
            ) : (
              <Box sx={{ p: 1 }}>
                {activeTrades.map((trade) => (
                  <Paper
                    key={trade._id}
                    sx={{ p: 2, mb: 1, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{trade.pair}</Typography>
                          <Chip
                            label={trade.type === 'long' ? 'LONG' : 'SHORT'}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              bgcolor: trade.type === 'long' ? 'rgba(0,211,149,0.15)' : 'rgba(255,107,107,0.15)',
                              color: trade.type === 'long' ? '#00D395' : '#FF6B6B',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Entry: ${trade.price.toLocaleString()} • Amount: {trade.total.toFixed(2)} USDT
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="#00D395" sx={{ fontWeight: 'bold' }}>
                          +{trade.profitPercent}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Est. +{(trade.total * trade.profitPercent / 100).toFixed(2)} USDT
                        </Typography>
                      </Box>
                    </Box>
                    <CountdownTimer
                      expiresAt={trade.expiresAt}
                      onExpired={fetchDeliveryTrades}
                    />
                  </Paper>
                ))}
              </Box>
            )}
          </Card>
        )}

        {posTab === 1 && (
          <Card>
            {historyTrades.length === 0 ? (
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <EmojiEvents sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No historical positions yet.</Typography>
              </CardContent>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pair</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Timer</TableCell>
                      <TableCell>Profit %</TableCell>
                      <TableCell>Outcome</TableCell>
                      <TableCell>P&L</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyTrades.map((trade) => (
                      <TableRow key={trade._id} hover>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{trade.pair}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trade.type === 'long' ? 'LONG' : 'SHORT'}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              bgcolor: trade.type === 'long' ? 'rgba(0,211,149,0.15)' : 'rgba(255,107,107,0.15)',
                              color: trade.type === 'long' ? '#00D395' : '#FF6B6B',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{trade.total?.toFixed(2)} USDT</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{trade.deliverySeconds}s</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="#00D395">{trade.profitPercent}%</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trade.outcome?.toUpperCase() || 'N/A'}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              bgcolor: trade.outcome === 'win' ? 'rgba(0,211,149,0.15)' : 'rgba(255,107,107,0.15)',
                              color: trade.outcome === 'win' ? '#00D395' : '#FF6B6B',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 'bold',
                              color: trade.outcome === 'win' ? '#00D395' : '#FF6B6B',
                            }}
                          >
                            {trade.outcome === 'win'
                              ? `+${trade.profitAmount?.toFixed(2)}`
                              : `-${trade.total?.toFixed(2)}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{new Date(trade.createdAt).toLocaleDateString()}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main TradingPage
// ---------------------------------------------------------------------------
const TradingPage = ({ socket }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [positionsTab, setPositionsTab] = useState(0);
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(70587.31);
  const [leverage, setLeverage] = useState(1);
  const [orderBook, setOrderBook] = useState({
    bids: [
      { price: 70568.87, amount: 1.68 },
      { price: 70566.57, amount: 0.78 },
      { price: 70564.81, amount: 2.33 },
      { price: 70562.15, amount: 5.12 },
      { price: 70558.42, amount: 1.05 },
      { price: 70551.11, amount: 8.44 },
      { price: 70545.99, amount: 3.21 },
    ],
    asks: [
      { price: 70562.91, amount: 0.76 },
      { price: 70562.85, amount: 16.36 },
      { price: 70562.82, amount: 7.83 },
      { price: 70563.15, amount: 2.45 },
      { price: 70565.44, amount: 11.21 },
      { price: 70568.12, amount: 4.88 },
      { price: 70572.55, amount: 1.15 },
    ],
  });

  const [positions, setPositions] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchMyTrades = async () => {
    try {
      const response = await axios.get('/api/trading/my-trades');
      setPositions(response.data.positions || []);
      setOpenOrders(response.data.openOrders || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  // Trades are fetched on mount

  useEffect(() => {
    fetchMyTrades();
    // fetchWalletBalance(); // Removed redundant call

    if (!socket) return;

    socket.on('priceUpdate', (prices) => {
      const btcPrice = prices.find(p => p.symbol === 'BTC/USDT');
      if (btcPrice) {
        const livePrice = parseFloat(btcPrice.price);
        setPrice(livePrice);
        setOrderBook({
          bids: [
            { price: livePrice - 2,  amount: parseFloat((Math.random() * 2).toFixed(4)) },
            { price: livePrice - 5,  amount: parseFloat((Math.random() * 5).toFixed(4)) },
            { price: livePrice - 10, amount: parseFloat((Math.random() * 10).toFixed(4)) },
            { price: livePrice - 15, amount: parseFloat((Math.random() * 4).toFixed(4)) },
            { price: livePrice - 22, amount: parseFloat((Math.random() * 8).toFixed(4)) },
            { price: livePrice - 30, amount: parseFloat((Math.random() * 6).toFixed(4)) },
            { price: livePrice - 45, amount: parseFloat((Math.random() * 12).toFixed(4)) },
          ],
          asks: [
            { price: livePrice + 2,  amount: parseFloat((Math.random() * 2).toFixed(4)) },
            { price: livePrice + 5,  amount: parseFloat((Math.random() * 5).toFixed(4)) },
            { price: livePrice + 10, amount: parseFloat((Math.random() * 10).toFixed(4)) },
            { price: livePrice + 16, amount: parseFloat((Math.random() * 3).toFixed(4)) },
            { price: livePrice + 24, amount: parseFloat((Math.random() * 7).toFixed(4)) },
            { price: livePrice + 32, amount: parseFloat((Math.random() * 5).toFixed(4)) },
            { price: livePrice + 48, amount: parseFloat((Math.random() * 9).toFixed(4)) },
          ]
        });
      }
    });

    socket.on('trade_updated', (updatedTrade) => {
      if (updatedTrade.tradeMode !== 'delivery' &&
          (updatedTrade.userId === user?._id || updatedTrade.userId?._id === user?._id)) {
        fetchMyTrades();
        // fetchWalletBalance(); // Handled by AuthContext
        toast.success(`Trade ${updatedTrade.status}`);
      }
    });

    // balance_updated is now handled globally in AuthContext

    return () => {
      socket.off('priceUpdate');
      socket.off('trade_updated');
      socket.off('balance_updated');
    };
  }, [socket, user]);

  const handlePlaceOrder = async () => {
    if (!user) { toast.error('Please login to trade'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }

    setLoading(true);
    try {
      await axios.post('/api/trading/order', {
        pair: 'BTC/USDT',
        type: side === 'buy' ? 'long' : 'short',
        orderType,
        price: parseFloat(price),
        amount: parseFloat(amount),
        leverage: activeTab === 1 ? leverage : 1
      });

      toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed!`);
      setAmount('');
      fetchMyTrades();
      // fetchWalletBalance(); // Handled by AuthContext
    } catch (error) {
      toast.error(error.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await axios.post(`/api/trading/order/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchMyTrades();
      // fetchWalletBalance(); // Handled by AuthContext
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSetPercent = (pct) => {
    const maxBtc = ((user?.wallet?.usdt || 0) / price) * pct;
    setAmount(maxBtc.toFixed(6));
  };

  const total = parseFloat(price) * parseFloat(amount || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#00D395';
      case 'pending':   return '#FFC107';
      case 'cancelled': return '#FF6B6B';
      default:          return '#aaa';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 10, pt: 2 }}>
      {/* Pair Header */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>BTC/USDT</Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color={price >= 70587 ? '#00D395' : '#FF6B6B'}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography component="span" variant="caption" color={price >= 70587 ? '#00D395' : '#FF6B6B'}>
              {price >= 70587 ? '▲ +0.94%' : '▼ -0.94%'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          24h High: $71,200 • Low: $69,800
        </Typography>
      </Paper>

      {/* Wallet Balance Banner */}
      <Paper sx={{ mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(0,211,149,0.08)', border: '1px solid rgba(0,211,149,0.2)' }}>
        <AccountBalanceWallet sx={{ color: '#00D395', fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">Available:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#00D395' }}>
          ${(user?.wallet?.usdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
        </Typography>
      </Paper>

      {/* Trading Mode Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 'bold' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="Perpetual" icon={<Timeline />} iconPosition="start" />
          <Tab
            label="Delivery contract"
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(255,107,107,0.1))',
                borderRadius: 1,
                color: '#FF6B6B',
              },
            }}
          />
        </Tabs>
      </Paper>

      {/* ------------------------------------------------------------------ */}
      {/* DELIVERY CONTRACT TAB                                               */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 1 && (
        <DeliveryTab
          price={price}
          socket={socket}
          user={user}
          orderBook={orderBook}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PERPETUAL TAB                                                       */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={2}>
            {/* Order Form */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  {/* Buy/Sell Toggle */}
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Button
                      fullWidth variant={side === 'buy' ? 'contained' : 'outlined'}
                      sx={{ mr: 1, bgcolor: side === 'buy' ? '#00D395' : 'transparent', borderColor: '#00D395', color: side === 'buy' ? 'white' : '#00D395', fontWeight: 'bold' }}
                      onClick={() => setSide('buy')}
                    >Buy/Long</Button>
                    <Button
                      fullWidth variant={side === 'sell' ? 'contained' : 'outlined'}
                      sx={{ bgcolor: side === 'sell' ? '#FF6B6B' : 'transparent', borderColor: '#FF6B6B', color: side === 'sell' ? 'white' : '#FF6B6B', fontWeight: 'bold' }}
                      onClick={() => setSide('sell')}
                    >Sell/Short</Button>
                  </Box>

                  {/* Order Type */}
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {['market', 'limit'].map(type => (
                      <Chip
                        key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}
                        onClick={() => setOrderType(type)}
                        variant={orderType === type ? 'filled' : 'outlined'}
                        sx={{ mr: 1 }}
                        color={orderType === type ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>

                  {/* Leverage */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Leverage: {leverage}x</Typography>
                    <Slider value={leverage} onChange={(e, v) => setLeverage(v)} min={1} max={100}
                      marks={[{ value: 1, label: '1x' }, { value: 25, label: '25x' }, { value: 50, label: '50x' }, { value: 100, label: '100x' }]}
                    />
                  </Box>

                  {/* Price Input */}
                  {orderType === 'limit' && (
                    <TextField fullWidth label="Price (USDT)" type="number" value={price}
                      onChange={(e) => setPrice(e.target.value)} sx={{ mb: 2 }} size="small"
                    />
                  )}

                  {/* Amount Input */}
                  <TextField
                    fullWidth label={`Amount (${side === 'buy' ? 'BTC' : 'USDT'})`} type="number"
                    value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ mb: 1 }} size="small"
                  />
                  {/* Percentage Buttons */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {[0.1, 0.25, 0.5, 0.75, 1].map(pct => (
                      <Button key={pct} size="small" variant="outlined" onClick={() => handleSetPercent(pct)}
                        sx={{ flex: 1, fontSize: '0.7rem', borderColor: 'rgba(255,255,255,0.2)', py: 0.5 }}>
                        {pct * 100}%
                      </Button>
                    ))}
                  </Box>

                  {/* Total */}
                  <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Place Order */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button fullWidth variant="contained" size="large"
                      sx={{ bgcolor: side === 'buy' ? '#00D395' : '#FF6B6B', fontWeight: 'bold', py: 1.5 }}
                      onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : (side === 'buy' ? 'Place Buy Order' : 'Place Sell Order')}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Book */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>Order Book</Typography>

                  {/* Asks */}
                  {orderBook.asks.map((ask, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, p: 0.5, bgcolor: 'rgba(255,107,107,0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" color="#FF6B6B">{parseFloat(ask.price).toFixed(0)}</Typography>
                      <Typography variant="caption">{ask.amount.toFixed(2)}</Typography>
                    </Box>
                  ))}

                  {/* Mid Price */}
                  <Box sx={{ textAlign: 'center', my: 1, py: 0.5, borderY: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>${price.toLocaleString()}</Typography>
                  </Box>

                  {/* Bids */}
                  {orderBook.bids.map((bid, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, p: 0.5, bgcolor: 'rgba(0,211,149,0.1)', borderRadius: 1 }}>
                      <Typography variant="caption" color="#00D395">{parseFloat(bid.price).toFixed(0)}</Typography>
                      <Typography variant="caption">{bid.amount.toFixed(2)}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Positions & Open Orders */}
          <Box sx={{ mt: 2 }}>
            <Tabs value={positionsTab} onChange={(e, v) => setPositionsTab(v)} variant="fullWidth" sx={{ mb: 1 }}>
              <Tab label={`Positions (${positions.length})`} />
              <Tab label={`Open Orders (${openOrders.length})`} />
            </Tabs>

            {positionsTab === 0 && (
              <Card>
                {positions.length === 0 ? (
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No completed positions yet</Typography>
                    <Typography variant="caption" color="text.secondary">Place a market order to open a position</Typography>
                  </CardContent>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Pair</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {positions.map((pos) => (
                          <TableRow key={pos._id}>
                            <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{pos.pair}</Typography></TableCell>
                            <TableCell>
                              <Chip label={pos.type.toUpperCase()} size="small"
                                sx={{ fontSize: '0.65rem', bgcolor: (pos.type === 'long' || pos.type === 'buy') ? 'rgba(0,211,149,0.15)' : 'rgba(255,107,107,0.15)', color: (pos.type === 'long' || pos.type === 'buy') ? '#00D395' : '#FF6B6B' }}
                              />
                            </TableCell>
                            <TableCell><Typography variant="caption">{pos.amount}</Typography></TableCell>
                            <TableCell><Typography variant="caption">${pos.price.toLocaleString()}</Typography></TableCell>
                            <TableCell><Typography variant="caption">${pos.total.toLocaleString()}</Typography></TableCell>
                            <TableCell><Typography variant="caption">{new Date(pos.createdAt).toLocaleDateString()}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            )}

            {positionsTab === 1 && (
              <Card>
                {openOrders.length === 0 ? (
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No open orders</Typography>
                    <Typography variant="caption" color="text.secondary">Place a limit order to see it here</Typography>
                  </CardContent>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Pair</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Limit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Cancel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openOrders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{order.pair}</Typography></TableCell>
                            <TableCell>
                              <Chip label={order.type.toUpperCase()} size="small"
                                sx={{ fontSize: '0.65rem', bgcolor: (order.type === 'long' || order.type === 'buy') ? 'rgba(0,211,149,0.15)' : 'rgba(255,107,107,0.15)', color: (order.type === 'long' || order.type === 'buy') ? '#00D395' : '#FF6B6B' }}
                              />
                            </TableCell>
                            <TableCell><Typography variant="caption">{order.amount}</Typography></TableCell>
                            <TableCell><Typography variant="caption">${order.price.toLocaleString()}</Typography></TableCell>
                            <TableCell><Typography variant="caption">${order.total.toLocaleString()}</Typography></TableCell>
                            <TableCell>
                              <Tooltip title="Cancel Order">
                                <IconButton size="small" color="error"
                                  onClick={() => handleCancelOrder(order._id)}
                                  disabled={cancellingId === order._id}
                                >
                                  {cancellingId === order._id ? <CircularProgress size={16} /> : <CancelOutlined fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default TradingPage;