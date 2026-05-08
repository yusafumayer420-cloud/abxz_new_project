import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid
} from '@mui/material';
import { ArrowBack, Close, ContentCopy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/wallet/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour12: false });
    return `${month}-${day}-${year} ${time}`;
  };

  const filteredTransactions = transactions.filter(tx => 
    activeTab === 0 ? tx.type === 'deposit' : tx.type === 'withdrawal'
  );

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2, bgcolor: '#131A2E', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          History
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '1rem' },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { backgroundColor: '#4361EE' }
          }}
        >
          <Tab label="Deposit" />
          <Tab label="Withdraw" />
        </Tabs>
      </Box>

      {/* Transactions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredTransactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No transactions found</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {filteredTransactions.map((tx) => (
            <ListItem 
              key={tx._id || tx.id} 
              onClick={() => setSelectedTx(tx)}
              sx={{ 
                px: 2, 
                py: 1.5, 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
              }}
            >
              <ListItemText
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
                primary={
                  <Typography variant="body1" sx={{ fontWeight: '500' }}>
                    {tx.currency}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatDate(tx.createdAt || tx.date)}
                  </Typography>
                }
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: '500' }}>
                  {tx.amount}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Box 
                    sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: tx.status === 'completed' ? '#00D395' : tx.status === 'pending' ? '#FFB703' : '#FF6B6B' 
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {tx.status === 'completed' ? 'Success' : tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
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
                <Grid item xs={7}><Typography variant="body2" sx={{ textAlign: 'right' }}>{selectedTx.chain || selectedTx.network || selectedTx.metadata?.network || 'ERC'}</Typography></Grid>

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
    </Container>
  );
};

export default TransactionHistoryPage;
