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
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CardGiftcard as GiftIcon,
  CheckCircle as CheckIcon,
  Co2 as Co2Icon,
  Recycling as EcoIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
  Scale as ScaleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CommunityDashboard, ImpactSummaryReport, PersonalDashboard } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, balance } = useAuth();
  const [tab, setTab] = useState(0); // 0: Personal, 1: Community
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [communityData, setCommunityData] = useState<CommunityDashboard | null>(null);
  const [summaryReport, setSummaryReport] = useState<ImpactSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [comm, rep] = await Promise.all([
          api.getCommunityDashboard(),
          api.getSummaryReport(),
        ]);
        setCommunityData(comm);
        setSummaryReport(rep);

        if (user) {
          try {
            const pers = await api.getPersonalDashboard();
            setPersonalData(pers);
          } catch {
            // ignore if not logged in
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Hero Welcome Banner */}
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 750 }}>
          <Chip
            icon={<EcoIcon />}
            label="VERIFIED CIRCULAR ECONOMY PLATFORM"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mb: 2, fontWeight: 700, letterSpacing: '0.05em' }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6', mb: 1.5 }}>
            Welcome back, {user ? user.full_name : 'Eco Recycler'}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af', lineHeight: 1.7, mb: 3 }}>
            Turn obsolete consumer electronics into verified sustainability milestones. All points and environmental metrics
            are backed by certified recycling records and stored procedure transactions.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              component={Link}
              to="/centers"
              variant="contained"
              size="large"
              startIcon={<EcoIcon />}
            >
              Locate Drop-off Centers
            </Button>
            <Button
              component={Link}
              to="/ai-classify"
              variant="outlined"
              size="large"
              startIcon={<AIIcon />}
              sx={{ color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              Scan Device with AI
            </Button>
            <Button
              component={Link}
              to="/submit"
              variant="outlined"
              size="large"
              sx={{ color: '#9ca3af', borderColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              Submit Evidence
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Tabs Switcher: Personal vs Community */}
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
              px: 3,
            },
          }}
        >
          <Tab label="My Personal Impact" disabled={!user} />
          <Tab label="Community Circular Impact" />
        </Tabs>
      </Box>

      {/* TAB 0: PERSONAL DASHBOARD */}
      {tab === 0 && user && personalData && (
        <Box>
          {/* Transparency Alert */}
          <Alert
            severity="info"
            icon={<InfoIcon />}
            sx={{
              mb: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
            }}
          >
            {personalData.measurement_disclaimer}
          </Alert>

          {/* Metric Cards Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em' }}>
                      POINTS BALANCE
                    </Typography>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <EcoIcon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#34d399' }}>
                    {balance.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', mt: 0.5, display: 'block' }}>
                    Available for catalog redemptions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em' }}>
                      MEASURED WEIGHT (CERTIFIED)
                    </Typography>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                      <ScaleIcon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#22d3ee' }}>
                    {personalData.measured_weight_kg.toFixed(2)} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>kg</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#67e8f9', mt: 0.5, display: 'block' }}>
                    Directly weighed at drop-off centers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em' }}>
                      ESTIMATED CO2 SAVED
                    </Typography>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <Co2Icon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                    {personalData.estimated_co2_kg_saved.toFixed(2)} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>kg</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fcd34d', mt: 0.5, display: 'block' }}>
                    Derived from material impact factors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em' }}>
                      APPROVED SUBMISSIONS
                    </Typography>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                      <CheckIcon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#c084fc' }}>
                    {personalData.approved_records} <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 500 }}>/ {personalData.total_records_submitted}</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#d8b4fe', mt: 0.5, display: 'block' }}>
                    {personalData.pending_records} currently under review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 1: COMMUNITY CIRCULAR IMPACT */}
      {(tab === 1 || !user) && communityData && (
        <Box>
          {/* Transparency Alert */}
          <Alert
            severity="info"
            icon={<InfoIcon />}
            sx={{
              mb: 3,
              borderRadius: 3,
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
            }}
          >
            {communityData.measurement_disclaimer}
          </Alert>

          {/* Community Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                    MEASURED E-WASTE DIVERTED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#34d399', my: 1 }}>
                    {communityData.total_measured_kg_recycled.toFixed(1)} <span style={{ fontSize: '1.2rem' }}>kg</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981' }}>
                    Verified physical weigh-ins across centers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                    ESTIMATED CO2 EMISSIONS SAVED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#22d3ee', my: 1 }}>
                    {communityData.total_estimated_co2_kg_saved.toFixed(1)} <span style={{ fontSize: '1.2rem' }}>kg</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#06b6d4' }}>
                    Calculated via material composition multipliers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                    CERTIFIED DROP-OFF CENTERS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#fbbf24', my: 1 }}>
                    {communityData.total_verified_centers}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f59e0b' }}>
                    PostGIS spatial registered facilities
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                    POINTS AWARDED & REDEEMED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#c084fc', my: 1 }}>
                    {communityData.total_points_distributed.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a855f7' }}>
                    {communityData.total_rewards_redeemed} circular rewards claimed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Category Breakdown Progress */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 2 }}>
                    Diverted E-Waste by Category
                  </Typography>
                  <Stack spacing={2}>
                    {communityData.category_breakdown.map((cat) => (
                      <Box key={cat.category_code}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cat.category_code}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700 }}>
                            {cat.total_weight_kg.toFixed(2)} kg ({cat.record_count} items)
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: `${Math.min(100, Math.max(10, (cat.total_weight_kg / Math.max(1, communityData.total_measured_kg_recycled)) * 100))}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Templated Summary Report Card */}
            {summaryReport && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <TrendingUpIcon sx={{ color: '#10b981' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {summaryReport.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#d1d5db', lineHeight: 1.7, mb: 3 }}>
                      {summaryReport.narrative_summary}
                    </Typography>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontStyle: 'italic', display: 'block' }}>
                      {summaryReport.transparency_note}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Container>
  );
};
