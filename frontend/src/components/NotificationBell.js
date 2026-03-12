import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import socket from '../socket';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    if (user?._id) {
      socket.emit('join_user', user._id);

      const handleNotification = (data) => {
        const newNotif = {
          id: Date.now(),
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          time: 'Just now',
          read: false,
          ...data
        };
        setNotifications(prev => [newNotif, ...prev]);
      };

      socket.on('order_placed', handleNotification);
      socket.on('transaction_requested', handleNotification);
      socket.on('transaction_updated', (data) => {
        handleNotification({
          title: 'Transaction Updated',
          message: `Your ${data.type} of ${data.amount} ${data.currency} is now ${data.status}`,
          type: data.status === 'completed' ? 'success' : (data.status === 'rejected' ? 'error' : 'info')
        });
      });
      socket.on('new_chat_message', (data) => {
        if (data.sender === 'admin' || data.senderRole === 'admin') {
          handleNotification({
            title: 'New Message',
            message: data.message,
            type: 'info'
          });
        }
      });

      return () => {
        socket.off('order_placed');
        socket.off('transaction_requested');
        socket.off('transaction_updated');
        socket.off('new_chat_message');
      };
    }
  }, [user]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle sx={{ color: '#00D395' }} />;
      case 'error': return <Error sx={{ color: '#FF6B6B' }} />;
      case 'info': return <Info sx={{ color: '#4361EE' }} />;
      case 'trend': return <TrendingUp sx={{ color: '#7209B7' }} />;
      default: return <Info />;
    }
  };

  return (
    <>
      <motion.div whileTap={{ scale: 0.9 }}>
        <IconButton onClick={handleClick} sx={{ color: 'white' }}>
          <Badge badgeContent={unreadCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </motion.div>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            <Box>
              {unreadCount > 0 && (
                <Button size="small" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button size="small" color="error" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </Box>
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                >
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                      bgcolor: notification.read ? 'transparent' : 'rgba(0,211,149,0.05)',
                      cursor: 'pointer',
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;