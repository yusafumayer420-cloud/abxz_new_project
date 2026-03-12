import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  SupportAgent,
  Add,
  Assignment,
  CheckCircle,
  Pending,
  Error,
  Chat,
  History,
  Search,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

const SupportPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/support/tickets');
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/support/tickets', newTicket);
      setTickets([response.data, ...tickets]);
      setNewTicket({ subject: '', category: 'general', priority: 'medium', message: '' });
      setShowNewTicket(false);
      toast.success('Ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await axios.get(`/api/support/tickets/${ticketId}`);
      setSelectedTicket(response.data.ticket);
      setTicketMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      const response = await axios.post(`/api/support/tickets/${selectedTicket._id}/reply`, {
        message: replyMessage
      });
      
      setTicketMessages([...ticketMessages, response.data]);
      setReplyMessage('');
      
      // Update ticket status
      setSelectedTicket({
        ...selectedTicket,
        status: 'in_progress',
        lastMessageAt: new Date()
      });
      
      // Update in tickets list
      setTickets(tickets.map(t => 
        t._id === selectedTicket._id 
          ? { ...t, status: 'in_progress', lastMessageAt: new Date() }
          : t
      ));
      
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    }
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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 0) return ticket.status !== 'closed' && ticket.status !== 'resolved';
    if (activeTab === 1) return ticket.status === 'closed' || ticket.status === 'resolved';
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Support Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get help with your account, trading, or any issues
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Tickets List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">My Tickets</Typography>
                <Box>
                  <IconButton size="small" onClick={fetchTickets} disabled={loading}>
                    <Refresh />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowNewTicket(true)}
                  >
                    New Ticket
                  </Button>
                </Box>
              </Box>

              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{ mb: 2 }}
              >
                <Tab label="Active" />
                <Tab label="Closed" />
                <Tab label="All" />
              </Tabs>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredTickets.length === 0 ? (
                <Alert severity="info">
                  No {activeTab === 0 ? 'active' : 'closed'} tickets
                </Alert>
              ) : (
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {filteredTickets.map((ticket) => (
                    <React.Fragment key={ticket._id}>
                      <ListItem
                        button
                        selected={selectedTicket?._id === ticket._id}
                        onClick={() => fetchTicketDetails(ticket._id)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(0, 211, 149, 0.1)',
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
                            {getStatusIcon(ticket.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {ticket.subject}
                              </Typography>
                              <Chip
                                label={ticket.priority}
                                size="small"
                                color={getPriorityColor(ticket.priority)}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                {ticket.ticketId} • {ticket.category}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(ticket.updatedAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Common Questions
              </Typography>
              <List>
                {[
                  'How to deposit funds?',
                  'How to withdraw crypto?',
                  'How to verify my account?',
                  'How to use trading features?',
                  'What are the trading fees?'
                ].map((question, index) => (
                  <ListItem key={index} button>
                    <ListItemText primary={question} />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All FAQs
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Ticket Details */}
        <Grid item xs={12} md={8}>
          {selectedTicket ? (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Ticket Header */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {selectedTicket.subject}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={selectedTicket.status} 
                        color={getStatusColor(selectedTicket.status)} 
                        icon={getStatusIcon(selectedTicket.status)}
                      />
                      <Chip 
                        label={selectedTicket.priority} 
                        color={getPriorityColor(selectedTicket.priority)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Ticket: {selectedTicket.ticketId} • Category: {selectedTicket.category} • 
                    Created: {formatDate(selectedTicket.createdAt)}
                  </Typography>
                  
                  {selectedTicket.assignedTo && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Assigned to: {selectedTicket.assignedTo?.email || 'Support Agent'}
                    </Alert>
                  )}
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  {ticketMessages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Chat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary">
                        No messages yet
                      </Typography>
                    </Box>
                  ) : (
                    ticketMessages.map((message) => (
                      <Box
                        key={message._id}
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: message.userId?._id === (user?._id || user?.id) ? 'flex-end' : 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: 3,
                            bgcolor: message.userId?._id === (user?._id || user?.id)
                              ? 'primary.main'
                              : 'background.paper',
                            color: message.userId?._id === (user?._id || user?.id) ? 'white' : 'text.primary',
                            border: message.userId?._id === (user?._id || user?.id)
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {message.userId?._id === (user?._id || user?.id) ? 'You' : 'Support Team'}
                            </Typography>
                          </Box>
                          <Typography variant="body2">{message.message}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {formatDate(message.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Reply Input */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          if (confirm('Are you sure you want to close this ticket?')) {
                            // Handle close ticket
                            toast.success('Ticket closed');
                          }
                        }}
                      >
                        Close Ticket
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim()}
                      >
                        Send Reply
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <SupportAgent sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a ticket to view details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Choose a ticket from the list or create a new one
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowNewTicket(true)}
                  sx={{ mt: 3 }}
                >
                  Create New Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* New Ticket Dialog */}
      {showNewTicket && (
        <Card sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: 500 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Create New Ticket</Typography>
              <IconButton onClick={() => setShowNewTicket(false)}>
                ×
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Subject"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="general">General</option>
                <option value="deposit">Deposit Issue</option>
                <option value="withdrawal">Withdrawal Issue</option>
                <option value="trading">Trading Problem</option>
                <option value="account">Account Issue</option>
                <option value="security">Security Concern</option>
                <option value="kyc">KYC Verification</option>
                <option value="technical">Technical Problem</option>
              </TextField>

              <TextField
                select
                fullWidth
                label="Priority"
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </TextField>
            </Box>

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={6}
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setShowNewTicket(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateTicket}
                disabled={loading || !newTicket.subject || !newTicket.message}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Ticket'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SupportPage;