const ChatMessage = require('../models/Chat');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { createAdminNotification } = require('../utils/notificationHelper');

module.exports = (io) => {
  const chatNamespace = io.of('/chat');
  
  // Store active admin connections
  const activeAdmins = new Map();
  // Store user rooms
  const userRooms = new Map();
  
  chatNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Verify token and get user (simplified - use your JWT verification)
      const userId = socket.handshake.auth.userId;
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  chatNamespace.on('connection', async (socket) => {
    console.log(`Chat connected: ${socket.user._id} (${socket.user.email})`);
    
    const userId = socket.user._id.toString();
    const userRoom = `user_${userId}`;
    const adminRoom = 'admin_room';
    
    // Join user's personal room
    socket.join(userRoom);
    userRooms.set(userId, userRoom);
    
    // If user is admin, join admin room
    if (socket.user.role === 'admin') {
      socket.join(adminRoom);
      activeAdmins.set(userId, socket.id);
      
      // Notify all admins that an admin joined
      chatNamespace.to(adminRoom).emit('admin_status', {
        adminId: userId,
        online: true,
        totalOnline: activeAdmins.size
      });
    }
    
    // Send online admin count to user
    chatNamespace.to(userRoom).emit('online_admins', {
      count: activeAdmins.size,
      status: activeAdmins.size > 0 ? 'available' : 'unavailable'
    });
    
    // Send chat history
    let messages = await ChatMessage.find({
      $or: [
        { userId: socket.user._id },
        { room: 'general' },
        { type: 'admin', room: userRoom }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'email fullName role profilePicture');
    
    messages = messages.reverse();
    
    socket.emit('chat_history', messages);
    
    // Get user's open tickets
    const tickets = await SupportTicket.find({ 
      userId: socket.user._id,
      status: { $in: ['open', 'in_progress'] }
    }).sort({ updatedAt: -1 });
    
    socket.emit('tickets', tickets);
    
    // Handle incoming messages
    socket.on('send_message', async (data) => {
      try {
        const { message, ticketId, attachments } = data;
        
        
        // 1. Get or Create Ticket
        let ticket;
        if (ticketId) {
          ticket = await SupportTicket.findById(ticketId);
        } else {
          // Find any existing open or in_progress ticket for this user so we don't spam tickets
          ticket = await SupportTicket.findOne({
            userId: socket.user._id,
            status: { $in: ['open', 'in_progress'] }
          }).sort({ updatedAt: -1 });
          
          if (!ticket) {
            // Create new ticket for user messages
            ticket = new SupportTicket({
              userId: socket.user._id,
              subject: 'Chat Support - ' + new Date().toLocaleDateString(),
              category: 'other',
              priority: 'medium',
              status: 'open',
              lastMessage: message.substring(0, 100),
              lastMessageAt: new Date()
            });
            await ticket.save();
            
            // Notify admins of new ticket
            chatNamespace.to('admin_room').emit('new_ticket', {
              _id: ticket._id,
              ticketId: ticket._id,
              ticketNumber: ticket.ticketId,
              subject: ticket.subject,
              category: ticket.category,
              priority: ticket.priority,
              userName: socket.user.fullName || socket.user.email,
              userId: socket.user._id,
              status: ticket.status,
              createdAt: ticket.createdAt,
              updatedAt: ticket.updatedAt
            });
          }
        }

        // 2. Determine target room (user's room)
        let targetRoom = userRoom;
        if (socket.user.role === 'admin' && ticket) {
          targetRoom = `user_${ticket.userId}`;
        }
        
        console.log('Sending message:', {
          role: socket.user.role,
          ticketId,
          ticketUserId: ticket?.userId,
          targetRoom,
          userRoom
        });

        // 3. Create chat message
        const chatMessage = new ChatMessage({
          userId: socket.user._id,
          message,
          type: socket.user.role === 'admin' ? 'admin' : 'user',
          room: targetRoom,
          attachments: attachments || [],
          metadata: {
            userAgent: socket.handshake.headers['user-agent'],
            ip: socket.handshake.address
          }
        });
        
        await chatMessage.save();
        
        // Populate user info
        await chatMessage.populate('userId', 'email fullName role profilePicture');
        
        // 4. Update ticket
        if (ticket) {
          ticket.messages.push(chatMessage._id);
          ticket.lastMessage = message.substring(0, 100);
          ticket.lastMessageAt = new Date();
          
          if (socket.user.role === 'admin') {
             ticket.status = 'in_progress';
             if (!ticket.assignedTo) ticket.assignedTo = socket.user._id;
          } else {
             ticket.status = 'open';
          }
          await ticket.save();
        }
        
        // 5. Emit to user (target room)
        chatNamespace.to(targetRoom).emit('receive_message', {
          ...chatMessage.toObject(),
          ticketId: ticket?._id
        });
        
        // 6. Emit to admins
        if (socket.user.role !== 'admin') {
          chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket?._id
          });
          
          chatNamespace.to(adminRoom).emit('notification', {
            type: 'new_message',
            userId: socket.user._id,
            userName: socket.user.fullName || socket.user.email,
            message: message.substring(0, 50),
            ticketId: ticket?._id,
            timestamp: new Date()
          });

          // Also create a persistent notification in the database
          await createAdminNotification(io, {
            type: 'support',
            title: 'New Support Message',
            message: `${socket.user.fullName || socket.user.email}: ${message.substring(0, 50)}`,
            relatedId: ticket?._id
          });
        } else {
           chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket?._id
          });
        }
        
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { isTyping, ticketId } = data;
      
      if (socket.user.role === 'admin') {
        // Admin typing to user
        chatNamespace.to(userRoom).emit('typing', {
          isTyping,
          from: 'admin',
          ticketId
        });
      } else {
        // User typing to admins
        chatNamespace.to(adminRoom).emit('typing', {
          isTyping,
          from: 'user',
          userId: socket.user._id,
          userName: socket.user.fullName || socket.user.email,
          ticketId
        });
      }
    });
    
    // Handle read receipts
    socket.on('mark_read', async (messageId) => {
      try {
        await ChatMessage.findByIdAndUpdate(messageId, { isRead: true });
        
        if (socket.user.role === 'admin') {
          // Notify user that admin read their message
          chatNamespace.to(userRoom).emit('message_read', { messageId });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('mark_all_read', async (data) => {
      try {
        const { ticketId } = data;
        let query = { isRead: false };
        
        if (socket.user.role === 'admin') {
          // Admin marks user messages as read
          if (ticketId) {
            query.ticketId = ticketId; // Note: Chat model currently doesn't store ticketId directly, let's check
          }
          // Actually, based on previous logic, messages are in rooms
        }
        
        // Revised logic: Mark all messages in the room as read if they are NOT from the sender
        const targetRoom = socket.user.role === 'admin' ? `user_${data.userId}` : userRoom;
        
        await ChatMessage.updateMany(
          { room: targetRoom, userId: { $ne: socket.user._id }, isRead: false },
          { isRead: true }
        );
        
        // Notify the other side
        chatNamespace.to(targetRoom).emit('all_messages_read', { room: targetRoom });
      } catch (error) {
        console.error('Mark all read error:', error);
      }
    });
    
    // Handle ticket creation
    socket.on('create_ticket', async (data) => {
      try {
        const { subject, category, priority, message } = data;
        
        const ticket = new SupportTicket({
          userId: socket.user._id,
          subject,
          category,
          priority,
          status: 'open',
          lastMessage: message?.substring(0, 100) || subject
        });
        
        await ticket.save();
        
        // If there's an initial message, create it
        if (message) {
          const chatMessage = new ChatMessage({
            userId: socket.user._id,
            message,
            type: 'user',
            room: userRoom
          });
          
          await chatMessage.save();
          ticket.messages.push(chatMessage._id);
          await ticket.save();
          
          await chatMessage.populate('userId', 'email fullName role profilePicture');
          
          // Emit to user and admins
          chatNamespace.to(userRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket._id
          });
          
          chatNamespace.to(adminRoom).emit('receive_message', {
            ...chatMessage.toObject(),
            ticketId: ticket._id
          });
        }
        
        socket.emit('ticket_created', ticket);
        
        // Notify admins
        chatNamespace.to(adminRoom).emit('new_ticket', {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketId,
          subject,
          category,
          priority,
          userName: socket.user.fullName || socket.user.email,
          userId: socket.user._id,
          timestamp: new Date()
        });

        // Also create a persistent notification in the database
        await createAdminNotification(io, {
          type: 'support',
          title: 'New Support Ticket',
          message: `${socket.user.fullName || socket.user.email}: ${subject}`,
          relatedId: ticket._id
        });
        
      } catch (error) {
        console.error('Create ticket error:', error);
        socket.emit('error', { message: 'Failed to create ticket' });
      }
    });
    
    // Handle admin actions
    if (socket.user.role === 'admin') {
      // Get all tickets
      socket.on('get_all_tickets', async (filters = {}) => {
        try {
          const query = {};
          
          if (filters.status) query.status = filters.status;
          if (filters.category) query.category = filters.category;
          if (filters.priority) query.priority = filters.priority;
          
          const tickets = await SupportTicket.find(query)
            .populate('userId', 'email fullName role kycStatus profilePicture')
            .populate('assignedTo', 'email fullName')
            .sort({ updatedAt: -1 })
            .limit(100);
          
          socket.emit('all_tickets', tickets);
        } catch (error) {
          console.error('Get tickets error:', error);
        }
      });
      
      // Assign ticket to admin
      socket.on('assign_ticket', async (data) => {
        try {
          const { ticketId } = data;
          
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.assignedTo = socket.user._id;
            ticket.status = 'in_progress';
            await ticket.save();
            
            // Notify assigned admin
            socket.emit('ticket_assigned', ticket);
            
            // Notify user
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status,
              assignedTo: socket.user._id
            });
          }
        } catch (error) {
          console.error('Assign ticket error:', error);
        }
      });
      
      // Resolve ticket
      socket.on('resolve_ticket', async (data) => {
        try {
          const { ticketId, resolutionNote } = data;
          
          const ticket = await SupportTicket.findById(ticketId);
          if (ticket) {
            ticket.status = 'resolved';
            ticket.resolution = {
              note: resolutionNote,
              resolvedBy: socket.user._id,
              resolvedAt: new Date()
            };
            await ticket.save();
            
            // Notify user
            chatNamespace.to(`user_${ticket.userId}`).emit('ticket_updated', {
              ticketId,
              status: ticket.status,
              resolution: ticket.resolution
            });
            
            socket.emit('ticket_resolved', ticket);
          }
        } catch (error) {
          console.error('Resolve ticket error:', error);
        }
      });

      socket.on('edit_message', async (data) => {
        try {
          const { messageId, newMessage } = data;
          const message = await ChatMessage.findById(messageId);
          if (message && message.type === 'admin' && message.userId.toString() === socket.user._id.toString()) {
            message.message = newMessage;
            message.isEdited = true;
            await message.save();

            chatNamespace.to('admin_room').emit('message_edited', { messageId, newMessage, isEdited: true });
            if (message.room !== 'admin_room') {
              chatNamespace.to(message.room).emit('message_edited', { messageId, newMessage, isEdited: true });
            }
          }
        } catch (error) {
          console.error('Edit message error:', error);
        }
      });

      socket.on('delete_message', async (data) => {
        try {
          const { messageId } = data;
          const message = await ChatMessage.findById(messageId);
          if (message && message.type === 'admin' && message.userId.toString() === socket.user._id.toString()) {
            message.isDeleted = true;
            message.message = "This message was deleted";
            await message.save();

            chatNamespace.to('admin_room').emit('message_deleted', { messageId });
            if (message.room !== 'admin_room') {
              chatNamespace.to(message.room).emit('message_deleted', { messageId });
            }
          }
        } catch (error) {
          console.error('Delete message error:', error);
        }
      });
    }
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Chat disconnected: ${socket.user._id}`);
      
      if (socket.user.role === 'admin') {
        activeAdmins.delete(userId);
        
        // Notify other admins
        chatNamespace.to(adminRoom).emit('admin_status', {
          adminId: userId,
          online: false,
          totalOnline: activeAdmins.size
        });
      }
      
      userRooms.delete(userId);
      
      // Update online admin count for all users
      chatNamespace.emit('online_admins', {
        count: activeAdmins.size,
        status: activeAdmins.size > 0 ? 'available' : 'unavailable'
      });
    });
  });
  
  return chatNamespace;
};