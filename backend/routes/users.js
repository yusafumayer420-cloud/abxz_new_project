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
const profileDir = path.join(__dirname, '../uploads/profiles');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profile') {
      cb(null, profileDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
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
    
    // Return full user object to prevent frontend state loss (e.g. wallet)
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({
      message: 'Profile updated',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile picture
router.post('/profile-picture', auth, upload.single('profile'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('Profile Picture Upload: No file received in req.file');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    const user = await User.findById(req.user.id);
    user.profilePicture = fileUrl;
    await user.save();

    res.json({
      message: 'Profile picture updated',
      profilePicture: fileUrl
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
      console.log('KYC Upload: No file received in req.file');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    if (!type) {
      console.log('KYC Upload: Document type missing in req.body');
      return res.status(400).json({ message: 'Document type is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.kycStatus === 'verified') {
      return res.status(400).json({ message: 'Your account is already verified. You cannot re-upload documents.' });
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
      user.set(`kycDocuments.${type}`, fileUrl);
    } else {
      console.log('Invalid KYC document type received:', type);
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
    console.error('KYC Upload Error in Route:', error);
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
    user.plainPassword = newPassword;
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