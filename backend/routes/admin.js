const express = require('express');
const { protect, admin: adminAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Trade = require('../models/Trade');
const SupportTicket = require('../models/SupportTicket');
const ChatMessage = require('../models/Chat');
const WalletTransaction = require('../models/WalletTransaction');
const SystemSettings = require('../models/SystemSettings');
const router = express.Router();

// Get system settings
router.get('/settings', protect, adminAuth, async (req, res) => {
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

// Update system settings
router.put('/settings', protect, adminAuth, async (req, res) => {
  try {
    const { marketCap, volume24h, btcDominance } = req.body;
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings();
    }
    
    if (marketCap !== undefined) settings.marketCap = marketCap;
    if (volume24h !== undefined) settings.volume24h = volume24h;
    if (btcDominance !== undefined) settings.btcDominance = btcDominance;
    settings.updatedAt = Date.now();
    
    await settings.save();
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', protect, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, kycStatus } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status === 'active') query.isBanned = false;
      else if (status === 'suspended') query.isBanned = true;
    }

    if (kycStatus) {
      query.kycStatus = kycStatus;
    }

    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      if (req.query.sortBy === 'oldest') sort = { createdAt: 1 };
      else if (req.query.sortBy === 'balance') sort = { 'wallet.usdt': -1 };
      else if (req.query.sortBy === 'trades') sort = { 'tradingStats.totalTrades': -1 };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await User.countDocuments(query);
    const totalUsers = await User.countDocuments(); // Always send total platform users
    
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsersCount: count, // Count matching current query
      totalUsers // Total in platform
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/users/:id', protect, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/users/:id', protect, adminAuth, async (req, res) => {
  try {
    const { fullName, phone, kycStatus, wallet, isActive, deliveryTradeEnabled } = req.body;
    
    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phone !== undefined) updateFields.phone = phone;
    if (kycStatus !== undefined) updateFields.kycStatus = kycStatus;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (deliveryTradeEnabled !== undefined) updateFields.deliveryTradeEnabled = deliveryTradeEnabled;

    if (wallet !== undefined) {
      if (wallet.usdt !== undefined) updateFields['wallet.usdt'] = wallet.usdt;
      if (wallet.btc !== undefined) updateFields['wallet.btc'] = wallet.btc;
      if (wallet.eth !== undefined) updateFields['wallet.eth'] = wallet.eth;
      if (wallet.sol !== undefined) updateFields['wallet.sol'] = wallet.sol;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Notify user to refresh their profile/balance
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${user._id}`).emit('transaction_updated', {
        type: 'balance_edit',
        status: 'completed',
        title: 'Balance Updated',
        message: 'Admin has manually updated your wallet balance.'
      });
      io.to(`user_${user._id}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all trades
router.get('/trades', protect, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, userId, type } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (type) query.type = type;
    
    const trades = await Trade.find(query)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Trade.countDocuments(query);
    
    res.json({
      trades,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTrades: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions
router.get('/transactions', protect, adminAuth, async (req, res) => {
  try {
    const {
      page: rawPage = 1,
      limit: rawLimit = 50,
      type,
      status,
      userId,
      sortBy = 'newest'
    } = req.query;
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 50));
    
    const query = { type: { $in: ['deposit', 'withdrawal'] } };
    if (type && ['deposit', 'withdrawal'].includes(type)) query.type = type;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'amount_high') sort = { amount: -1, createdAt: -1 };
    if (sortBy === 'amount_low') sort = { amount: 1, createdAt: -1 };
    
    const transactions = await WalletTransaction.find(query)
      .populate('userId', 'email fullName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await WalletTransaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      totalTransactions: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction status
router.put('/transactions/:id', protect, adminAuth, async (req, res) => {
  try {
    const { status, walletAddress } = req.body;
    
    const transaction = await WalletTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const prevStatus = transaction.status;
    if (typeof status !== 'undefined') {
      transaction.status = status;
      if (status === 'completed') {
        transaction.completedAt = new Date();
      }
    }

    if (typeof walletAddress !== 'undefined') {
      const trimmedAddress = String(walletAddress).trim();
      if (!trimmedAddress) {
        return res.status(400).json({ message: 'Wallet address cannot be empty' });
      }
      if (trimmedAddress.length > 200) {
        return res.status(400).json({ message: 'Wallet address is too long' });
      }
      const addressField = transaction.type === 'deposit' ? 'fromAddress' : 'toAddress';
      transaction[addressField] = trimmedAddress;
    }
    
    await transaction.save();
    
    // On deposit approval: credit user wallet
    if (transaction.type === 'deposit' && status === 'completed' && prevStatus !== 'completed') {
      const currency = transaction.currency.toLowerCase();
      const updateObj = { $inc: {} };
      updateObj.$inc[`wallet.${currency}`] = transaction.amount;
      
      const user = await User.findByIdAndUpdate(transaction.userId, updateObj, { new: true });
      if (user) {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('balance_updated', { wallet: user.wallet });
        }
      }
    }
    
    // On withdrawal rejection/cancellation: refund user wallet
    if (transaction.type === 'withdrawal' && (status === 'cancelled' || status === 'rejected') && prevStatus === 'pending') {
      const currency = transaction.currency.toLowerCase();
      const updateObj = { $inc: {} };
      updateObj.$inc[`wallet.${currency}`] = transaction.amount;

      const user = await User.findByIdAndUpdate(transaction.userId, updateObj, { new: true });
      if (user) {
        // Emit balance update to user
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('balance_updated', { wallet: user.wallet });
        }
      }
    }
    
    // NOTE: Withdrawal balance was already deducted at submission time, so we do NOT deduct again on completion.

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const populatedTransaction = await transaction.populate('userId', 'email fullName');
      io.to('admin').emit('transaction_updated', populatedTransaction);
      io.to(`user_${transaction.userId}`).emit('transaction_updated', {
        ...transaction.toObject(),
        status: transaction.status,
        title: status === 'completed' ? 'Transaction Approved' : 'Transaction Updated',
        message: status
          ? `Your ${transaction.type} of ${transaction.amount} ${transaction.currency} has been ${status}`
          : `Your ${transaction.type} details were updated by admin`
      });
      // Emit balance_updated to trigger real-time refresh
      const user = await User.findById(transaction.userId);
      if (user) {
        io.to(`user_${transaction.userId}`).emit('balance_updated', { wallet: user.wallet });
      }
    }
    
    res.json({ message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Manually add deposit to user wallet
router.post('/deposit', protect, adminAuth, async (req, res) => {
  try {
    const { userId, currency, amount, note } = req.body;

    if (!userId || !currency || !amount || amount <= 0) {
      return res.status(400).json({ message: 'userId, currency, and a positive amount are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currencyKey = currency.toLowerCase();
    if (user.wallet[currencyKey] === undefined) {
      return res.status(400).json({ message: `Unsupported currency: ${currency}` });
    }

    // Credit user wallet
    user.wallet[currencyKey] += parseFloat(amount);
    await user.save();

    // Create transaction record
    const transaction = await WalletTransaction.create({
      userId,
      type: 'deposit',
      currency: currency.toUpperCase(),
      amount: parseFloat(amount),
      status: 'completed',
      completedAt: new Date(),
      fromAddress: 'Admin Manual Deposit',
      metadata: { orderId: note || 'Admin deposit' }
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const populated = await WalletTransaction.findById(transaction._id).populate('userId', 'email fullName');
      io.to('admin').emit('new_transaction', populated);
      io.to(`user_${userId}`).emit('transaction_updated', {
        ...transaction.toObject(),
        title: 'Deposit Received',
        message: `${amount} ${currency.toUpperCase()} has been deposited to your account`
      });
      io.to(`user_${userId}`).emit('balance_updated', { wallet: user.wallet });
    }

    res.json({ message: `Successfully deposited ${amount} ${currency.toUpperCase()} to ${user.fullName}'s wallet`, transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform stats
router.get('/stats', protect, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const verifiedUsers = await User.countDocuments({ kycStatus: 'verified' });
    
    const totalTrades = await Trade.countDocuments();
    const completedTrades = await Trade.countDocuments({ status: 'completed' });
    
    const trades = await Trade.find({ status: 'completed' });
    const totalVolume = trades.reduce((sum, trade) => sum + trade.total, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTrades = await Trade.countDocuments({ 
      createdAt: { $gte: today },
      status: 'completed'
    });
    
    const deposits = await WalletTransaction.find({ type: 'deposit', status: 'completed' });
    const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);
    
    const withdrawals = await WalletTransaction.find({ type: 'withdrawal', status: 'completed' });
    const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Get asset distribution
    const assetDistribution = await User.aggregate([
      {
        $group: {
          _id: null,
          btc: { $sum: "$wallet.btc" },
          eth: { $sum: "$wallet.eth" },
          usdt: { $sum: "$wallet.usdt" },
          sol: { $sum: "$wallet.sol" }
        }
      }
    ]);

    // Get recent activities (last 10 combined from users, trades, transactions)
    const [lastUsers, lastTrades, lastTransactions] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('fullName createdAt email'),
      Trade.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName'),
      WalletTransaction.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName')
    ]);

    const recentActivities = [
      ...lastUsers.map(u => ({ id: u._id, user: u.fullName || u.email, action: 'Registration', details: 'New User', status: 'success', time: u.createdAt })),
      ...lastTrades.map(t => ({ id: t._id, user: t.userId?.fullName || 'User', action: `${t.pair} ${t.type}`, details: `${t.amount} @ ${t.price}`, status: t.status, time: t.createdAt })),
      ...lastTransactions.map(tx => ({ id: tx._id, user: tx.userId?.fullName || 'User', action: tx.type, details: `${tx.amount} ${tx.currency}`, status: tx.status, time: tx.createdAt }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    // Get quick stats
    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
    const openSupportTickets = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });

    // Get daily signups for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const signups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get transaction volume stats for last 7 days
    const transactionStats = await WalletTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type"
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get trade volume stats for last 7 days
    const tradeStats = await Trade.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get 24h trade volume stats
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const tradeStats24h = await Trade.aggregate([
      {
        $match: {
          createdAt: { $gte: twentyFourHoursAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { 
            hour: { $hour: "$createdAt" },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          volume: { $sum: "$total" },
          count: { $sum: 1 },
          fees: { $sum: { $multiply: ["$total", 0.001] } } // approx fee
        }
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } }
    ]);
    
    res.json({
      totalUsers,

      verifiedUsers,
      totalTrades,
      completedTrades,
      totalVolume,
      todayTrades,
      totalDeposits,
      totalWithdrawals,
      signups,
      transactionStats,
      tradeStats,
      tradeStats24h,
      assetDistribution: assetDistribution[0] || { usdt: 0 },
      recentActivities,
      quickStats: {
        avgTradeSize,
        openSupportTickets,
        activeSessions: totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get support tickets
router.get('/support/tickets', protect, adminAuth, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'email fullName')
      .populate('assignedTo', 'email fullName')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await SupportTicket.countDocuments(query);
    
    res.json({
      tickets,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTickets: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update support ticket
router.put('/support/tickets/:id', protect, adminAuth, async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (priority) ticket.priority = priority;
    
    await ticket.save();
    
    res.json({ message: 'Ticket updated', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chat messages
router.get('/chat/messages', protect, adminAuth, async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    
    const messages = await ChatMessage.find(query)
      .populate('userId', 'email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1);
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ban/Unban user
router.post('/users/:id/ban', protect, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isBanned = true;
    user.banReason = req.body.reason || 'Violation of terms';
    await user.save();
    
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users/:id/unban', protect, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isBanned = false;
    user.banReason = '';
    await user.save();
    
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export user data
router.get('/users/:id/export', protect, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const trades = await Trade.find({ userId: req.params.id });
    const transactions = await WalletTransaction.find({ userId: req.params.id });
    
    const data = {
      user,
      trades,
      transactions,
      exportDate: new Date(),
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum, trade) => sum + trade.total, 0)
    };
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/users/:id', protect, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending KYC requests
router.get('/kyc/pending', protect, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ kycStatus: { $in: ['pending', 'rejected'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update KYC status
router.put('/kyc/:userId', protect, adminAuth, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.kycStatus = status;
    if (reviewNote) {
      if (!user.kycDetails) user.kycDetails = {};
      user.kycDetails.reviewNote = reviewNote;
    }
    
    await user.save();
    res.json({ message: 'KYC status updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle delivery trade for a user
router.put('/users/:id/delivery-trade', protect, adminAuth, async (req, res) => {
  try {
    const { deliveryTradeEnabled } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.deliveryTradeEnabled = deliveryTradeEnabled;
    await user.save();

    // Notify the user via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${user._id}`).emit('trade_permission_updated', {
        deliveryTradeEnabled,
        message: deliveryTradeEnabled
          ? 'Your delivery trading has been enabled.'
          : 'Your delivery trading has been restricted by admin.'
      });
    }

    res.json({
      message: `Delivery trade ${deliveryTradeEnabled ? 'enabled' : 'disabled'} for ${user.fullName}`,
      deliveryTradeEnabled
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Also support updating deliveryTradeEnabled via PUT /api/admin/users/:id
// (already handled in the general update user route above via req.body)

module.exports = router;