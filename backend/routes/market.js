const express = require('express');
const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');
const router = express.Router();

// Get system settings (Market Cap, Volume, etc)
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get market data from external API (using CoinGecko as example)
router.get('/prices', async (req, res) => {
  try {
    // In production, use real API
    // const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
    
    // Mock data for development
    const mockData = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 70587.31,
        market_cap: 1380000000000,
        market_cap_rank: 1,
        price_change_percentage_24h: -0.97,
        total_volume: 30486232104
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 2115.23,
        market_cap: 254000000000,
        market_cap_rank: 2,
        price_change_percentage_24h: -1.9,
        total_volume: 14987043210
      },
      {
        id: 'solana',
        symbol: 'sol',
        name: 'Solana',
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        current_price: 106.45,
        market_cap: 46000000000,
        market_cap_rank: 5,
        price_change_percentage_24h: -1.04,
        total_volume: 379644412
      },
      {
        id: 'ripple',
        symbol: 'xrp',
        name: 'XRP',
        image: 'https://assets.coingecko.com/coins/images/44/large/xrp.png',
        current_price: 0.52,
        market_cap: 28000000000,
        market_cap_rank: 6,
        price_change_percentage_24h: -0.78,
        total_volume: 274422594
      },
      {
        id: 'cardano',
        symbol: 'ada',
        name: 'Cardano',
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        current_price: 0.37,
        market_cap: 13000000000,
        market_cap_rank: 9,
        price_change_percentage_24h: -0.57,
        total_volume: 48003066
      }
    ];
    
    res.json(mockData);
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});

// Get order book for specific pair
router.get('/orderbook/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    
    // Generate mock order book
    const generateOrderBook = () => {
      const basePrice = pair.includes('BTC') ? 70000 : 
                       pair.includes('ETH') ? 2100 : 100;
      
      const bids = [];
      const asks = [];
      
      for (let i = 0; i < 10; i++) {
        const bidPrice = basePrice - Math.random() * 100;
        const askPrice = basePrice + Math.random() * 100;
        
        bids.push({
          price: bidPrice,
          amount: Math.random() * 5,
          total: bidPrice * Math.random() * 5
        });
        
        asks.push({
          price: askPrice,
          amount: Math.random() * 5,
          total: askPrice * Math.random() * 5
        });
      }
      
      return {
        bids: bids.sort((a, b) => b.price - a.price),
        asks: asks.sort((a, b) => a.price - b.price)
      };
    };
    
    res.json(generateOrderBook());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trading pairs
router.get('/pairs', async (req, res) => {
  try {
    const pairs = [
      { symbol: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104 },
      { symbol: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210 },
      { symbol: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412 },
      { symbol: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594 },
      { symbol: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066 },
      { symbol: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567 },
      { symbol: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267 },
      { symbol: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235 }
    ];
    
    res.json(pairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Binance Klines (OHLCV) Proxy — used by TradingChart for historical candles
// GET /api/market/klines?symbol=BTCUSDT&interval=1m&limit=500
// ---------------------------------------------------------------------------
router.get('/klines', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '1m', limit = 500 } = req.query;

    // Sanitize inputs
    const safeSymbol   = String(symbol).replace(/[^A-Z0-9]/g, '').toUpperCase();
    const safeInterval = String(interval).replace(/[^0-9a-zA-Z]/g, '');
    const safeLimit    = Math.min(Math.max(parseInt(limit, 10) || 500, 1), 1000);

    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol:   safeSymbol,
        interval: safeInterval,
        limit:    safeLimit
      },
      timeout: 10000,
      headers: { 'User-Agent': 'CrokTrade/1.0' }
    });

    // Transform Binance klines format into lightweight-charts format:
    // [openTime, open, high, low, close, volume, ...]
    const candles = response.data.map(k => ({
      time:   Math.floor(k[0] / 1000), // Unix seconds
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));

    res.json(candles);
  } catch (error) {
    console.error('Klines proxy error:', error.message);
    res.status(502).json({ message: 'Failed to fetch klines from Binance', error: error.message });
  }
});

module.exports = router;