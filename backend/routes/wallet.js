const express = require('express');
const { protect: auth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { createAdminNotification } = require('../utils/notificationHelper');
const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vouchers',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Generate deposit address
router.post('/deposit/address', auth, async (req, res) => {
  try {
    const { currency } = req.body;
    const user = await User.findById(req.user.id);
    
    // Check if address exists
    if (user.addresses && user.addresses[currency.toLowerCase()]) {
      const address = user.addresses[currency.toLowerCase()];
      return res.json({
        currency,
        address,
        memo: currency === 'XRP' ? Math.floor(Math.random() * 1000000).toString() : null,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
      });
    }

    // Generate new address (simulation)
    let address;
    const randomHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    switch(currency) {
      case 'BTC': address = 'bc1' + randomHex; break;
      case 'ETH': case 'USDT': address = '0x' + randomHex; break;
      case 'SOL': address = randomHex + 'sol'; break;
      default: address = '0x' + randomHex;
    }
    
    // Save to user
    if (!user.addresses) user.addresses = {};
    user.addresses[currency.toLowerCase()] = address;
    await user.save();
    
    res.json({
      currency,
      address,
      memo: currency === 'XRP' ? Math.floor(Math.random() * 1000000).toString() : null,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit deposit voucher
router.post('/deposit', auth, upload.single('voucher'), async (req, res) => {
  try {
    const { currency, amount, chain } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Voucher image is required' });
    }

    const transaction = new WalletTransaction({
      userId: req.user.id,
      type: 'deposit',
      currency,
      amount: parseFloat(amount),
      chain,
      voucher: req.file.path,
      status: 'pending'
    });

    await transaction.save();

    // Notify admins
    transaction.populate('userId', 'email fullName').then(populated => {
      createAdminNotification(req.app.get('io'), {
        title: 'New Deposit Request',
        message: `${populated.userId.fullName || populated.userId.email} deposited ${amount} ${currency}`,
        type: 'deposit',
        relatedId: transaction._id
      });

      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('new_transaction', populated);
        io.to(`user_${req.user.id}`).emit('transaction_requested', {
          title: 'Deposit Requested',
          message: `${amount} ${currency} deposit is pending review`,
          type: 'info',
          transaction
        });
      }
    }).catch(err => console.error('Notification error:', err));

    res.json({
      message: 'Deposit request submitted successfully',
      transaction
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: error.message });
  }
});
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { currency, amount, address, network } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Check KYC status
    if (user.kycStatus !== 'verified') {
      return res.status(403).json({ message: 'KYC verification is required for withdrawals' });
    }

    // Check for existing pending withdrawals
    const pendingWithdrawal = await WalletTransaction.findOne({
      userId: req.user.id,
      type: 'withdrawal',
      status: 'pending'
    });

    if (pendingWithdrawal) {
      return res.status(400).json({ 
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.' 
      });
    }
    
    const minAmounts = { 'BTC': 0, 'ETH': 0, 'USDT': 0, 'SOL': 0 };
    if (amount < (minAmounts[currency] || 0)) {
      return res.status(400).json({ message: `Minimum withdrawal is ${minAmounts[currency] || 0} ${currency}` });
    }

    // Atomic deduction: only subtract if balance is sufficient
    const currencyKey = currency.toLowerCase();
    const queryObj = { _id: req.user.id };
    queryObj[`wallet.${currencyKey}`] = { $gte: amount };
    
    const updateObj = { $inc: {} };
    updateObj.$inc[`wallet.${currencyKey}`] = -amount;

    const updatedUser = await User.findOneAndUpdate(queryObj, updateObj, { new: true });
    
    if (!updatedUser) {
      return res.status(400).json({ message: 'Insufficient balance or user not found' });
    }
    
    // Create transaction record
    const transaction = new WalletTransaction({
      userId: req.user.id,
      type: 'withdrawal',
      currency,
      amount,
      chain: network,
      toAddress: address,
      status: 'pending',
      fee: calculateFee(currency, network)
    });
    
    await transaction.save();

    // Emit socket event to admins
    const io = req.app.get('io');
    if (io) {
      // Notify admins
      // We might need an admin room, or just broadcast to everyone for now (admins filter by view)
      // Ideally, admins should join an 'admin' room.
      // Assuming 'admin' room exists from chat implementation
      transaction.populate('userId', 'email fullName').then(populated => {
        createAdminNotification(req.app.get('io'), {
          title: 'Withdrawal Request',
          message: `${populated.userId.fullName || populated.userId.email} requested ${amount} ${currency}`,
          type: 'withdrawal',
          relatedId: transaction._id
        });
        io.to('admin').emit('new_transaction', populated);
      });
      io.to(`user_${req.user.id}`).emit('transaction_requested', {
        title: 'Withdrawal Requested',
        message: `${amount} ${currency} withdrawal to ${address} is pending review`,
        type: 'info',
        transaction
      });
      io.to(`user_${req.user.id}`).emit('balance_updated', { wallet: updatedUser.wallet });
    }
    
    res.json({
      message: 'Withdrawal request submitted',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate withdrawal fee
function calculateFee(currency, network) {
  const fees = {
    'BTC': { 'BTC': 0.0005, 'BEP20': 0.0001 },
    'ETH': { 'ETH': 0.005, 'BEP20': 0.001 },
    'USDT': { 'ETH': 10, 'BEP20': 1, 'TRX': 1, 'TRC20': 1 }
  };
  
  return fees[currency]?.[network] || 0;
}

module.exports = router;