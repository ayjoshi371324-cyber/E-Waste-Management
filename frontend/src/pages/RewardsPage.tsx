import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
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
  Typography,
} from '@mui/material';
import {
  CardGiftcard as GiftIcon,
  CheckCircle as VerifiedIcon,
  Recycling as EcoIcon,
  EmojiEvents as TrophyIcon,
  History as HistoryIcon,
  MilitaryTech as BadgeIcon,
  Shield as ShieldIcon,
  WorkspacePremium as MedalIcon,
} from '@mui/icons-material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCountUp } from '../hooks/useCountUp';
import { LeaderboardEntry, PointsLedgerEntry, Reward, UserBadge } from '../types';

export const RewardsPage: React.FC = () => {
  const { user, balance, refreshUser } = useAuth();
  const animatedBalance = useCountUp(balance, { duration: 900, decimals: 0 });
  const [tab, setTab] = useState(0); // 0: Catalog, 1: Badges, 2: Ledger, 3: Leaderboard

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Redemption Dialog State
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rew, lead] = await Promise.all([
        api.getRewards(),
        api.getLeaderboard(10),
      ]);
      setRewards(rew);
      setLeaderboard(lead);

      if (user) {
        try {
          const [b, led] = await Promise.all([
            api.getMyBadges(),
            api.getMyLedger(),
          ]);
          setBadges(b);
          setLedger(led);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to load rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemResult(null);
    setRedeemDialogOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    try {
      // Generate client-side idempotency key
      const idempotencyKey = `idem_${selectedReward.reward_id}_${Date.now()}`;
      const res = await api.redeemReward({
        reward_id: selectedReward.reward_id,
        idempotency_key: idempotencyKey,
      });

      setRedeemResult({
        success: true,
        message: `${res.message} Remaining balance: ${res.remaining_balance} pts.`,
      });

      // Refresh balance and rewards stock
      await refreshUser();
      const updatedRew = await api.getRewards();
      setRewards(updatedRew);

      if (user) {
        const led = await api.getMyLedger();
        setLedger(led);
      }
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err.message || 'Redemption failed. Check your points balance or item stock.',
      });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Banner with Balance Pill */}
      <Box
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
            Rewards Catalog & Gamification Hub
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            Redeem points earned from verified e-waste disposal for certified carbon offsets, discounts, and tree plantations.
          </Typography>
        </Box>

        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              borderRadius: '24px',
              bgcolor: 'rgba(7, 18, 10, 0.7)',
              border: '1px solid rgba(155, 227, 36, 0.4)',
              boxShadow: '0 0 25px rgba(155, 227, 36, 0.15)',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(155, 227, 36, 0.2)', color: '#9be324' }}>
              <EcoIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#9eb5a5', fontWeight: 700, display: 'block', letterSpacing: '0.06em' }}>
                AVAILABLE BALANCE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#9be324', fontFamily: '"Outfit", sans-serif' }}>
                {animatedBalance.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#9eb5a5' }}>PTS</span>
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Tabs */}
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
              fontSize: '1rem',
              textTransform: 'none',
              px: 3,
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
          <Tab icon={<GiftIcon />} iconPosition="start" label="Rewards Catalog" />
          <Tab icon={<BadgeIcon />} iconPosition="start" label="My Badges" disabled={!user} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Points Ledger" disabled={!user} />
          <Tab icon={<TrophyIcon />} iconPosition="start" label="Sustainability Leaderboard" />
        </Tabs>
      </Box>

      {/* TAB 0: REWARDS CATALOG */}
      {tab === 0 && (
        <Grid container spacing={3} className="page-transition-enter">
          {rewards.map((r) => {
            const canAfford = balance >= r.points_cost;
            const inStock = r.stock_quantity > 0;

            return (
              <Grid key={r.reward_id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  className="card-interactive"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    borderRadius: '24px',
                    border: '1px solid rgba(155, 227, 36, 0.18)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      className="card-icon-zoom"
                      sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(155, 227, 36, 0.1)', color: '#9be324' }}
                    >
                      <GiftIcon />
                    </Box>
                    <Chip
                      label={`${r.stock_quantity} in stock`}
                      size="small"
                      color={inStock ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 1 }}>
                    {r.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#9ca3af', flexGrow: 1, mb: 3, lineHeight: 1.6 }}>
                    {r.description || 'Certified eco-friendly reward.'}
                  </Typography>

                  <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#9be324', fontFamily: '"Outfit", sans-serif' }}>
                      {r.points_cost} <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>PTS</span>
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      disabled={!inStock || !canAfford || !user}
                      onClick={() => handleOpenRedeem(r)}
                      className="btn-premium-interactive"
                      sx={{
                        borderRadius: '9999px',
                        fontWeight: 700,
                        bgcolor: canAfford ? '#9be324' : undefined,
                        color: canAfford ? '#07160c' : undefined,
                        '&:hover': { bgcolor: canAfford ? '#a8ee30' : undefined },
                      }}
                    >
                      {!user ? 'Sign In' : !canAfford ? 'Need Points' : !inStock ? 'Out of Stock' : 'Redeem ↗'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* TAB 1: BADGES */}
      {tab === 1 && user && (
        <Grid container spacing={3}>
          {badges.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                You haven't unlocked any badges yet! Earn badges by reaching recycling milestones (First Drop-Off, 500 Points, Century Club).
              </Alert>
            </Grid>
          ) : (
            badges.map((b) => (
              <Grid key={b.user_badge_id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <MedalIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                    {b.badge_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af', my: 1 }}>
                    {b.badge_description}
                  </Typography>
                  <Chip
                    label={`Unlocked: ${new Date(b.awarded_at).toLocaleDateString()}`}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* TAB 2: POINTS LEDGER */}
      {tab === 2 && user && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 2 }}>
            Double-Entry Financial Points Ledger
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>DATE</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>TRANSACTION TYPE</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>NOTES</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700, textAlign: 'right' }}>POINTS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.map((e) => (
                  <TableRow key={e.ledger_id} hover>
                    <TableCell sx={{ color: '#9ca3af' }}>
                      {new Date(e.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                      {e.transaction_type.toUpperCase().replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell sx={{ color: '#d1d5db' }}>{e.notes}</TableCell>
                    <TableCell
                      sx={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: e.points > 0 ? '#34d399' : '#ef4444',
                      }}
                    >
                      {e.points > 0 ? `+${e.points}` : e.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 3: LEADERBOARD */}
      {tab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 2 }}>
            Public Sustainability Leaderboard
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>RANK</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>RECYCLER</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>DIVERTIED WEIGHT</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>APPROVED SUBMISSIONS</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700, textAlign: 'right' }}>TOTAL POINTS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((u) => (
                  <TableRow key={u.user_id} hover>
                    <TableCell sx={{ fontWeight: 800, color: u.rank === 1 ? '#f59e0b' : u.rank === 2 ? '#9ca3af' : u.rank === 3 ? '#b45309' : '#f3f4f6' }}>
                      #{u.rank}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                      {u.full_name}
                    </TableCell>
                    <TableCell sx={{ color: '#22d3ee', fontWeight: 600 }}>
                      {u.total_kg_recycled.toFixed(2)} kg
                    </TableCell>
                    <TableCell sx={{ color: '#9ca3af' }}>
                      {u.total_records_approved}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      {u.total_points.toLocaleString()} PTS
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Redemption Confirmation Modal */}
      <Dialog
        open={redeemDialogOpen}
        onClose={() => setRedeemDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: '#07120a',
              border: '1px solid rgba(155, 227, 36, 0.4)',
              borderRadius: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(155, 227, 36, 0.2)',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f4fbf5', pb: 1 }}>
          Confirm Reward Redemption
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          {redeemResult ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {redeemResult.success && (
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'rgba(155, 227, 36, 0.15)',
                    color: '#9be324',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    animation: 'heroFadeUp 0.5s ease both',
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 36 }} />
                </Box>
              )}
              <Alert
                severity={redeemResult.success ? 'success' : 'error'}
                sx={{
                  borderRadius: 3,
                  bgcolor: redeemResult.success ? 'rgba(155, 227, 36, 0.12)' : undefined,
                  color: redeemResult.success ? '#f4fbf5' : undefined,
                  border: redeemResult.success ? '1px solid rgba(155, 227, 36, 0.3)' : undefined,
                }}
              >
                {redeemResult.message}
              </Alert>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ color: '#f4fbf5', mb: 1, fontWeight: 700 }}>
                {selectedReward?.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9eb5a5', mb: 2, lineHeight: 1.6 }}>
                {selectedReward?.description}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: 'rgba(155, 227, 36, 0.06)',
                  border: '1px solid rgba(155, 227, 36, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: '#9eb5a5', fontWeight: 600 }}>Points Deduction:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#9be324', fontFamily: '"Outfit", sans-serif' }}>
                  {selectedReward?.points_cost} PTS
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setRedeemDialogOpen(false)}
            sx={{ color: '#9eb5a5', borderRadius: '9999px', px: 2 }}
          >
            {redeemResult ? 'Close' : 'Cancel'}
          </Button>
          {!redeemResult && (
            <Button
              variant="contained"
              onClick={handleConfirmRedeem}
              disabled={redeeming}
              className="btn-premium-interactive"
              sx={{
                bgcolor: '#9be324',
                color: '#07160c',
                fontWeight: 800,
                borderRadius: '9999px',
                px: 3,
                '&:hover': { bgcolor: '#a8ee30' },
              }}
            >
              {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};
