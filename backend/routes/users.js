const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect: auth } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { createAdminNotification } = require('../utils/notificationHelper');
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update KYC documents
router.post('/kyc/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Construct the URL to the uploaded file
    // e.g., http://localhost:5000/uploads/kyc/document-12345.jpg
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/kyc/${req.file.filename}`;
    
    if (!user.kycDocuments) {
      user.kycDocuments = {};
    }
    
    // type should be 'idFront', 'idBack', or 'selfie'
    if (['idFront', 'idBack', 'selfie'].includes(type)) {
      user.kycDocuments[type] = fileUrl;
    } else {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    user.kycStatus = 'pending';
    
    await user.save();
    
    // Notify admins if this was the last document needed
    if (user.kycDocuments.idFront && user.kycDocuments.idBack && user.kycDocuments.selfie) {
      await createAdminNotification(req.app.get('io'), {
        title: 'New KYC Submission',
        message: `User ${user.fullName || user.email} submitted all KYC documents`,
        type: 'kyc',
        relatedId: user._id
      });
    }
    
    res.json({
      message: 'KYC documents uploaded successfully',
      status: user.kycStatus,
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();
    
    // Log the password change in security logs
    const LoginLog = require('../models/LoginLog');
    await LoginLog.create({
      userId: user._id,
      action: 'password_change',
      device: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown IP',
      status: 'success'
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get security logs (login history)
router.get('/security-logs', auth, async (req, res) => {
  try {
    const LoginLog = require('../models/LoginLog');
    const logs = await LoginLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;