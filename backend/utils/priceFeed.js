const WebSocket = require('ws');
const axios = require('axios');

const COINS = [
  { symbol: 'BTC/USDT', binanceSymbol: 'btcusdt' },
  { symbol: 'ETH/USDT', binanceSymbol: 'ethusdt' },
  { symbol: 'SOL/USDT', binanceSymbol: 'solusdt' },
  { symbol: 'XRP/USDT', binanceSymbol: 'xrpusdt' },
  { symbol: 'ADA/USDT', binanceSymbol: 'adausdt' },
  { symbol: 'DOGE/USDT', binanceSymbol: 'dogeusdt' },
  { symbol: 'BNB/USDT', binanceSymbol: 'bnbusdt' },
  { symbol: 'MATIC/USDT', binanceSymbol: 'maticusdt' },
  { symbol: 'AVAX/USDT', binanceSymbol: 'avaxusdt' },
  { symbol: 'LINK/USDT', binanceSymbol: 'linkusdt' },
  { symbol: 'DOT/USDT', binanceSymbol: 'dotusdt' },
  { symbol: 'LTC/USDT', binanceSymbol: 'ltcusdt' },
  { symbol: 'SHIB/USDT', binanceSymbol: 'shibusdt' },
  { symbol: 'TRX/USDT', binanceSymbol: 'trxusdt' },
  { symbol: 'UNI/USDT', binanceSymbol: 'uniusdt' },
  { symbol: 'ATOM/USDT', binanceSymbol: 'atomusdt' },
  { symbol: 'XLM/USDT', binanceSymbol: 'xlmusdt' },
  { symbol: 'ETC/USDT', binanceSymbol: 'etcusdt' },
  { symbol: 'FIL/USDT', binanceSymbol: 'filusdt' },
  { symbol: 'NEAR/USDT', binanceSymbol: 'nearusdt' },
  { symbol: 'ALGO/USDT', binanceSymbol: 'algousdt' },
  { symbol: 'VET/USDT', binanceSymbol: 'vetusdt' },
  { symbol: 'ICP/USDT', binanceSymbol: 'icpusdt' },
  { symbol: 'MANA/USDT', binanceSymbol: 'manausdt' },
  { symbol: 'SAND/USDT', binanceSymbol: 'sandusdt' },
  { symbol: 'AXS/USDT', binanceSymbol: 'axsusdt' },
  { symbol: 'THETA/USDT', binanceSymbol: 'thetausdt' },
  { symbol: 'FTM/USDT', binanceSymbol: 'ftmusdt' },
  { symbol: 'EGLD/USDT', binanceSymbol: 'egldusdt' },
  { symbol: 'XTZ/USDT', binanceSymbol: 'xtzusdt' }
];

let socket = null;
let latestPrices = COINS.map(coin => ({
  symbol: coin.symbol,
  price: 0,
  change24h: '0.00',
  volume: '0.00'
}));

async function fetchInitialPrices() {
  try {
    console.log('Fetching initial prices from Binance REST API...');
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    const data = response.data;
    
    COINS.forEach(coin => {
      const ticker = data.find(t => t.symbol === coin.binanceSymbol.toUpperCase());
      if (ticker) {
        const priceIndex = latestPrices.findIndex(p => p.symbol === coin.symbol);
        if (priceIndex !== -1) {
          latestPrices[priceIndex] = {
            symbol: coin.symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent).toFixed(2),
            volume: parseFloat(ticker.volume).toFixed(2)
          };
        }
      }
    });
    console.log('Initial prices loaded successfully');
  } catch (error) {
    console.error('Error fetching initial prices:', error.message);
  }
}

function startPriceFeed(io) {
  const streams = COINS.map(coin => `${coin.binanceSymbol}@ticker`).join('/');
  const url = `wss://stream.binance.com:9443/ws/${streams}`;

  async function connect() {
    await fetchInitialPrices();
    
    // Broadcast initial prices
    io.emit('priceUpdate', latestPrices);

    console.log('Connecting to Binance WebSocket...');
    socket = new WebSocket(url);

    socket.on('open', () => {
      console.log('Connected to Binance WebSocket');
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        const coin = COINS.find(c => c.binanceSymbol === message.s.toLowerCase());
        
        if (coin) {
          const priceIndex = latestPrices.findIndex(p => p.symbol === coin.symbol);
          if (priceIndex !== -1) {
            latestPrices[priceIndex] = {
              symbol: coin.symbol,
              price: parseFloat(message.c),
              change24h: parseFloat(message.P).toFixed(2),
              volume: parseFloat(message.v).toFixed(2)
            };
            
            // Broadcast update
            io.emit('priceUpdate', latestPrices);
          }
        }
      } catch (error) {
        console.error('Error processing Binance message:', error.message);
      }
    });

    socket.on('error', (error) => {
      console.error('Binance WebSocket error:', error.message);
    });

    socket.on('close', (code, reason) => {
      console.log(`Binance WebSocket closed (${code}: ${reason}). Reconnecting in 5 seconds...`);
      setTimeout(connect, 5000);
    });
  }

  connect();
}

module.exports = {
  startPriceFeed,
  getLatestPrices: () => latestPrices
};
