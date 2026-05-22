import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close,
  Send,
  History,
  SupportAgent,
  Pending,
  Assignment,
  CheckCircle,
  FilterList,
  AttachFile,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const LiveChat = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  // Hide on specific pages
  const hiddenPaths = ['/notifications', '/history'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const [socket, setSocket] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [createTicketDialog, setCreateTicketDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'other',
    priority: 'medium',
    message: ''
  });
  
  const messagesEndRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  // Socket connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const chatSocket = io(`${socketUrl}/chat`, {
      auth: {
        token: localStorage.getItem('token'),
        userId: user?._id || user?.id
      },
      transports: ['websocket', 'polling']
    });

    chatSocket.on('connect', () => {
      console.log('Chat socket connected');
    });

    chatSocket.on('chat_history', (history) => {
      setMessages(history.filter(m => !m.isDeleted));
    });

    chatSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, { ...message, isRead: isOpen }]);
      scrollToBottom();
      
      // Play notification sound for new messages
      if (message.userId._id !== (user?._id || user?.id)) {
        playNotificationSound();
      }
    });

    chatSocket.on('online_admins', (data) => {
      setOnlineAdmins(data.count);
    });

    chatSocket.on('typing', (data) => {
      if (data.from !== (user.role === 'admin' ? 'admin' : 'user')) {
        setTypingIndicator(data.isTyping);
      }
    });

    chatSocket.on('message_read', (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    chatSocket.on('all_messages_read', (data) => {
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    });

    chatSocket.on('tickets', (userTickets) => {
      setTickets(userTickets);
    });

    chatSocket.on('ticket_created', (ticket) => {
      setTickets(prev => [ticket, ...prev]);
      toast.success('Ticket created successfully');
    });

    chatSocket.on('notification', (notification) => {
      if (notification.type === 'new_message' && user.role === 'admin') {
        toast(
          <Box>
            <Typography variant="body2">
              New message from {notification.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {notification.message}...
            </Typography>
          </Box>,
          { duration: 4000 }
        );
      }
    });

    chatSocket.on('error', (error) => {
      toast.error(error.message || 'Chat error occurred');
    });

    chatSocket.on('message_edited', (data) => {
      setMessages(prev => prev.map(msg => 
        String(msg._id) === String(data.messageId) ? { ...msg, message: data.newMessage, isEdited: true } : msg
      ));
    });

    chatSocket.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(msg => String(msg._id) !== String(data.messageId)));
    });

    setSocket(chatSocket);

    return () => {
      chatSocket.disconnect();
    };
  }, [user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Mark all incoming messages as read when chat is opened
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      
      if (socket) {
        socket.emit('mark_all_read', { 
          userId: selectedTicket?.userId?._id || user?._id || user?.id,
          ticketId: selectedTicket?._id 
        });
      }
    }
  }, [isOpen, socket, selectedTicket]);

  const playNotificationSound = () => {
    // Note: notification.mp3 is missing from public folder. 
    // Uncomment and add the file to enable sounds.
    /*
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(console.error);
    */
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !socket) return;
    
    let uploadedUrls = [];
    
    // Handle file upload first if present
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('attachment', selectedFile);
        
        const response = await axios.post('/api/support/upload', formData);
        
        uploadedUrls.push(response.data.url);
      } catch (error) {
        toast.error('Failed to upload file');
        setIsUploading(false);
        return; // Stop sending message if upload fails
      }
      setIsUploading(false);
    }

    socket.emit('send_message', {
      message: newMessage || (selectedFile ? 'Sent an attachment' : ''),
      ticketId: selectedTicket?._id,
      attachments: uploadedUrls
    });

    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', { isTyping: false, ticketId: selectedTicket?._id });
    setIsTyping(false);
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { isTyping: true, ticketId: selectedTicket?._id });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing', { isTyping: false, ticketId: selectedTicket?._id });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateTicket = async () => {
    try {
      const response = await axios.post('/api/support/tickets', newTicket);
      setTickets([response.data, ...tickets]);
      setSelectedTicket(response.data);
      setCreateTicketDialog(false);
      setNewTicket({
        subject: '',
        category: 'other',
        priority: 'medium',
        message: ''
      });
      toast.success('Ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <Pending />;
      case 'in_progress': return <Assignment />;
      case 'resolved': return <CheckCircle />;
      case 'closed': return <History />;
      default: return null;
    }
  };

  // If user is admin, show admin view
  if (user?.role === 'admin') {
    return <AdminChatView socket={socket} user={user} />;
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && !['/trading', '/markets', '/funds', '/profile'].some(path => location.pathname.startsWith(path)) && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Badge
          badgeContent={messages.filter(m => !m.isRead && (m.userId?._id || m.userId) !== (user?._id || user?.id)).length}
          color="error"
          overlap="circular"
        >
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => setIsOpen(true)}
            sx={{
              borderRadius: '50px',
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #00D395 0%, #00B884 100%)',
              boxShadow: '0 4px 20px rgba(0, 211, 149, 0.3)',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(135deg, #00B884 0%, #00A071 100%)',
              }
            }}
          >
            Support
          </Button>
        </Badge>
      </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              width: isMinimized ? 'min(300px, calc(100vw - 40px))' : 'min(400px, calc(100vw - 40px))',
              height: isMinimized ? 60 : 'min(600px, calc(100vh - 100px))',
              zIndex: 9998,
            }}
          >
            <Paper
              elevation={24}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, #131A2E 0%, #0F172A 100%)',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(0, 211, 149, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SupportAgent sx={{ color: '#00D395' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Live Support
                  </Typography>

                </Box>
                <Box>
                  <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? '🗖' : '🗕'}
                  </IconButton>
                  <IconButton size="small" onClick={() => setIsOpen(false)}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              {!isMinimized && (
                <>

                      {/* Messages */}
                      <Box
                        sx={{
                          flex: 1,
                          overflowY: 'auto',
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {messages.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <SupportAgent sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                              No messages yet
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Start a conversation with our support team
                            </Typography>
                          </Box>
                        ) : (
                          messages.map((message, index) => (
                            <motion.div
                              key={message._id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: message.userId?._id === (user?._id || user?.id) ? 'flex-end' : 'flex-start',
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    maxWidth: { xs: '85%', sm: '70%' },
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: message.userId?._id === (user?._id || user?.id)
                                      ? 'rgba(0, 211, 149, 0.1)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                    border: message.userId?._id === (user?._id || user?.id)
                                      ? '1px solid rgba(0, 211, 149, 0.2)'
                                      : '1px solid rgba(255, 255, 255, 0.1)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                      {message.userId?._id === (user?._id || user?.id) 
                                        ? 'You' 
                                        : (message.userId?.role === 'admin' ? 'Support' : (message.userId?.fullName || 'User'))}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      {formatTime(message.createdAt)}
                                    </Typography>
                                  </Box>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                      {message.attachments.map((url, i) => (
                                          <img 
                                            key={i} 
                                            src={url} 
                                            alt="Attachment" 
                                            style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain' }} 
                                            onClick={() => window.open(url, '_blank')}
                                            loading="eager"
                                          />
                                      ))}
                                    </Box>
                                  )}
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {message.message}
                                  </Typography>
                                </Box>
                              </Box>
                            </motion.div>
                          ))
                        )}
                        {typingIndicator && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <motion.div
                                  key="dot1"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <Typography variant="body2">.</Typography>
                                </motion.div>
                                <motion.div
                                  key="dot2"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                >
                                  <Typography variant="body2">.</Typography>
                                </motion.div>
                                <motion.div
                                  key="dot3"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                >
                                  <Typography variant="body2">.</Typography>
                                </motion.div>
                              </Box>
                            </Box>
                          </Box>
                        )}
                        <div ref={messagesEndRef} />
                      </Box>

                      {/* Input Area */}
                      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {selectedFile && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ flexGrow: 1 }} noWrap>
                              {selectedFile.name}
                            </Typography>
                            <IconButton size="small" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <input
                            id="livechat-file-upload"
                            name="livechatFileUpload"
                            autoComplete="off"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                          <IconButton
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ color: selectedFile ? '#00D395' : 'text.secondary' }}
                          >
                            <AttachFile />
                          </IconButton>
                          <TextField
                            id="livechat-message-input"
                            name="livechatMessageInput"
                            autoComplete="off"
                            fullWidth
                            multiline
                            maxRows={3}
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyPress={handleKeyPress}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                              }
                            }}
                          />
                          <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                            sx={{
                              bgcolor: '#00D395',
                              color: 'white',
                              '&:hover': { bgcolor: '#00B884' },
                              '&.Mui-disabled': { bgcolor: 'rgba(0, 211, 149, 0.3)' }
                            }}
                          >
                            {isUploading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                          </IconButton>
                        </Box>

                      </Box>
                </>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Ticket Dialog */}
      <Dialog 
        open={createTicketDialog} 
        onClose={() => setCreateTicketDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <TextField
            id="ticket-subject"
            name="ticketSubject"
            autoComplete="off"
            fullWidth
            label="Subject"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            id="ticket-category"
            name="ticketCategory"
            autoComplete="off"
            select
            fullWidth
            label="Category"
            value={newTicket.category}
            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
            sx={{ mb: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="deposit">Deposit Issue</option>
            <option value="withdrawal">Withdrawal Issue</option>
            <option value="trading">Trading Problem</option>
            <option value="account">Account Issue</option>
            <option value="security">Security Concern</option>
            <option value="kyc">KYC Verification</option>
            <option value="technical">Technical Problem</option>
            <option value="other">Other</option>
          </TextField>
          
          <TextField
            id="ticket-priority"
            name="ticketPriority"
            autoComplete="off"
            select
            fullWidth
            label="Priority"
            value={newTicket.priority}
            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
            sx={{ mb: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </TextField>
          
          <TextField
            id="ticket-message"
            name="ticketMessage"
            autoComplete="off"
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={newTicket.message}
            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
            placeholder="Describe your issue in detail..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTicketDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTicket}
            disabled={!newTicket.subject.trim()}
          >
            Create Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Admin Chat View Component
const AdminChatView = ({ socket, user }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: ''
  });
  const [stats, setStats] = useState(null);
  const adminMessagesEndRef = useRef(null);

  const scrollAdminToBottom = () => {
    setTimeout(() => {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollAdminToBottom();
  }, [ticketMessages]);

  useEffect(() => {
    if (socket) {
      socket.emit('get_all_tickets', filters);
      
      socket.on('all_tickets', (data) => {
        setTickets(data);
      });
      
      socket.on('new_ticket', (ticket) => {
        toast.success(`New ticket: ${ticket.ticketNumber}`);
        // Refresh tickets
        socket.emit('get_all_tickets', filters);
      });

      socket.on('receive_message', (message) => {
        if (selectedTicket && (message.ticketId === selectedTicket._id || message.room === `user_${selectedTicket.userId._id}`)) {
          setTicketMessages(prev => [...prev, message]);
        }
      });

      socket.on('message_edited', (data) => {
        setTicketMessages(prev => prev.map(msg => 
          String(msg._id) === String(data.messageId) ? { ...msg, message: data.newMessage, isEdited: true } : msg
        ));
      });

      socket.on('message_deleted', (data) => {
        setTicketMessages(prev => prev.map(msg => 
          String(msg._id) === String(data.messageId) ? { ...msg, message: "This message was deleted", isDeleted: true } : msg
        ));
      });
      
      return () => {
        socket.off('all_tickets');
        socket.off('new_ticket');
        socket.off('receive_message');
        socket.off('message_edited');
        socket.off('message_deleted');
      };
    }
    
    // Fetch stats
    fetchStats();
  }, [socket, filters, selectedTicket]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/support/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAssignTicket = (ticketId) => {
    socket.emit('assign_ticket', { ticketId });
  };

  const handleResolveTicket = (ticketId, resolutionNote) => {
    socket.emit('resolve_ticket', { ticketId, resolutionNote });
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      const response = await axios.get(`/api/support/tickets/${ticketId}`);
      setTicketMessages(response.data.messages);
      setSelectedTicket(response.data.ticket);
    } catch (error) {
      console.error('Failed to fetch ticket messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket || !socket) return;
    
    socket.emit('send_message', {
      message: newMessage,
      ticketId: selectedTicket._id
    });
    
    setNewMessage('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Support Dashboard
      </Typography>
      
      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Tickets
                </Typography>
                <Typography variant="h4">{stats.totalTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Open Tickets
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.openTickets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  In Progress
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.inProgressTickets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Resolution
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.avgResolutionHours.toFixed(1)}h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Grid container spacing={3}>
        {/* Ticket List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Tickets</Typography>
                <IconButton size="small">
                  <FilterList />
                </IconButton>
              </Box>
              
              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  id="admin-filter-status"
                  name="adminFilterStatus"
                  autoComplete="off"
                  select
                  size="small"
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  sx={{ flex: 1 }}
                  SelectProps={{ native: true }}
                >
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </TextField>
                
                <TextField
                  id="admin-filter-priority"
                  name="adminFilterPriority"
                  autoComplete="off"
                  select
                  size="small"
                  label="Priority"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  sx={{ flex: 1 }}
                  SelectProps={{ native: true }}
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </TextField>
              </Box>
              
              {/* Ticket List */}
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {tickets.map((ticket) => (
                  <ListItem
                    key={ticket._id}
                    button
                    selected={selectedTicket?._id === ticket._id}
                    onClick={() => fetchTicketMessages(ticket._id)}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(0, 211, 149, 0.1)',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {ticket.ticketId}
                          </Typography>
                          <Chip
                            label={ticket.status}
                            size="small"
                            color={getStatusColor(ticket.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {ticket.userId?.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.subject}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {ticket.category} • {ticket.priority}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {selectedTicket ? (
                <>
                  {/* Ticket Header */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedTicket.subject}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={selectedTicket.status} color={getStatusColor(selectedTicket.status)} />
                        <Chip label={selectedTicket.priority} color="primary" variant="outlined" />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Ticket: {selectedTicket.ticketId} • User: {selectedTicket.userId?.email} • 
                      Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </Typography>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {selectedTicket.status === 'open' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAssignTicket(selectedTicket._id)}
                        >
                          Assign to Me
                        </Button>
                      )}
                      {selectedTicket.status === 'in_progress' && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => {
                            const note = prompt('Resolution notes:');
                            if (note) handleResolveTicket(selectedTicket._id, note);
                          }}
                        >
                          Resolve Ticket
                        </Button>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Messages */}
                    <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                      {ticketMessages.map((message, index) => (
                        <Box
                          key={message._id || `admin-msg-${index}`}
                          sx={{
                            mb: 2,
                            display: 'flex',
                            justifyContent: message.userId._id === user.id ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: 2,
                              bgcolor: message.userId._id === user.id
                                ? 'rgba(0, 211, 149, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                              {message.userId._id === user.id ? 'You' : message.userId?.email}
                            </Typography>
                            {message.attachments && message.attachments.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                {message.attachments.map((url, i) => (
                                  <img 
                                    key={i} 
                                    src={url} 
                                    alt="Attachment" 
                                    style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain', cursor: 'pointer' }} 
                                    onClick={() => window.open(url, '_blank')}
                                    loading="eager"
                                  />
                                ))}
                              </Box>
                            )}
                            <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontStyle: message.isDeleted ? 'italic' : 'normal', opacity: message.isDeleted ? 0.7 : 1 }}>
                              {message.message}
                              {message.isEdited && !message.isDeleted && (
                                <Typography component="span" variant="caption" sx={{ opacity: 0.6, ml: 1 }}>(edited)</Typography>
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      <div ref={adminMessagesEndRef} />
                    </Box>
                  
                  {/* Message Input */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      id="admin-reply-input"
                      name="adminReplyInput"
                      autoComplete="off"
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SupportAgent sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a ticket to view conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click on any ticket from the list to start chatting
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveChat;