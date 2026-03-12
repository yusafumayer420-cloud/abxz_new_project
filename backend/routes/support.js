const express = require('express');
const { protect: auth, admin } = require('../middleware/authMiddleware');
const SupportTicket = require('../models/SupportTicket');
const ChatMessage = require('../models/Chat');
const User = require('../models/User');
const { createAdminNotification } = require('../utils/notificationHelper');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure chat upload directory exists
const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config for chat attachments
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for chat attachments
});

// Get user tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('assignedTo', 'email fullName');
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket details
router.get('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'email fullName kycStatus')
      .populate('assignedTo', 'email fullName')
      .populate('resolution.resolvedBy', 'email fullName');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user has access
    if (req.user.role !== 'admin' && ticket.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get ticket messages
    const messages = await ChatMessage.find({ _id: { $in: ticket.messages } })
      .sort({ createdAt: 1 })
      .populate('userId', 'email fullName');
    
    res.json({
      ticket,
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload attachment
router.post('/upload', auth, upload.single('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Construct the URL to the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/chat/${req.file.filename}`;
    
    res.json({
      message: 'Attachment uploaded successfully',
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;
    
    const ticket = new SupportTicket({
      userId: req.user.id,
      subject,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      lastMessage: message?.substring(0, 100) || subject
    });
    
    await ticket.save();
    
    // Notify admins of new ticket
    const user = await User.findById(req.user.id);
    await createAdminNotification(req.app.get('io'), {
      title: 'New Support Ticket',
      message: `[${priority.toUpperCase()}] ${user.fullName || user.email}: ${subject}`,
      type: 'support',
      relatedId: ticket._id
    });

    // Create initial message if provided
    if (message) {
      const chatMessage = new ChatMessage({
        userId: req.user.id,
        message,
        type: 'user',
        room: `user_${req.user.id}`
      });
      
      await chatMessage.save();
      ticket.messages.push(chatMessage._id);
      await ticket.save();
    }
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket (admin only)
router.put('/tickets/:id', auth, admin, async (req, res) => {
  try {
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const { status, assignedTo, priority } = req.body;
    
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (priority) ticket.priority = priority;
    
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.get('/admin/tickets', auth, admin, async (req, res) => {
  try {
    
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'email fullName kycStatus')
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

// Get admin stats
router.get('/admin/stats', auth, admin, async (req, res) => {
  try {
    
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressTickets = await SupportTicket.countDocuments({ status: 'in_progress' });
    const resolvedTickets = await SupportTicket.countDocuments({ status: 'resolved' });
    
    // Tickets by category
    const categoryStats = await SupportTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Tickets by priority
    const priorityStats = await SupportTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Average resolution time
    const resolutionTimes = await SupportTicket.aggregate([
      { $match: { status: 'resolved', 'resolution.resolvedAt': { $exists: true } } },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      { $group: { _id: null, avg: { $avg: '$resolutionTime' } } }
    ]);
    
    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      categoryStats,
      priorityStats,
      avgResolutionHours: resolutionTimes[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;