import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TradeResultModal = ({ open, onClose, trade, currentPrice }) => {
  if (!trade) return null;

  const isWin = trade.outcome === 'win';
  const direction = trade.type === 'long' ? 'Buy Long' : 'Buy Short';
  const directionColor = trade.type === 'long' ? '#00D395' : '#FF6B6B';

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose();
        }
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: 'rgba(23, 27, 38, 0.95)',
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
          color: '#fff',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', p: 3 }}>


          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 4 }}>
            {trade.pair} Delivery
          </Typography>

          {/* Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Purchase price</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {trade.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Current price</Typography>
              <Typography sx={{ fontWeight: 'bold', color: '#00D395' }}>
                {currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : trade.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Direction</Typography>
              <Typography sx={{ fontWeight: 'bold', color: directionColor }}>
                {direction}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Amount</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {trade.amount}USDT
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Delivery time</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                {trade.deliverySeconds}s
              </Typography>
            </Box>
          </Box>

          {/* Result Message */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: isWin ? '#00D395' : '#FF6B6B' }}>
              {isWin ? `+${trade.profitAmount?.toFixed(2)} USDT` : `-${trade.total?.toFixed(2)} USDT`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isWin ? 'Trade outcome: Win' : 'Trade outcome: Loss'}
            </Typography>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: '#4361EE',
                borderRadius: 3,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': { bgcolor: '#3651d1' }
              }}
            >
              Close
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TradeResultModal;
