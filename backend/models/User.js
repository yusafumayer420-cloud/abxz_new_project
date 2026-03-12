const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phone: String,
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycDocuments: {
    idFront: String,
    idBack: String,
    selfie: String
  },
  wallet: {
    usdt: { type: Number, default: 0 },
    btc: { type: Number, default: 0 },
    eth: { type: Number, default: 0 },
    sol: { type: Number, default: 0 }
  },
  addresses: {
    usdt: String
  },
  tradingStats: {
    totalTrades: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  deliveryTradeEnabled: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);