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
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  FactCheck as SubmitIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
  ReceiptLong as ReceiptIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DeviceCategory, Receipt, RecyclingRecord } from '../types';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';

export const SubmitEvidencePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCategoryCode = searchParams.get('category') || '';
  const initialPhotoId = searchParams.get('photo_id') || '';

  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<RecyclingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [centerId, setCenterId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [weightKg, setWeightKg] = useState('1.5');
  const [estimatedUnits, setEstimatedUnits] = useState('1');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, ctrs] = await Promise.all([
        api.getCategories(),
        api.getAllCenters(),
      ]);
      setCategories(cats);
      setCenters(ctrs);

      if (initialCategoryCode) {
        const found = cats.find((c) => c.code === initialCategoryCode);
        if (found) setCategoryId(found.category_id);
      } else if (cats.length > 0) {
        setCategoryId(cats[0].category_id);
      }

      if (ctrs.length > 0) {
        setCenterId(ctrs[0].center_id);
      }

      if (user) {
        const recs = await api.getMyRecords();
        setMyRecords(recs);
      }
    } catch (err) {
      console.error('Failed to load initial submission data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const rec = await api.submitRecord({
        center_id: centerId,
        category_id: categoryId,
        weight_kg: parseFloat(weightKg),
        estimated_units: parseInt(estimatedUnits, 10),
        receipt_number: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        photo_id: initialPhotoId || undefined,
      });

      setFormSuccess(`Recycling evidence submitted successfully! Record ID: ${rec.record_id}. Status is currently Pending review.`);
      setReceiptNumber('');
      setNotes('');

      // Refresh submissions
      if (user) {
        const recs = await api.getMyRecords();
        setMyRecords(recs);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async (recordId: string) => {
    setReceiptLoading(true);
    try {
      const rec = await api.getReceipt(recordId);
      setSelectedReceipt(rec);
      setReceiptModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'No digital receipt issued for this record yet.');
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
          Recycling Evidence Submission & Verified History
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
          Upload drop-off proof from certified collection centers. To protect system integrity, no points are awarded merely
          for submission—points are atomically granted once verified by facility staff.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Evidence Submission Form Column */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <SubmitIcon sx={{ color: '#10b981' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                Submit Drop-Off Proof
              </Typography>
            </Box>

            {formSuccess && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                {formSuccess}
              </Alert>
            )}

            {formError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#93c5fd',
              }}
            >
              Unique receipt references are verified by database constraints. Duplicate submissions are automatically rejected.
            </Alert>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Drop-off Recycling Center</InputLabel>
                <Select
                  value={centerId}
                  label="Drop-off Recycling Center"
                  onChange={(e) => setCenterId(e.target.value)}
                  required
                >
                  {centers.map((c) => (
                    <MenuItem key={c.center_id} value={c.center_id}>
                      {c.name} ({c.current_verification_status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel shrink>E-Waste Category</InputLabel>
                <Select
                  value={categoryId}
                  label="E-Waste Category"
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <MenuItem key={c.category_id} value={c.category_id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Certified Weight (kg)"
                    type="number"
                    slotProps={{ htmlInput: { step: '0.01' } }}
                    required
                    fullWidth
                    size="small"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Item Quantity"
                    type="number"
                    required
                    fullWidth
                    size="small"
                    value={estimatedUnits}
                    onChange={(e) => setEstimatedUnits(e.target.value)}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Center Receipt / Certificate Reference"
                fullWidth
                size="small"
                placeholder="e.g. REC-2026-IND-001"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                helperText="Must be unique. Duplicate numbers are rejected."
              />

              <TextField
                label="Device Notes / Condition"
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Device brand, condition, or battery status..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting || !user}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{ py: 1.3, mt: 1 }}
              >
                {!user ? 'Sign in to Submit' : submitting ? 'Submitting...' : 'Submit Recycling Record'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* My Submissions Table Column */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                My Submissions & Certificates ({myRecords.length})
              </Typography>
            </Box>

            {myRecords.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.1)', mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                  No recycling records submitted yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Drop off your electronics at a certified facility and enter your proof on the left.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>CATEGORY</TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>CENTER</TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>WEIGHT</TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>STATUS</TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontWeight: 700, textAlign: 'right' }}>ACTION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myRecords.map((r) => (
                      <TableRow key={r.record_id} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                          {r.category_name || r.category_code}
                          <Typography variant="caption" sx={{ display: 'block', color: '#6b7280' }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#d1d5db', fontSize: '0.85rem' }}>
                          {r.center_name || 'Recycling Center'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#22d3ee' }}>
                          {r.weight_kg.toFixed(2)} kg
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status.toUpperCase()}
                            size="small"
                            color={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}
                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          {r.status === 'approved' && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ReceiptIcon fontSize="small" />}
                              onClick={() => handleViewReceipt(r.record_id)}
                              sx={{
                                color: '#10b981',
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                fontSize: '0.75rem',
                                py: 0.3,
                              }}
                            >
                              Certificate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Official Certificate Modal */}
      <DigitalReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </Container>
  );
};
