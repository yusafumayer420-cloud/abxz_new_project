const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createAdminNotification } = require('../utils/notificationHelper');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const sendEmail = require('../utils/emailService');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({ 
      email, 
      password, 
      fullName,
      wallet: { usdt: 0, btc: 0, eth: 0, sol: 0 } // Explicitly set for new users
    });
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Notify admins of new registration
    createAdminNotification(req.app.get('io'), {
      title: 'New User Registered',
      message: `User ${fullName || email} just joined the platform`,
      type: 'user',
      relatedId: user._id
    }).catch(err => console.error('Notification error:', err));

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      if (user) {
        await LoginLog.create({
          userId: user._id,
          action: 'login_failed',
          device: req.headers['user-agent'] || 'Unknown Device',
          ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
          status: 'failed'
        });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    await LoginLog.create({
      userId: user._id,
      action: 'login_success',
      device: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
      status: 'success'
    });
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        wallet: user.wallet,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || req.get('origin');
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process within 1 hour of receiving it:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: message,
        html: `<p>You requested a password reset. Please click the link below to reset your password:</p>
               <a href="${resetUrl}">${resetUrl}</a>
               <p>This link expires in 1 hour.</p>`
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;