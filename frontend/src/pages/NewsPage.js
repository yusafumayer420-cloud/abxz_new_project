import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Refresh,
  OpenInNew,
  AccessTime,
  Newspaper,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const response = await axios.get('/api/news');
      setNews(response.data);
      if (showToast) toast.success('News updated');
    } catch (error) {
      console.error('Failed to fetch news:', error);
      toast.error('Failed to update news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pb: 8, pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Newspaper sx={{ color: '#00D395' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Crypto News
          </Typography>
        </Box>
        <IconButton onClick={() => fetchNews(true)} disabled={refreshing} size="small">
          <Refresh className={refreshing ? 'spin-animation' : ''} />
        </IconButton>
      </Box>

      {/* News List */}
      <Grid container spacing={2}>
        {news.map((item, index) => (
          <Grid item xs={12} key={item.id || index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip 
                      label={item.source} 
                      size="small" 
                      sx={{ 
                        bgcolor: item.source === 'CoinDesk' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                        color: item.source === 'CoinDesk' ? '#FF9800' : '#2196F3',
                        fontSize: '0.65rem',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.date)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, lineHeight: 1.3 }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.summary}
                  </Typography>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNew />}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      fontSize: '0.75rem',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'text.secondary'
                    }}
                  >
                    Read on {item.source}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {news.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary">No news available at the moment.</Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .spin-animation {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Container>
  );
};

export default NewsPage;
