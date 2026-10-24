import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  VerifiedUser as CenterIcon,
} from '@mui/icons-material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RecyclingRecord } from '../types';

export const AdminQueuePage: React.FC = () => {
  const { isAdmin, isCenterRep } = useAuth();
  const [tab, setTab] = useState(0); // 0: Submissions Review, 1: Center Verification
  const [queue, setQueue] = useState<RecyclingRecord[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [selectedRecord, setSelectedRecord] = useState<RecyclingRecord | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Center Verify Dialog State
  const [selectedCenter, setSelectedCenter] = useState<any | null>(null);
  const [centerDialogOpen, setCenterDialogOpen] = useState(false);
  const [centerDecision, setCenterDecision] = useState<'verified' | 'rejected'>('verified');
  const [centerRejectReason, setCenterRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        api.getAdminRecordQueue(),
        api.getAllCenters(),
      ]);
      setQueue(q);
      setCenters(c);
    } catch (err) {
      console.error('Failed to load admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecord = async (record: RecyclingRecord) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.reviewRecord(record.record_id, {
        decision: 'approved',
      });
      setActionMessage({
        type: 'success',
        text: `Record ${record.record_id} approved successfully! Awarded ${res.points_awarded} pts. Digital receipt created.`,
      });
      // Refresh queue
      const q = await api.getAdminRecordQueue();
      setQueue(q);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve record.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (record: RecyclingRecord) => {
    setSelectedRecord(record);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    try {
      await api.reviewRecord(selectedRecord.record_id, {
        decision: 'rejected',
        rejection_reason: rejectReason || 'Evidence criteria not met or unverified receipt.',
      });
      setRejectDialogOpen(false);
      setActionMessage({
        type: 'success',
        text: `Record ${selectedRecord.record_id} rejected with recorded reason.`,
      });
      const q = await api.getAdminRecordQueue();
      setQueue(q);
    } catch (err: any) {
      alert(err.message || 'Failed to reject record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVerifyCenter = (center: any) => {
    setSelectedCenter(center);
    setCenterDecision('verified');
    setCenterRejectReason('');
    setCenterDialogOpen(true);
  };

  const handleConfirmCenterVerify = async () => {
    if (!selectedCenter) return;
    setActionLoading(true);
    try {
      await api.verifyCenter(selectedCenter.center_id, {
        status: centerDecision,
        valid_until: centerDecision === 'verified' ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        rejection_reason: centerDecision === 'rejected' ? centerRejectReason : undefined,
      });
      setCenterDialogOpen(false);
      setActionMessage({
        type: 'success',
        text: `Recycling center status updated to '${centerDecision}'. Audit trail recorded.`,
      });
      const c = await api.getAllCenters();
      setCenters(c);
    } catch (err: any) {
      alert(err.message || 'Failed to verify center.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin && !isCenterRep) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Access Denied. You must be signed in as an Administrator or Center Representative to view this queue.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AdminIcon sx={{ color: '#ef4444', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
            Administrative Verification Queue
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
          Review pending citizen drop-off submissions, trigger atomic points awarding transactions, and audit center certifications.
        </Typography>
      </Box>

      {actionMessage && (
        <Alert severity={actionMessage.type} sx={{ mb: 3, borderRadius: 2 }}>
          {actionMessage.text}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              px: 3,
            },
          }}
        >
          <Tab label={`Pending Submissions Queue (${queue.length})`} />
          <Tab label={`Center Verification & Certifications (${centers.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: SUBMISSIONS REVIEW QUEUE */}
      {tab === 0 && (
        <Card sx={{ p: 3 }}>
          {queue.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              The verification queue is empty! All submitted recycling records have been processed.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>DATE</TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>CATEGORY</TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>CENTER</TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>WEIGHT</TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>RECEIPT REF</TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontWeight: 700, textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queue.map((r) => (
                    <TableRow key={r.record_id} hover>
                      <TableCell sx={{ color: '#9ca3af' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                        {r.category_name || r.category_code}
                      </TableCell>
                      <TableCell sx={{ color: '#d1d5db' }}>
                        {r.center_name || 'Recycling Center'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#22d3ee' }}>
                        {r.weight_kg.toFixed(2)} kg
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#f59e0b', fontSize: '0.8rem' }}>
                        {r.receipt_reference || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon fontSize="small" />}
                            onClick={() => handleApproveRecord(r)}
                            disabled={actionLoading}
                            sx={{ fontSize: '0.75rem', py: 0.3 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon fontSize="small" />}
                            onClick={() => handleOpenReject(r)}
                            disabled={actionLoading}
                            sx={{ fontSize: '0.75rem', py: 0.3 }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* TAB 1: CENTER VERIFICATIONS */}
      {tab === 1 && (
        <Card sx={{ p: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>CENTER NAME</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>ADDRESS</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>ACCEPTED CATEGORIES</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700, textAlign: 'right' }}>VERIFICATION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {centers.map((c) => (
                  <TableRow key={c.center_id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                      {c.name}
                    </TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      {c.address}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {c.accepted_categories?.map((code: string) => (
                          <Chip key={code} label={code} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.current_verification_status.toUpperCase()}
                        size="small"
                        color={c.current_verification_status === 'verified' ? 'success' : c.current_verification_status === 'rejected' ? 'error' : 'warning'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenVerifyCenter(c)}
                        sx={{ fontSize: '0.75rem', py: 0.3 }}
                      >
                        Review Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Reject Record Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Recycling Submission</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
            Specify the audit reason for rejecting this evidence (e.g. illegible certificate, unaccepted items).
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Evidence criteria not met..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReject} disabled={actionLoading}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Center Status Dialog */}
      <Dialog open={centerDialogOpen} onClose={() => setCenterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Center Certification Review</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {selectedCenter?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
            Note: User ratings never grant verified status. Centers must pass regulatory compliance audits.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant={centerDecision === 'verified' ? 'contained' : 'outlined'}
              color="success"
              fullWidth
              onClick={() => setCenterDecision('verified')}
            >
              Verify Center
            </Button>
            <Button
              variant={centerDecision === 'rejected' ? 'contained' : 'outlined'}
              color="error"
              fullWidth
              onClick={() => setCenterDecision('rejected')}
            >
              Reject / Revoke
            </Button>
          </Stack>

          {centerDecision === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Rejection Reason"
              value={centerRejectReason}
              onChange={(e) => setCenterRejectReason(e.target.value)}
              placeholder="Regulatory certification missing or expired..."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCenterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmCenterVerify} disabled={actionLoading}>
            Save Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
