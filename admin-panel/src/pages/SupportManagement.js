import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
} from "@mui/material";
import {
  Search,
  FilterList,
  MoreVert,
  SupportAgent,
  ChatBubble,
  CheckCircle,
  Assignment,
  Close,
  Send,
  Attachment,
  Schedule,
  PriorityHigh,
  LowPriority,
  Download,
  Refresh,
  Add,
  Visibility,
  Edit,
  Delete
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import io from "socket.io-client";
import axios from "axios";
import api from "../api";

const SupportManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [chatDialog, setChatDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    sortBy: "newest",
  });

  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const fileInputRef = React.useRef(null);
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionHours: 0
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      if (socket) {
        socket.emit('get_all_tickets', filters);
      } else {
        const response = await api.get('/api/support/admin/tickets', { params: filters });
        setTickets(response.data.tickets || []);
      }
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [socket, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/support/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const filterTickets = useCallback(() => {
    // ... logic same but inside callback
    let filtered = [...tickets];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          (ticket.userName || '').toLowerCase().includes(term) ||
          (ticket.subject || '').toLowerCase().includes(term) ||
          (ticket.id || '').toLowerCase().includes(term),
      );
    }
    if (filters.status) filtered = filtered.filter((ticket) => ticket.status === filters.status);
    if (filters.priority) filtered = filtered.filter((ticket) => ticket.priority === filters.priority);
    if (filters.category) filtered = filtered.filter((ticket) => ticket.category === filters.category);
    if (activeTab === 1) filtered = filtered.filter((t) => t.status === "open");
    if (activeTab === 2) filtered = filtered.filter((t) => t.status === "in_progress");
    if (activeTab === 3) filtered = filtered.filter((t) => t.status === "resolved");
    if (activeTab === 4) filtered = filtered.filter((t) => t.status === "closed");
    filtered.sort((a, b) => {
      if (filters.sortBy === "newest") return new Date(b.updatedAt) - new Date(a.updatedAt);
      if (filters.sortBy === "oldest") return new Date(a.updatedAt) - new Date(b.updatedAt);
      if (filters.sortBy === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, filters, activeTab]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminData');
    if (!token || !userData) return;

    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'super_admin') return;

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    console.log('Connecting to support socket at:', socketUrl);
    
    const supportSocket = io(`${socketUrl}/chat`, {
      auth: {
        token: token,
        userId: user.id || user._id
      },
      transports: ['websocket', 'polling']
    });

    supportSocket.on('connect', () => {
      console.log('Support socket connected successfully');
      supportSocket.emit('get_all_tickets', filters);
    });

    supportSocket.on('connect_error', (err) => {
      console.error('Support socket connection error:', err.message);
    });

    supportSocket.on('all_tickets', (data) => {
      setTickets(data);
      setLoading(false);
    });

    supportSocket.on('new_ticket', (ticket) => {
      toast.success(`New ticket: ${ticket.ticketNumber}`);
      setTickets(prev => [ticket, ...prev]);
    });

    supportSocket.on('receive_message', (message) => {
      console.log('Received message:', message);
      
      // Play sound if message is from user
      if (message.type === 'user') {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
      }

      // Add to chat messages if the dialog is open for this ticket
      if (selectedTicket && (message.ticketId === selectedTicket._id || message.ticketId === selectedTicket.id)) {
        setChatMessages(prev => {
          // Check if message already exists (either by real ID or by content matching a temp message)
          const isDuplicate = prev.some(msg => 
            String(msg._id) === String(message._id) || 
            (msg._id.startsWith('temp-') && msg.message === message.message && msg.userId?._id === message.userId?._id)
          );
          if (isDuplicate) {
            // Replace the temp message with the real one to get the proper ID
            return prev.map(msg => 
              (msg._id.startsWith('temp-') && msg.message === message.message && msg.userId?._id === message.userId?._id)
                ? message
                : msg
            );
          }
          return [...prev, message];
        });
        // Auto scroll to bottom when new message arrives
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-messages-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      }
      // Refresh tickets list to update last message
      supportSocket.emit('get_all_tickets', filters);
    });

    supportSocket.on('ticket_assigned', (ticket) => {
      setTickets(prev => prev.map(t => t._id === ticket._id ? ticket : t));
      if (selectedTicket?._id === ticket._id) {
        setSelectedTicket(ticket);
      }
    });

    supportSocket.on('ticket_resolved', (ticket) => {
      setTickets(prev => prev.map(t => t._id === ticket._id ? ticket : t));
      if (selectedTicket?._id === ticket._id) {
        setSelectedTicket(ticket);
      }
      toast.success('Ticket resolved');
    });

    supportSocket.on('error', (error) => {
      toast.error(error.message || 'Support system error');
    });

    supportSocket.on('message_edited', (data) => {
      setChatMessages(prev => prev.map(msg => 
        String(msg._id) === String(data.messageId) ? { ...msg, message: data.newMessage, isEdited: true } : msg
      ));
    });

    supportSocket.on('message_deleted', (data) => {
      setChatMessages(prev => prev.map(msg => 
        String(msg._id) === String(data.messageId) ? { ...msg, message: "This message was deleted", isDeleted: true } : msg
      ));
    });

    setSocket(supportSocket);

    return () => {
      console.log('Disconnecting support socket');
      supportSocket.disconnect();
    };
  }, []); // Only connect once on mount

  useEffect(() => {
    if (socket) {
      socket.emit('get_all_tickets', filters);
    }
  }, [socket, filters]); // Handle filter changes without reconnecting

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);


  const handleMenuClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewTicket = () => {
    setViewDialog(true);
    handleMenuClose();
  };

  const handleOpenChat = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/support/tickets/${selectedTicket._id || selectedTicket.id}`);
      setChatMessages(response.data.messages || []);
      setChatDialog(true);
      
      // Mark that we're viewing this ticket for real-time updates
      console.log('Opened chat for ticket:', selectedTicket._id || selectedTicket.id);
      
      // Auto scroll to bottom after messages load
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 300);
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
    handleMenuClose();
  };

  const handleAssignToMe = () => {
    if (!socket || !selectedTicket) return;
    socket.emit('assign_ticket', { ticketId: selectedTicket._id || selectedTicket.id });
    handleMenuClose();
  };

  const handleResolveTicket = () => {
    if (!socket || !selectedTicket) return;
    const note = window.prompt("Resolution note (optional):");
    socket.emit('resolve_ticket', { 
      ticketId: selectedTicket._id || selectedTicket.id,
      resolutionNote: note || "Resolved by admin"
    });
    handleMenuClose();
  };

  const handleCloseTicket = () => {
    if (!selectedTicket) return;
    // We can reuse resolve or add a dedicated close event
    handleResolveTicket();
  };

  const handleSendMessage = async () => {
    if ((!replyMessage.trim() && !selectedFile) || !socket || !selectedTicket) {
      console.warn('Cannot send message:', { 
        hasMessage: !!replyMessage.trim(), 
        hasSocket: !!socket, 
        socketConnected: socket?.connected, 
        hasTicket: !!selectedTicket 
      });
      return;
    }

    console.log('Sending message to ticket:', {
      ticketId: selectedTicket._id || selectedTicket.id,
      socketId: socket.id,
      connected: socket.connected
    });
    
    let uploadedUrls = [];
    
    // Handle file upload first if present
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('attachment', selectedFile);
        
        // Use regular axios for the upload to port 5000 since admin API proxy might not cover /api/support/upload
        const response = await api.post('/api/support/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        uploadedUrls.push(response.data.url);
      } catch (error) {
        toast.error('Failed to upload file');
        setIsUploading(false);
        return; // Stop sending message if upload fails
      }
      setIsUploading(false);
    }
    
    const adminUser = JSON.parse(localStorage.getItem('adminData') || '{}');
    
    // Immediately add the message to local state for instant feedback (optimistic UI)
    const tempMessage = {
      _id: 'temp-' + Date.now(),
      message: replyMessage || (selectedFile ? 'Sent an attachment' : ''),
      type: 'admin',
      createdAt: new Date(),
      attachments: uploadedUrls,
      userId: {
        _id: adminUser.id || adminUser._id,
        fullName: adminUser.fullName || adminUser.name || 'Admin',
        email: adminUser.email
      }
    };
    setChatMessages(prev => [...prev, tempMessage]);
    
    // Send to server
    socket.emit('send_message', {
      message: replyMessage || (selectedFile ? 'Sent an attachment' : ''),
      ticketId: selectedTicket._id || selectedTicket.id,
      attachments: uploadedUrls
    });
    
    // Auto scroll to bottom
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);

    setReplyMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditMessageClick = (msg) => {
    setEditingMessageId(msg._id);
    setEditingMessageContent(msg.message);
  };

  const handleSaveEditMessage = () => {
    if (!editingMessageContent.trim() || !socket || !editingMessageId) return;
    
    // Optimistic UI update
    setChatMessages(prev => prev.map(msg => 
      msg._id === editingMessageId ? { ...msg, message: editingMessageContent, isEdited: true } : msg
    ));

    socket.emit('edit_message', {
      messageId: editingMessageId,
      newMessage: editingMessageContent
    });

    setEditingMessageId(null);
    setEditingMessageContent("");
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageContent("");
  };

  const handleDeleteMessageClick = (msgId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      // Optimistic UI update
      setChatMessages(prev => prev.map(msg => 
        msg._id === msgId ? { ...msg, message: "This message was deleted", isDeleted: true } : msg
      ));

      socket.emit('delete_message', { messageId: msgId });
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "error";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      default:
        return "info";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <PriorityHigh />;
      case "high":
        return <PriorityHigh />;
      case "medium":
        return <Schedule />;
      case "low":
        return <LowPriority />;
      default:
        return <Schedule />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "deposit":
        return "success";
      case "withdrawal":
        return "warning";
      case "trading":
        return "info";
      case "kyc":
        return "primary";
      case "security":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const StatsCard = ({ title, value, icon, color, change }) => (
    <Card className="admin-card">
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", my: 1 }}>
              {value}
            </Typography>
            {change && (
              <Typography
                variant="caption"
                sx={{ color: change >= 0 ? "#00D395" : "#FF6B6B" }}
              >
                {change >= 0 ? "+" : ""}
                {change} from yesterday
              </Typography>
            )}
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  const categories = [
    { label: "All", value: "", icon: "📋", count: tickets.length },
    {
      label: "Open",
      value: "open",
      icon: "🟢",
      count: tickets.filter((t) => t.status === "open").length,
    },
    {
      label: "In Progress",
      value: "in_progress",
      icon: "🟡",
      count: tickets.filter((t) => t.status === "in_progress").length,
    },
    {
      label: "Resolved",
      value: "resolved",
      icon: "✅",
      count: tickets.filter((t) => t.status === "resolved").length,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Support Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer support tickets and inquiries
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTickets}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Chats"
            value={stats.openTickets}
            icon={<SupportAgent />}
            color="#FF6B6B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Being Handled"
            value={stats.inProgressTickets}
            icon={<Schedule />}
            color="#FFC107"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Resolved Chats"
            value={stats.resolvedTickets}
            icon={<CheckCircle />}
            color="#00D395"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Avg. Resolution"
            value={`${stats.avgResolutionHours.toFixed(1)}h`}
            icon={<ChatBubble />}
            color="#4361EE"
          />
        </Grid>
      </Grid>

      {/* Categories */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Chat Status
          </Typography>
          <Grid container spacing={2}>
            {categories.map((category) => (
              <Grid item xs={6} sm={4} md={3} key={category.label}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    fullWidth
                    variant={
                      filters.category === category.value
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      setFilters({ ...filters, status: category.value })
                    }
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ fontSize: 24, mb: 1 }}>{category.icon}</Box>
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                      {category.label}
                    </Typography>
                    {category.count > 0 && (
                      <Badge
                        badgeContent={category.count}
                        color="error"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search chats by user..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              sx={{ width: 150 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>



            <TextField
              select
              size="small"
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              sx={{ width: 150 }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </TextField>

            <IconButton>
              <FilterList />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": { fontWeight: "bold" },
          }}
        >

          <Tab label="All Chats" />
          <Tab label="Open" />
          <Tab label="In Progress" />
          <Tab label="Resolved" />
        </Tabs>
      </Paper>

      {/* Tickets Table */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">
              Live Chats ({filteredTickets.length})
            </Typography>
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption">Loading...</Typography>
                <LinearProgress sx={{ width: 100 }} />
              </Box>
            )}
          </Box>

          {filteredTickets.length === 0 ? (
            <Alert severity="info">
              No active chats found matching your criteria
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Chat ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Last Message</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket._id || ticket.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {ticket.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(ticket.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {(typeof ticket.userId === 'object' ? (ticket.userId?.fullName || ticket.userId?.email || 'U') : 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {typeof ticket.userId === 'object' ? (ticket.userId?.fullName || ticket.userId?.email || 'Unknown User') : 'Unknown User'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {typeof ticket.userId === 'object' ? (ticket.userId?._id || ticket.userId?.id || 'N/A') : (ticket.userId || 'N/A')}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {ticket.subject}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {ticket.lastMessage}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.category}
                          size="small"
                          color={getCategoryColor(ticket.category)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.priority}
                          size="small"
                          color={getPriorityColor(ticket.priority)}
                          icon={getPriorityIcon(ticket.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status.replace("_", " ")}
                          size="small"
                          color={getStatusColor(ticket.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {ticket.assignedTo ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: 12,
                                bgcolor: "#00D395",
                              }}
                            >
                              {((typeof ticket.assignedTo === 'object' ? (ticket.assignedTo?.fullName || ticket.assignedTo?.name || '') : ticket.assignedTo) || 'A').charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {typeof ticket.assignedTo === 'object' ? (ticket.assignedTo?.fullName || ticket.assignedTo?.name || 'Assigned') : (ticket.assignedTo || 'Assigned')}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Unassigned"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getTimeAgo(ticket.updatedAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.messages?.length || 0} messages
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, ticket)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Ticket Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewTicket}>
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleOpenChat}>
          <ChatBubble sx={{ mr: 2 }} />
          Open Chat
        </MenuItem>
        {!selectedTicket?.assignedTo && (
          <MenuItem onClick={handleAssignToMe}>
            <Assignment sx={{ mr: 2 }} />
            Assign to Me
          </MenuItem>
        )}
        {selectedTicket?.status !== "resolved" &&
          selectedTicket?.status !== "closed" && (
            <MenuItem onClick={handleResolveTicket}>
              <CheckCircle sx={{ mr: 2, color: "#00D395" }} />
              Mark as Resolved
            </MenuItem>
          )}
        {selectedTicket?.status !== "closed" && (
          <MenuItem onClick={handleCloseTicket}>
            <Close sx={{ mr: 2 }} />
            Close Ticket
          </MenuItem>
        )}
      </Menu>

      {/* View Ticket Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>Ticket Details - {selectedTicket.id}</DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#00D395",
                        width: 60,
                        height: 60,
                        fontSize: 24,
                      }}
                    >
                      {(selectedTicket.userName || 'U').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {selectedTicket.subject || 'No Subject'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTicket.userName || 'Unknown User'} • ID: {typeof selectedTicket.userId === 'object' ? (selectedTicket.userId?._id || selectedTicket.userId?.id || 'N/A') : (selectedTicket.userId || 'N/A')}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Chip
                          label={selectedTicket.category}
                          color={getCategoryColor(selectedTicket.category)}
                        />
                        <Chip
                          label={selectedTicket.priority}
                          color={getPriorityColor(selectedTicket.priority)}
                          icon={getPriorityIcon(selectedTicket.priority)}
                        />
                        <Chip
                          label={selectedTicket.status.replace("_", " ")}
                          color={getStatusColor(selectedTicket.status)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Ticket Information
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ "& > *": { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Created:</strong>{" "}
                        {formatDate(selectedTicket.createdAt)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Updated:</strong>{" "}
                        {formatDate(selectedTicket.updatedAt)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Messages:</strong> {selectedTicket.messages?.length || 0}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Assigned To:</strong>{" "}
                        {typeof selectedTicket.assignedTo === 'object' ? (selectedTicket.assignedTo?.fullName || selectedTicket.assignedTo?.name || 'Unassigned') : (selectedTicket.assignedTo || 'Unassigned')}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Quick Actions
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<ChatBubble />}
                        onClick={handleOpenChat}
                        fullWidth
                      >
                        Open Chat
                      </Button>
                      {!selectedTicket.assignedTo && (
                        <Button
                          variant="contained"
                          startIcon={<Assignment />}
                          onClick={handleAssignToMe}
                          fullWidth
                        >
                          Assign to Me
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={handleResolveTicket}
                        fullWidth
                      >
                        Mark as Resolved
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Last Message
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.1)" }}>
                    <Typography variant="body2">
                      "{selectedTicket.lastMessage}"
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
              <Button variant="contained" onClick={handleOpenChat}>
                Open Chat
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={chatDialog}
        onClose={() => setChatDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 768}
      >
        {selectedTicket && (
          <>
            <DialogTitle
              sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#00D395" }}>
                    {(selectedTicket.userName || 'U').charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedTicket.userName || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ticket: {selectedTicket.id} • {selectedTicket.subject}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={selectedTicket.status}
                  color={getStatusColor(selectedTicket.status)}
                />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, height: "60vh" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Messages */}
                <Box className="chat-messages-container" sx={{ flex: 1, overflow: "auto", p: 2 }}>
                  <List sx={{ width: "100%" }}>
                    {chatMessages.map((msg) => (
                      <React.Fragment key={msg._id || msg.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            flexDirection:
                              msg.type === "admin" ? "row-reverse" : "row",
                            textAlign: msg.type === "admin" ? "right" : "left",
                          }}
                        >
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                bgcolor:
                                  msg.type === "admin" ? "#00D395" : "#4361EE",
                                width: 32,
                                height: 32,
                              }}
                            >
                              {(msg.userId?.fullName || msg.userId?.email || 'U').charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <Box
                            sx={{
                              maxWidth: "70%",
                              ml: msg.type === "admin" ? 0 : 2,
                              mr: msg.type === "admin" ? 2 : 0,
                            }}
                          >
                            <Paper
                              sx={{
                                p: 2,
                                bgcolor:
                                  msg.type === "admin"
                                    ? "rgba(0, 211, 149, 0.1)"
                                    : "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 2,
                              }}
                            >
                              {msg.attachments && msg.attachments.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  {msg.attachments.map((url, i) => (
                                    <img 
                                      key={i} 
                                      src={url} 
                                      alt="Attachment" 
                                      style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain', cursor: 'pointer' }}
                                      onClick={() => window.open(url, '_blank')}
                                    />
                                  ))}
                                </Box>
                              )}
                              
                              {editingMessageId === msg._id ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <TextField 
                                    fullWidth
                                    multiline
                                    size="small"
                                    value={editingMessageContent}
                                    onChange={(e) => setEditingMessageContent(e.target.value)}
                                  />
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button size="small" onClick={handleCancelEditMessage}>Cancel</Button>
                                    <Button size="small" variant="contained" onClick={handleSaveEditMessage}>Save</Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontStyle: msg.isDeleted ? 'italic' : 'normal', opacity: msg.isDeleted ? 0.7 : 1 }}>
                                    {msg.message}
                                    {msg.isEdited && !msg.isDeleted && (
                                      <Typography component="span" variant="caption" sx={{ opacity: 0.6, ml: 1 }}>(edited)</Typography>
                                    )}
                                  </Typography>
                                  
                                  {msg.type === "admin" && !msg.isDeleted && (
                                    (() => {
                                      const adminUser = JSON.parse(localStorage.getItem('adminData') || '{}');
                                      const isOwnMessage = msg.userId && (msg.userId._id === adminUser.id || msg.userId._id === adminUser._id || msg.userId === adminUser.id || msg.userId === adminUser._id);
                                      if (isOwnMessage) {
                                        return (
                                          <Box sx={{ display: 'flex', ml: 2, opacity: 0.5, '&:hover': { opacity: 1 } }}>
                                            <IconButton size="small" onClick={() => handleEditMessageClick(msg)} sx={{ p: 0.5 }}>
                                              <Edit sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteMessageClick(msg._id)} sx={{ p: 0.5 }}>
                                              <Delete sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Box>
                                        );
                                      }
                                      return null;
                                    })()
                                  )}
                                </Box>
                              )}
                            </Paper>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {msg.userId?.fullName || msg.userId?.email || 'Support'} • {getTimeAgo(msg.createdAt || msg.time)}
                            </Typography>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>

                {/* Reply Box */}
                <Box
                  sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {selectedFile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ flexGrow: 1 }} noWrap>
                        {selectedFile.name}
                      </Typography>
                      <IconButton size="small" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", gap: 1, alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <IconButton
                      color={selectedFile ? 'primary' : 'default'}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Attachment />
                    </IconButton>
                    <TextField
                      fullWidth
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      multiline
                      maxRows={4}
                      variant="outlined"
                      size="small"
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={(!replyMessage.trim() && !selectedFile) || isUploading}
                      sx={{ alignSelf: "flex-end" }}
                    >
                      {isUploading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Press Enter to send, Shift+Enter for new line
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleResolveTicket}
                      startIcon={<CheckCircle />}
                    >
                      Resolve Ticket
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Button onClick={() => setChatDialog(false)}>Close Chat</Button>
              <Button variant="contained" onClick={handleResolveTicket}>
                Mark as Resolved
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SupportManagement;
