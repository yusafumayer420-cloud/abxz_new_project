export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const CURRENCIES = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  { symbol: 'USDT', name: 'Tether', icon: '💵', color: '#26A17B' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#00FFA3' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F' },
  { symbol: 'ADA', name: 'Cardano', icon: 'A', color: '#0033AD' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', color: '#C2A633' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', color: '#E6007A' },
];

export const TRADING_PAIRS = [
  { pair: 'BTC/USDT', price: 70587.31, change24h: -0.97, volume: 30486232104 },
  { pair: 'ETH/USDT', price: 2115.23, change24h: -1.9, volume: 14987043210 },
  { pair: 'SOL/USDT', price: 106.45, change24h: -1.04, volume: 379644412 },
  { pair: 'XRP/USDT', price: 0.52, change24h: -0.78, volume: 274422594 },
  { pair: 'ADA/USDT', price: 0.37, change24h: -0.57, volume: 48003066 },
  { pair: 'DOGE/USDT', price: 0.098, change24h: -0.4, volume: 2442605567 },
  { pair: 'DOT/USDT', price: 6.45, change24h: -0.61, volume: 210974267 },
  { pair: 'LTC/USDT', price: 55.66, change24h: -2.24, volume: 9162235 },
];

export const NETWORKS = {
  'BTC': ['BTC Network', 'BEP20'],
  'ETH': ['ERC20', 'BEP20'],
  'USDT': ['ERC20', 'BEP20', 'TRC20'],
  'SOL': ['SOL Network'],
};

export const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit'];
export const TRADE_SIDES = ['buy', 'sell'];
export const LEVERAGE_OPTIONS = [1, 3, 5, 10, 25, 50, 75, 100];

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUBMITTED: 'submitted',
};

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRADE: 'trade',
  TRANSFER: 'transfer',
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const CHART_TIME_FRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
  { label: '1w', value: '1w' },
];

export const INDICATORS = [
  'MA', 'EMA', 'MACD', 'RSI', 'Bollinger Bands', 'Volume'
];