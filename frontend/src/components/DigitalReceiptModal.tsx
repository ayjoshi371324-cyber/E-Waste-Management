import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  Print as PrintIcon,
  VerifiedUser as ShieldIcon,
} from '@mui/icons-material';
import { Receipt } from '../types';

interface DigitalReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ open, onClose, receipt }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: '#0d131f',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
          },
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldIcon sx={{ color: '#10b981', fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
            Official Recycling Certificate
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#9ca3af' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        {/* Printable Certificate Frame */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: '2px dashed rgba(16, 185, 129, 0.35)',
            backgroundColor: 'rgba(16, 185, 129, 0.03)',
            position: 'relative',
          }}
        >
          {/* Certificate Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                mb: 1,
              }}
            >
              <VerifiedIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
              VERIFIED E-WASTE RECYCLING
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', letterSpacing: '0.1em', fontWeight: 700 }}>
              OFFICIAL DIGITAL CERTIFICATE OF DESTRUCTION & RECOVERY
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Key Certificate Details */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                RECEIPT REFERENCE
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#34d399' }}>
                {receipt.receipt_reference}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                ISSUANCE DATE
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {receipt.issuance_date}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                CERTIFIED RECYCLING CENTER
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                {receipt.center_name || 'Certified E-Waste Facility'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                {receipt.center_address || 'Registered PostGIS Location'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                CERTIFIED WEIGHT
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#22d3ee' }}>
                {receipt.weight_kg ? `${receipt.weight_kg.toFixed(2)} kg` : 'Verified weight'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                VERIFICATION CODE
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600, wordBreak: 'break-all' }}>
                {receipt.verification_code}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
              Record ID: {receipt.record_id}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Enforced by PostgreSQL Transactional Stored Procedure & Double-Entry Ledger
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: '#9ca3af', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          Print Certificate
        </Button>
      </DialogActions>
    </Dialog>
  );
};
