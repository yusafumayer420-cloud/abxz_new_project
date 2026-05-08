import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Grid,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
} from '@mui/material';
import {
  AccountBalanceWallet,
  QrCode,
  ContentCopy,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
  History,
  CurrencyExchange,
  ArrowBack,
  Security,
  Close,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from '../utils/axiosConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

const FundsPage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (location.state && typeof location.state.activeTab === 'number') {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositCurrency, setDepositCurrency] = useState('USDT');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('USDT');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ERC20');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});
  
  // New Deposit Flow State
  const [depositStep, setDepositStep] = useState(1); // 1: Select Crypto, 2: Deposit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositChain, setDepositChain] = useState('ERC20');
  const [depositVoucher, setDepositVoucher] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('priceUpdate', (prices) => {
      const priceMap = {};
      prices.forEach(p => {
        priceMap[p.symbol.split('/')[0]] = parseFloat(p.price);
      });
      setMarketPrices(priceMap);
    });

    socket.on('transaction_updated', (tx) => {
      if (tx.userId === user?._id || tx.userId?._id === user?._id) {
        fetchTransactions();
        // Profile refresh is now handled globally by AuthContext
        toast(`Transaction ${tx.status}: ${tx.amount} ${tx.currency}`, { icon: 'ℹ️' });
      }
    });

    return () => {
      socket.off('priceUpdate');
      socket.off('transaction_updated');
    };
  }, [socket, user, updateUser]);

  const currencies = [
    { symbol: 'USDT', name: 'Tether', balance: user?.wallet?.usdt || 0, icon: '💵' },
  ];

  const networks = {
    'USDT': ['ERC20', 'BEP20', 'TRC20'],
  };

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDepositVoucher(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!depositVoucher) {
      toast.error('Please upload a payment voucher');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('currency', depositCurrency);
      formData.append('amount', depositAmount);
      formData.append('chain', depositChain);
      formData.append('voucher', depositVoucher);

      const response = await axios.post('/api/wallet/deposit', formData);

      toast.success(response.data.message);
      // Reset form and go back to history or step 1
      setDepositStep(1);
      setDepositAmount('');
      setDepositVoucher(null);
      setVoucherPreview(null);
      setActiveTab(2); // Go to history
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (user?.kycStatus !== 'verified') {
      setShowKycDialog(true);
      return;
    }

    if (!withdrawAmount || !withdrawAddress) {
      toast.error('Please fill all fields');
      return;
    }

    if (parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    const selectedCurrency = currencies.find(c => c.symbol === withdrawCurrency);
    if (selectedCurrency && parseFloat(withdrawAmount) > selectedCurrency.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/wallet/withdraw', {
        currency: withdrawCurrency,
        amount: parseFloat(withdrawAmount),
        address: withdrawAddress,
        network: withdrawNetwork,
      });
      
      setWithdrawAmount('');
      setWithdrawAddress('');
      
      // Refresh user data is handled by AuthContext listening to transaction_updated
      // or we can call refreshingUser() if we export it, but socket event will catch it.
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  useEffect(() => {
    if (activeTab === 1 || activeTab === 2) {
      fetchTransactions();
    }
  }, [activeTab]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'deposit': return 'success';
      case 'withdrawal': return 'error';
      case 'trade': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2 }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Wallet
      </Typography>

      {/* Wallet Balance Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Manage your USDT assets here. You can deposit and withdraw Tether across multiple networks.
        </Typography>
      </Box>

      {/* Total Balance */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Total Balance
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', my: 1 }}>
            {(user?.wallet?.usdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<ArrowDownward />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              onClick={() => setActiveTab(0)}
            >
              Deposit
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<ArrowUpward />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              onClick={() => setActiveTab(1)}
            >
              Withdraw
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 'bold' },
          }}
        >
          <Tab label="Deposit" icon={<ArrowDownward />} iconPosition="start" />
          <Tab label="Withdraw" icon={<ArrowUpward />} iconPosition="start" />
          <Tab label="History" icon={<History />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Deposit Tab */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {depositStep === 1 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Please select the deposit crypto
              </Typography>
              <Grid container spacing={2}>
                {[
                  { symbol: 'USDT', name: 'USDT deposit', color: '#26A17B', icon: 'T' },
                  { symbol: 'BTC', name: 'BTC deposit', color: '#F7931A', icon: '₿' },
                  { symbol: 'ETH', name: 'ETH deposit', color: '#627EEA', icon: 'Ξ' },
                  { symbol: 'USDC', name: 'USDC Deposit', color: '#2775CA', icon: '$' },
                ].map((crypto) => (
                  <Grid item xs={6} key={crypto.symbol}>
                    <Card 
                      onClick={() => {
                        setDepositCurrency(crypto.symbol);
                        setDepositStep(2);
                      }}
                      sx={{ 
                        cursor: 'pointer', 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: '0.3s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'translateY(-4px)' },
                        textAlign: 'center',
                        py: 3
                      }}
                    >
                      <Avatar sx={{ bgcolor: crypto.color, width: 60, height: 60, mx: 'auto', mb: 2, fontSize: 30 }}>
                        {crypto.icon}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>
                        {crypto.name}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Exchange Logos Section */}
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary', fontWeight: 'bold' }}>
                  Buy Crypto via Popular Exchanges
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { name: 'Kraken', logo: 'https://www.google.com/s2/favicons?domain=kraken.com&sz=128', url: 'https://www.kraken.com' },
                    { name: 'Coinbase', logo: 'https://www.google.com/s2/favicons?domain=coinbase.com&sz=128', url: 'https://www.coinbase.com' },
                    { name: 'Cash App', logo: 'https://www.google.com/s2/favicons?domain=cash.app&sz=128', url: 'https://cash.app' },
                    { name: 'Shakepay', logo: 'https://www.google.com/s2/favicons?domain=shakepay.com&sz=128', url: 'https://shakepay.com' },
                    { name: 'Crypto.com', logo: 'https://www.google.com/s2/favicons?domain=crypto.com&sz=128', url: 'https://crypto.com' },
                    { name: 'Robinhood', logo: 'https://www.google.com/s2/favicons?domain=robinhood.com&sz=128', url: 'https://robinhood.com' },
                    { name: 'Binance', logo: 'https://www.google.com/s2/favicons?domain=binance.com&sz=128', url: 'https://www.binance.com' },
                    { name: 'Bitget', logo: 'https://www.google.com/s2/favicons?domain=bitget.com&sz=128', url: 'https://www.bitget.com' },
                    { name: 'MEXC', logo: 'https://www.google.com/s2/favicons?domain=mexc.com&sz=128', url: 'https://www.mexc.com' },
                    { name: 'OKX', logo: 'https://www.google.com/s2/favicons?domain=okx.com&sz=128', url: 'https://www.okx.com' },
                  ].map((ex) => (
                    <Grid item xs={4} sm={3} key={ex.name}>
                      <Box
                        onClick={() => window.open(ex.url, '_blank')}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: '0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            transform: 'translateY(-2px)',
                            borderColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        <Box
                          component="img"
                          src={ex.logo}
                          alt={ex.name}
                          sx={{
                            width: '100%',
                            height: 40,
                            objectFit: 'contain',
                            mb: 1
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: '500' }}>
                          {ex.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => setDepositStep(1)} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                  <Typography variant="h6">Fast deposit</Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>Deposit amount</Typography>
                <TextField
                  fullWidth
                  placeholder="Please enter the deposit amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  type="number"
                  sx={{ mb: 3 }}
                />

                <Typography variant="body2" sx={{ mb: 1 }}>Chain name</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  {['ERC20', 'TRC20'].map((chain) => (
                    <Button
                      key={chain}
                      variant={depositChain === chain ? "contained" : "outlined"}
                      onClick={() => setDepositChain(chain)}
                      sx={{ 
                        flex: 1, 
                        py: 1,
                        bgcolor: depositChain === chain ? 'white' : 'transparent',
                        color: depositChain === chain ? 'black' : 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: depositChain === chain ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      {chain}
                    </Button>
                  ))}
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>Payment voucher (upload a screenshot of payment details)</Typography>
                <Box 
                  component="label"
                  sx={{ 
                    display: 'block',
                    width: '100px', 
                    height: '100px', 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    borderRadius: 2, 
                    border: '1px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    mb: 4,
                    overflow: 'hidden'
                  }}
                >
                  <input type="file" hidden accept="image/*" onChange={handleVoucherChange} />
                  {voucherPreview ? (
                    <img src={voucherPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <QrCode sx={{ fontSize: 30, color: 'text.secondary' }} />
                  )}
                </Box>

                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, textAlign: 'center', fontWeight: 'bold' }}>
                    IMPORTANT
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                    • If you have completed the deposit, please click the "I have deposited" button on the page and submit the receipt, otherwise the deposit cannot be posted.<br/>
                    • USDT deposit only supports the simple send method, and the deposit using other methods (send all) cannot be posted temporarily. Please understand.<br/>
                    • After you recharge to the above address, you need to confirm the entire network node before it can be credited.<br/>
                    • Please make sure that your computer and browser are safe to prevent information from being tampered with or leaked.<br/>
                    • <strong>Deposit address provides by the customer support service.</strong>
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleDepositSubmit}
                  disabled={loading}
                  sx={{ py: 1.5, borderRadius: '50px', bgcolor: '#4D5DFF' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Next step'}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Withdraw Crypto
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Select Currency"
                value={withdrawCurrency}
                onChange={(e) => {
                  setWithdrawCurrency(e.target.value);
                  setWithdrawNetwork(networks[e.target.value]?.[0] || 'ERC20');
                }}
                sx={{ mb: 2 }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }
                }}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.symbol} value={currency.symbol}>
                    {currency.name} ({currency.symbol}) - Balance: {currency.balance.toFixed(4)}
                  </MenuItem>
                ))}
              </TextField>

              {networks[withdrawCurrency] && (
                <TextField
                  select
                  fullWidth
                  label="Network"
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  sx={{ mb: 2 }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: { maxHeight: 300 }
                      }
                    }
                  }}
                >
                  {networks[withdrawCurrency].map((network) => (
                    <MenuItem key={network} value={network}>
                      {network} Network
                    </MenuItem>
                  ))}
                </TextField>
              )}
              
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={() => {
                          const currency = currencies.find(c => c.symbol === withdrawCurrency);
                          if (currency) {
                            setWithdrawAmount(currency.balance.toString());
                          }
                        }}
                      >
                        MAX
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Recipient Address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                sx={{ mb: 2 }}
                placeholder={`Enter ${withdrawCurrency} address`}
              />
              
           
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || !withdrawAddress || transactions.some(t => t.type === 'withdrawal' && t.status === 'pending')}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') ? 'Withdrawal Pending' : 'Withdraw'}
                </Button>
              </motion.div>

              {transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  You have a pending withdrawal request. Please wait for it to be processed before submitting another.
                </Typography>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'white', fontWeight: 'bold' }}>
                  Withdrawal Instructions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>1:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Withdrawal processing time is 24 hours.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>2:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Funds are frozen during processing for system verification and safety.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>3:</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Arrival usually within 30 minutes. Contact customer service if delayed beyond expected time.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Transaction History
              </Typography>
              
              {transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No transactions yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {/* Custom Header */}
                  <Box sx={{ display: 'flex', px: 1, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ width: '25%', fontWeight: 'bold', color: 'text.secondary' }}>Type</Typography>
                    <Typography variant="caption" sx={{ width: '30%', fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>Amount</Typography>
                    <Typography variant="caption" sx={{ width: '25%', fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>Status</Typography>
                    <Typography variant="caption" sx={{ width: '20%', fontWeight: 'bold', color: 'text.secondary', textAlign: 'right' }}>Date</Typography>
                  </Box>
                  
                  {transactions.filter(tx => tx.type !== 'trade').map((tx) => (
                    <Box 
                      key={tx._id} 
                      onClick={() => setSelectedTx(tx)}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        px: 0, 
                        py: 2, 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                      }}
                    >
                      <Box sx={{ width: '25%' }}>
                        <Chip
                          label={tx.type}
                          color={getTypeColor(tx.type)}
                          size="small"
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: '20px',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </Box>
                      <Box sx={{ width: '30%', textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {tx.amount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          {tx.currency}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '25%', textAlign: 'center' }}>
                        <Chip
                          label={tx.status}
                          color={getStatusColor(tx.status)}
                          size="small"
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: '20px',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </Box>
                      <Box sx={{ width: '20%', textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', color: 'text.secondary' }}>
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}>
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transaction Details Dialog */}
      <Dialog 
        open={Boolean(selectedTx)} 
        onClose={() => setSelectedTx(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#1E293B',
            color: 'white',
            borderRadius: 16
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>Transaction Details</Typography>
          <IconButton onClick={() => setSelectedTx(null)} sx={{ color: 'white', mr: -1 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {selectedTx && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: selectedTx.type === 'deposit' ? '#00D395' : '#FF6B6B' }}>
                  {selectedTx.type === 'deposit' ? '+' : '-'}{selectedTx.amount} {selectedTx.currency}
                </Typography>
                <Chip 
                  label={selectedTx.status.toUpperCase()} 
                  size="small" 
                  sx={{ 
                    mt: 1.5, 
                    fontWeight: 'bold',
                    px: 1,
                    bgcolor: selectedTx.status === 'completed' ? 'rgba(0, 211, 149, 0.1)' : selectedTx.status === 'pending' ? 'rgba(255, 183, 3, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    color: selectedTx.status === 'completed' ? '#00D395' : selectedTx.status === 'pending' ? '#FFB703' : '#FF6B6B'
                  }} 
                />
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Type</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right', textTransform: 'capitalize' }}>{selectedTx.type}</Typography></Grid>

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Network/Chain</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{selectedTx.chain || selectedTx.network || selectedTx.metadata?.network || 'ERC20'}</Typography></Grid>

                <Grid item xs={5}><Typography color="text.secondary" variant="body2">Time</Typography></Grid>
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{formatDate(selectedTx.createdAt || selectedTx.date)}</Typography></Grid>

                {(selectedTx.toAddress || selectedTx.fromAddress) && 
                 !(selectedTx.toAddress || selectedTx.fromAddress).toLowerCase().includes('admin manual') && (
                  <>
                    <Grid item xs={4}><Typography color="text.secondary" variant="body2">Address</Typography></Grid>
                    <Grid item xs={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'right', mt: 0.5 }}>
                          {selectedTx.toAddress || selectedTx.fromAddress}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(selectedTx.toAddress || selectedTx.fromAddress)} sx={{ color: 'text.secondary', p: 0.5 }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </>
                )}

                {selectedTx.transactionHash && (
                  <>
                    <Grid item xs={4}><Typography color="text.secondary" variant="body2">TxID</Typography></Grid>
                    <Grid item xs={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'right', mt: 0.5 }}>
                          {selectedTx.transactionHash}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(selectedTx.transactionHash)} sx={{ color: 'text.secondary', p: 0.5 }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit Address Dialog */}
      <Dialog 
        open={showDepositDialog} 
        onClose={() => setShowDepositDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Deposit {depositCurrency}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <QrCode sx={{ fontSize: 200, color: 'white', mb: 2 }} />
            <TextField
              fullWidth
              value={depositAddress}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyToClipboard(depositAddress)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Alert severity="warning">
              <Typography variant="caption">
                • Send only {depositCurrency} to this address<br/>
                • Minimum deposit: 10 USDT<br/>
                • Network: Tron, Ethereum, or BSC
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDepositDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* KYC Required Dialog */}
      <Dialog 
        open={showKycDialog} 
        onClose={() => setShowKycDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1A1F2B 0%, #10141D 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255, 107, 107, 0.1)', 
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 2 
            }}
          >
            <Security sx={{ color: '#FF6B6B', fontSize: 30 }} />
          </Avatar>
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', color: 'white' }}>
            KYC Verification Required
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            To ensure the security of your funds, identity verification (KYC) is mandatory before making any withdrawals.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setShowKycDialog(false);
              navigate('/profile', { state: { activeTab: 2 } });
            }}
            sx={{ 
              py: 1.5, 
              borderRadius: '50px', 
              background: 'linear-gradient(135deg, #00D395 0%, #00B17D 100%)',
              fontWeight: 'bold',
              textTransform: 'none',
              mb: 2
            }}
          >
            Go to Verification
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setShowKycDialog(false)}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Maybe Later
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default FundsPage;