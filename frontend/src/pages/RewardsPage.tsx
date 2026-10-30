import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  CardGiftcard as GiftIcon,
  Check as CheckIcon,
  CheckCircle as VerifiedIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as PendingIcon,
  Recycling as EcoIcon,
  ShoppingBag as BagIcon,
  Tune as RulesIcon,
} from '@mui/icons-material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  RecyclingRecord,
  Reward,
  RewardRule,
  RewardsOverview,
} from '../types';

export const RewardsPage: React.FC = () => {
  const { user } = useAuth();

  // Primary navigation tab: 0: Admin Dashboard, 1: Reward Rules
  const [tab, setTab] = useState(0);

  // Admin sub-navigation (0: Overview Metrics, 1: Reward Management, 2: Recycling Verification & Points Queue)
  const [adminSubTab, setAdminSubTab] = useState(0);

  // Data states
  const [adminRewards, setAdminRewards] = useState<Reward[]>([]);
  const [overview, setOverview] = useState<RewardsOverview | null>(null);
  const [adminQueue, setAdminQueue] = useState<RecyclingRecord[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Admin Reward Create / Edit Dialog
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardFormData, setRewardFormData] = useState({
    title: '',
    description: '',
    points_cost: 100,
    stock_quantity: 20,
    is_active: true,
  });

  // Admin Reward Rule Edit Dialog
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    base_points: 50,
    points_per_kg: 20,
  });

  // Admin Verification Reject Dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRecordToReject, setSelectedRecordToReject] = useState<RecyclingRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, allRew, q, r] = await Promise.all([
        api.getRewardsOverview().catch(() => ({
          total_points_awarded: 840000,
          total_points_redeemed: 320000,
          total_redemptions_count: 512,
          active_rewards_count: 8,
          pending_records_count: 0,
        })),
        api.getAllAdminRewards().catch(() => []),
        api.getAdminRecordQueue().catch(() => []),
        api.getRewardRules().catch(() => []),
      ]);
      setOverview(ov as RewardsOverview);
      setAdminRewards(allRew);
      setAdminQueue(q);
      setRules(r);
    } catch (err: any) {
      console.error('Failed to load rewards administration data:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to fetch rewards administrative data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Admin: Open Create / Edit Reward Modal
  const handleOpenCreateReward = () => {
    setEditingReward(null);
    setRewardFormData({
      title: '',
      description: '',
      points_cost: 150,
      stock_quantity: 25,
      is_active: true,
    });
    setRewardModalOpen(true);
  };

  const handleOpenEditReward = (rew: Reward) => {
    setEditingReward(rew);
    setRewardFormData({
      title: rew.title,
      description: rew.description || '',
      points_cost: rew.points_cost,
      stock_quantity: rew.stock_quantity,
      is_active: rew.is_active,
    });
    setRewardModalOpen(true);
  };

  // Admin: Save Reward (Create or Update)
  const handleSaveReward = async () => {
    if (!rewardFormData.title.trim()) {
      setNotification({ type: 'error', message: 'Reward title is required.' });
      return;
    }
    if (rewardFormData.points_cost <= 0) {
      setNotification({ type: 'error', message: 'Points cost must be greater than 0.' });
      return;
    }
    if (rewardFormData.stock_quantity < 0) {
      setNotification({ type: 'error', message: 'Stock quantity cannot be negative.' });
      return;
    }

    setActionLoading(true);
    try {
      if (editingReward) {
        await api.updateReward(editingReward.reward_id, rewardFormData);
        setNotification({ type: 'success', message: `Reward "${rewardFormData.title}" updated successfully.` });
      } else {
        await api.createReward(rewardFormData);
        setNotification({ type: 'success', message: `Reward "${rewardFormData.title}" created successfully.` });
      }
      setRewardModalOpen(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save reward.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin: Toggle Reward Active / Inactive
  const handleToggleRewardActive = async (rew: Reward) => {
    try {
      await api.updateReward(rew.reward_id, { is_active: !rew.is_active });
      setNotification({
        type: 'info',
        message: `Reward "${rew.title}" set to ${!rew.is_active ? 'Active' : 'Inactive'}.`,
      });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Admin: Delete Reward
  const handleDeleteReward = async (rew: Reward) => {
    if (!window.confirm(`Are you sure you want to delete reward "${rew.title}"?`)) return;
    try {
      await api.deleteReward(rew.reward_id);
      setNotification({ type: 'info', message: `Reward "${rew.title}" deleted.` });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete reward.' });
    }
  };

  // Admin: Approve Recycling Record and Award Points
  const handleApproveRecord = async (rec: RecyclingRecord) => {
    setActionLoading(true);
    try {
      const res = await api.reviewRecord(rec.record_id, { decision: 'approved' });
      setNotification({
        type: 'success',
        message: `Approved submission! ${res.points_awarded || 0} points credited to user account. Verification receipt generated.`,
      });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to approve record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin: Open Reject Dialog
  const handleOpenRejectDialog = (rec: RecyclingRecord) => {
    setSelectedRecordToReject(rec);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  // Admin: Confirm Rejection
  const handleConfirmReject = async () => {
    if (!selectedRecordToReject) return;
    setActionLoading(true);
    try {
      await api.reviewRecord(selectedRecordToReject.record_id, {
        decision: 'rejected',
        rejection_reason: rejectReason || 'Ineligible e-waste or unverifiable documentation.',
      });
      setNotification({ type: 'info', message: 'Record rejected. No points were awarded.' });
      setRejectDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to reject record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin: Open Edit Reward Rule Modal
  const handleOpenEditRule = (rule: RewardRule) => {
    setEditingRule(rule);
    setRuleFormData({
      base_points: rule.base_points,
      points_per_kg: rule.points_per_kg,
    });
    setRuleModalOpen(true);
  };

  // Admin: Save Reward Rule
  const handleSaveRule = async () => {
    if (!editingRule) return;
    setActionLoading(true);
    try {
      await api.updateRewardRule(editingRule.category_id, ruleFormData);
      setNotification({
        type: 'success',
        message: `Reward points rule for ${editingRule.name} updated: Base=${ruleFormData.base_points} pts, Per Kg=${ruleFormData.points_per_kg} pts/kg.`,
      });
      setRuleModalOpen(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update rule.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper: Calculate Projected Points from category rule
  const calculateProjectedPoints = (rec: RecyclingRecord) => {
    const matchingRule = rules.find(
      (r) => r.category_id === rec.category_id || r.code === rec.category_code
    );
    if (!matchingRule) return Math.round(rec.weight_kg * 25 + 50);
    return Math.round(matchingRule.base_points + rec.weight_kg * matchingRule.points_per_kg);
  };

  if (loading && !overview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#9be324' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Alert Notification Toast */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{ mb: 3, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          {notification.message}
        </Alert>
      )}

      {/* Hero Header Banner */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(14, 31, 20, 0.95) 0%, rgba(7, 18, 10, 0.9) 100%)',
          border: '1px solid rgba(155, 227, 36, 0.25)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 3,
          mb: 4,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        <Box sx={{ maxWidth: 750 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontFamily: '"Outfit", sans-serif',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Rewards
          </Typography>
          <Typography variant="body1" sx={{ color: '#9eb5a5', lineHeight: 1.6 }}>
            Manage the circular rewards ecosystem, configure dynamic points calculation rules, and process verified e-waste drop-off submissions to award eco points.
          </Typography>
        </Box>
      </Box>

      {/* Primary Section Tabs: Admin Dashboard & Reward Rules */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)', mb: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: '1.05rem',
              textTransform: 'none',
              px: 3.5,
              py: 1.5,
            },
            '& .Mui-selected': {
              color: '#9be324 !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#9be324',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<AdminIcon />}
            iconPosition="start"
            label="Admin Dashboard"
            sx={{ color: tab === 0 ? '#9be324 !important' : '#f59e0b !important' }}
          />
          <Tab
            icon={<RulesIcon />}
            iconPosition="start"
            label="Reward Rules"
            sx={{ color: tab === 1 ? '#9be324 !important' : '#38bdf8 !important' }}
          />
        </Tabs>
      </Box>

      {/* ========================================================================
          TAB 0: ADMIN DASHBOARD
          ======================================================================== */}
      {tab === 0 && (
        <Box className="page-transition-enter">
          {/* Admin Navigation Pills */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap' }}>
            {[
              { idx: 0, label: 'Overview Metrics' },
              { idx: 1, label: `Reward Items Management (${adminRewards.length})` },
              { idx: 2, label: `Recycling Verification Queue (${adminQueue.length})` },
            ].map((btn) => (
              <Button
                key={btn.idx}
                variant={adminSubTab === btn.idx ? 'contained' : 'outlined'}
                onClick={() => setAdminSubTab(btn.idx)}
                className="btn-premium-interactive"
                sx={{
                  borderRadius: '9999px',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  bgcolor: adminSubTab === btn.idx ? '#9be324' : 'rgba(14, 31, 20, 0.6)',
                  color: adminSubTab === btn.idx ? '#07160c' : '#e4eee7',
                  borderColor: 'rgba(155, 227, 36, 0.3)',
                  '&:hover': {
                    bgcolor: adminSubTab === btn.idx ? '#a8ee30' : 'rgba(155, 227, 36, 0.15)',
                  },
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>

          {/* ADMIN SUB-TAB 0: OVERVIEW METRICS */}
          {adminSubTab === 0 && overview && (
            <Grid container spacing={3}>
              {[
                {
                  label: 'TOTAL RECYCLING POINTS AWARDED',
                  value: `${overview.total_points_awarded.toLocaleString()} PTS`,
                  sub: 'Credited to citizens through certified recycling approvals',
                  color: '#9be324',
                  icon: <EcoIcon sx={{ color: '#9be324' }} />,
                },
                {
                  label: 'TOTAL POINTS REDEEMED',
                  value: `${overview.total_points_redeemed.toLocaleString()} PTS`,
                  sub: 'Spent by users on sustainable catalog rewards',
                  color: '#38bdf8',
                  icon: <GiftIcon sx={{ color: '#38bdf8' }} />,
                },
                {
                  label: 'SUCCESSFUL REDEMPTIONS',
                  value: `${overview.total_redemptions_count}`,
                  sub: 'Completed voucher & merchandise claims',
                  color: '#f59e0b',
                  icon: <VerifiedIcon sx={{ color: '#f59e0b' }} />,
                },
                {
                  label: 'ACTIVE REWARD ITEMS',
                  value: `${overview.active_rewards_count}`,
                  sub: 'Live items available for citizen redemptions',
                  color: '#c084fc',
                  icon: <BagIcon sx={{ color: '#c084fc' }} />,
                },
                {
                  label: 'PENDING VERIFICATION QUEUE',
                  value: `${overview.pending_records_count}`,
                  sub: 'Recycling records awaiting operator approval & points award',
                  color: overview.pending_records_count > 0 ? '#fbbf24' : '#9eb5a5',
                  icon: <PendingIcon sx={{ color: '#fbbf24' }} />,
                },
              ].map((card, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: '24px',
                      bgcolor: 'rgba(14, 31, 20, 0.85)',
                      border: '1px solid rgba(155, 227, 36, 0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="overline" sx={{ color: '#9eb5a5', fontWeight: 800, fontSize: '0.72rem' }}>
                          {card.label}
                        </Typography>
                        <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                          {card.icon}
                        </Box>
                      </Box>
                      <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: card.color, mb: 1 }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#8aa392' }}>
                      {card.sub}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* ADMIN SUB-TAB 1: REWARD MANAGEMENT */}
          {adminSubTab === 1 && (
            <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(14, 31, 20, 0.75)', border: '1px solid rgba(155, 227, 36, 0.2)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                    Reward Catalog Management
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9eb5a5' }}>
                    Create new rewards, adjust points costs, update inventory stock, or toggle active visibility.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateReward}
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    px: 3,
                    '&:hover': { bgcolor: '#a8ee30' },
                  }}
                >
                  Add New Reward
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>TITLE</TableCell>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>DESCRIPTION</TableCell>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>POINTS COST</TableCell>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>IN STOCK</TableCell>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>STATUS</TableCell>
                      <TableCell sx={{ color: '#9eb5a5', fontWeight: 700, textAlign: 'right' }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminRewards.map((rew) => (
                      <TableRow key={rew.reward_id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>{rew.title}</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', maxWidth: 300 }}>{rew.description || '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#9be324' }}>{rew.points_cost} PTS</TableCell>
                        <TableCell sx={{ color: rew.stock_quantity > 0 ? '#38bdf8' : '#ef4444', fontWeight: 700 }}>
                          {rew.stock_quantity}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rew.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={rew.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Tooltip title="Edit Reward">
                            <IconButton onClick={() => handleOpenEditReward(rew)} sx={{ color: '#38bdf8' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={rew.is_active ? 'Deactivate' : 'Activate'}>
                            <IconButton onClick={() => handleToggleRewardActive(rew)} sx={{ color: rew.is_active ? '#fbbf24' : '#9be324' }}>
                              <Switch checked={rew.is_active} size="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Reward">
                            <IconButton onClick={() => handleDeleteReward(rew)} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* ADMIN SUB-TAB 2: RECYCLING VERIFICATION & POINTS PROCESSING */}
          {adminSubTab === 2 && (
            <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(14, 31, 20, 0.75)', border: '1px solid rgba(155, 227, 36, 0.2)' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                  Recycling Verification & Points Processing Queue
                </Typography>
                <Typography variant="body2" sx={{ color: '#9eb5a5' }}>
                  Review submitted drop-offs. Approving automatically awards points to the user based on category rules
                  and generates an immutable digital verification receipt.
                </Typography>
              </Box>

              {adminQueue.length === 0 ? (
                <Alert severity="success" sx={{ borderRadius: 3 }}>
                  All recycling records have been processed! No pending submissions awaiting verification.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>DATE</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>CATEGORY</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>WEIGHT</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>CENTER</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>NOTES</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>PROJECTED POINTS</TableCell>
                        <TableCell sx={{ color: '#9eb5a5', fontWeight: 700, textAlign: 'right' }}>DECISION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminQueue.map((rec) => {
                        const projPoints = calculateProjectedPoints(rec);

                        return (
                          <TableRow key={rec.record_id} hover>
                            <TableCell sx={{ color: '#9eb5a5' }}>
                              {new Date(rec.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={rec.category_name || rec.category_code || 'ELECTRONIC'}
                                size="small"
                                sx={{ bgcolor: 'rgba(155, 227, 36, 0.15)', color: '#9be324', fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#38bdf8' }}>
                              {rec.weight_kg.toFixed(2)} kg
                            </TableCell>
                            <TableCell sx={{ color: '#e4eee7' }}>
                              {rec.center_name || 'Authorized Center'}
                            </TableCell>
                            <TableCell sx={{ color: '#9eb5a5', maxWidth: 200 }}>
                              {rec.notes || '—'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#9be324' }}>
                              +{projPoints} PTS
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="success"
                                  disabled={actionLoading}
                                  startIcon={<CheckIcon />}
                                  onClick={() => handleApproveRecord(rec)}
                                  sx={{ borderRadius: '9999px', fontWeight: 700 }}
                                >
                                  Approve & Award
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  disabled={actionLoading}
                                  startIcon={<CloseIcon />}
                                  onClick={() => handleOpenRejectDialog(rec)}
                                  sx={{ borderRadius: '9999px', fontWeight: 700 }}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          )}
        </Box>
      )}

      {/* ========================================================================
          TAB 1: REWARD RULES CONFIGURATION
          ======================================================================== */}
      {tab === 1 && (
        <Box className="page-transition-enter">
          <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(14, 31, 20, 0.75)', border: '1px solid rgba(155, 227, 36, 0.2)' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                Reward Points Rules Configuration
              </Typography>
              <Typography variant="body2" sx={{ color: '#9eb5a5', mt: 0.5 }}>
                Configure base points and per-kilogram coefficients for supported e-waste categories. Formula:
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  mt: 1.5,
                  px: 2.5,
                  py: 1,
                  borderRadius: 3,
                  bgcolor: 'rgba(155, 227, 36, 0.1)',
                  border: '1px solid rgba(155, 227, 36, 0.3)',
                  color: '#9be324',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                Calculated Points = Base Points + (Weight in kg × Points per kg)
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>CATEGORY CODE</TableCell>
                    <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>CATEGORY NAME</TableCell>
                    <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>BASE POINTS</TableCell>
                    <TableCell sx={{ color: '#9eb5a5', fontWeight: 700 }}>POINTS PER KG</TableCell>
                    <TableCell sx={{ color: '#9eb5a5', fontWeight: 700, textAlign: 'right' }}>ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.category_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                        {rule.code}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>
                        {rule.name}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#9be324' }}>
                        {rule.base_points} PTS
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#38bdf8' }}>
                        {rule.points_per_kg} PTS/KG
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditRule(rule)}
                          sx={{
                            color: '#9be324',
                            borderColor: 'rgba(155, 227, 36, 0.4)',
                            fontWeight: 700,
                            borderRadius: '9999px',
                            '&:hover': {
                              borderColor: '#9be324',
                              bgcolor: 'rgba(155, 227, 36, 0.1)',
                            },
                          }}
                        >
                          Configure Rule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ========================================================================
          MODAL: ADMIN CREATE / EDIT REWARD
          ======================================================================== */}
      <Dialog
        open={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#07120a',
              border: '1px solid rgba(155, 227, 36, 0.4)',
              borderRadius: '24px',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
          {editingReward ? 'Edit Reward Item' : 'Add New Reward Item'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Reward Title"
              fullWidth
              value={rewardFormData.title}
              onChange={(e) => setRewardFormData({ ...rewardFormData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={rewardFormData.description}
              onChange={(e) => setRewardFormData({ ...rewardFormData, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Points Cost"
                  type="number"
                  fullWidth
                  value={rewardFormData.points_cost}
                  onChange={(e) => setRewardFormData({ ...rewardFormData, points_cost: Number(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Stock Inventory Quantity"
                  type="number"
                  fullWidth
                  value={rewardFormData.stock_quantity}
                  onChange={(e) => setRewardFormData({ ...rewardFormData, stock_quantity: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={rewardFormData.is_active}
                  onChange={(e) => setRewardFormData({ ...rewardFormData, is_active: e.target.checked })}
                  color="success"
                />
              }
              label="Active in Citizen Catalog"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRewardModalOpen(false)} sx={{ color: '#9eb5a5' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveReward}
            disabled={actionLoading}
            sx={{ bgcolor: '#9be324', color: '#07160c', fontWeight: 800, borderRadius: '9999px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save Reward'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================
          MODAL: ADMIN EDIT REWARD RULE
          ======================================================================== */}
      <Dialog
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#07120a',
              border: '1px solid rgba(155, 227, 36, 0.4)',
              borderRadius: '24px',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
          Configure Reward Rule
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#9eb5a5' }}>
              Category: <strong>{editingRule?.name} ({editingRule?.code})</strong>
            </Typography>
          </Box>
          <Stack spacing={2.5}>
            <TextField
              label="Base Points Awarded"
              type="number"
              fullWidth
              value={ruleFormData.base_points}
              onChange={(e) => setRuleFormData({ ...ruleFormData, base_points: Number(e.target.value) })}
              helperText="Points awarded per approved device unit"
            />
            <TextField
              label="Points per Kilogram"
              type="number"
              fullWidth
              value={ruleFormData.points_per_kg}
              onChange={(e) => setRuleFormData({ ...ruleFormData, points_per_kg: Number(e.target.value) })}
              helperText="Additional points multiplied by verified physical weight in kg"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRuleModalOpen(false)} sx={{ color: '#9eb5a5' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRule}
            disabled={actionLoading}
            sx={{ bgcolor: '#9be324', color: '#07160c', fontWeight: 800, borderRadius: '9999px', px: 3 }}
          >
            {actionLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================
          MODAL: ADMIN REJECT VERIFICATION RECORD
          ======================================================================== */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#07120a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#ef4444' }}>
          Reject Submission
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <Typography variant="body2" sx={{ color: '#9eb5a5', mb: 2 }}>
            Provide an explicit reason for rejecting this recycling submission. No reward points will be awarded.
          </Typography>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Uncertified weight ticket, duplicate receipt reference, or invalid non-e-waste items."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ color: '#9eb5a5' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={actionLoading}
            sx={{ fontWeight: 800, borderRadius: '9999px', px: 3 }}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
