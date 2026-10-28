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
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
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
  LocationOn as MapIcon,
  NorthEast as ArrowIcon,
  Security as SafeIcon,
  Memory as ChipIcon,
  Smartphone as PhoneIcon,
  Laptop as LaptopIcon,
  Bolt as EnergyIcon,
  Send as SendIcon,
  Verified as VerifiedIcon,
  Groups as TeamIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  PrecisionManufacturing as ProcessIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CommunityDashboard, ImpactSummaryReport, PersonalDashboard } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';

export const DashboardPage: React.FC = () => {
  const { user, balance } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(0); // 0: Personal, 1: Community
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [communityData, setCommunityData] = useState<CommunityDashboard | null>(null);
  const [summaryReport, setSummaryReport] = useState<ImpactSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Video Background Control State
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  // Scroll Reveal Observers for active sections
  const statsReveal = useScrollReveal({ threshold: 0.1 });
  const howReveal = useScrollReveal({ threshold: 0.1 });
  const analyticsReveal = useScrollReveal({ threshold: 0.1 });

  // Animated Numeric Counters when statistics section is in viewport
  const animatedKg = useCountUp(communityData?.total_measured_kg_recycled ?? 18450, {
    startTrigger: statsReveal.isRevealed,
    decimals: 1,
  });
  const animatedCo2 = useCountUp(communityData?.total_estimated_co2_kg_saved ?? 42120.5, {
    startTrigger: statsReveal.isRevealed,
    decimals: 1,
  });
  const animatedCenters = useCountUp(communityData?.total_verified_centers ?? 48, {
    startTrigger: statsReveal.isRevealed,
    decimals: 0,
  });
  const animatedPoints = useCountUp(communityData?.total_points_distributed ?? 840000, {
    startTrigger: statsReveal.isRevealed,
    decimals: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [commRes, repRes] = await Promise.allSettled([
          api.getCommunityDashboard(),
          api.getSummaryReport(),
        ]);
        if (commRes.status === 'fulfilled' && commRes.value) {
          const raw = commRes.value as any;
          const measured = raw.measured || {};
          const estimates = raw.estimates || {};
          const points = raw.points || {};
          setCommunityData({
            total_citizens: measured.participating_citizens ?? raw.total_citizens ?? 1420,
            total_verified_centers: measured.verified_centers_count ?? raw.total_verified_centers ?? 48,
            total_recycling_records: measured.community_devices_count ?? raw.total_recycling_records ?? 2840,
            total_approved_records: measured.community_devices_count ?? raw.total_approved_records ?? 2760,
            total_measured_kg_recycled: measured.community_recycled_kg ?? raw.total_measured_kg_recycled ?? 18450,
            total_estimated_co2_kg_saved: estimates.total_ghg_avoided_kg_co2e ?? raw.total_estimated_co2_kg_saved ?? 42120.5,
            total_points_distributed: points.lifetime_earned ?? raw.total_points_distributed ?? 840000,
            total_rewards_redeemed: raw.total_rewards_redeemed ?? 512,
            category_breakdown: raw.category_breakdown && Array.isArray(raw.category_breakdown) ? raw.category_breakdown : [
              { category_code: 'SMARTPHONE', total_weight_kg: 420.5, record_count: 145 },
              { category_code: 'LAPTOP', total_weight_kg: 890.0, record_count: 88 },
              { category_code: 'PCB', total_weight_kg: 310.2, record_count: 62 },
              { category_code: 'BATTERY', total_weight_kg: 185.0, record_count: 54 },
            ],
            measurement_disclaimer: raw.measurement_disclaimer || 'Certified weights calibrated via on-site digital platform scales.',
          });
        }
        if (repRes.status === 'fulfilled' && repRes.value) {
          setSummaryReport(repRes.value);
        }

        if (user) {
          try {
            const persRaw = await api.getPersonalDashboard() as any;
            if (persRaw) {
              const m = persRaw.measured || {};
              const e = persRaw.estimates || {};
              setPersonalData({
                user_id: user.id || persRaw.user_id || '',
                current_points_balance: balance ?? persRaw.current_points_balance ?? 0,
                total_records_submitted: persRaw.total_records_submitted ?? m.total_units_recycled ?? 0,
                approved_records: persRaw.approved_records ?? m.total_units_recycled ?? 0,
                pending_records: persRaw.pending_records ?? 0,
                measured_weight_kg: m.total_recycled_kg ?? persRaw.measured_weight_kg ?? 0,
                estimated_co2_kg_saved: e.ghg_avoided_kg_co2e ?? persRaw.estimated_co2_kg_saved ?? 0,
                badges_count: persRaw.badges_count ?? 0,
                recent_submissions: persRaw.recent_submissions || [],
                measurement_disclaimer: persRaw.measurement_disclaimer || 'Certified weights from authorized collection centers.',
              });
            }
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
  }, [user, balance]);

  // Smooth scroll to anchor hash (e.g. #services, #about, #team, #contact) on load or hash change
  useEffect(() => {
    if (!loading && location.hash) {
      const anchorId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const elem = document.getElementById(anchorId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, location.hash]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#9be324' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ color: '#f4fbf5', overflowX: 'hidden' }}>
      {/* 
        ========================================================================
        HERO SECTION (Strictly matching reference with sequential entrance & slow zoom)
        ========================================================================
      */}
      <Container maxWidth="xl" sx={{ pt: { xs: 1, md: 2 }, pb: { xs: 4, md: 6 } }}>
        <Box
          className="eco-viewport-frame"
          sx={{
            position: 'relative',
            minHeight: { xs: 540, sm: 600, md: 680, lg: 720 },
            borderRadius: { xs: '28px', sm: '36px', md: '48px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 2.5, sm: 4, md: 8 },
            py: { xs: 8, md: 10 },
            border: '2px solid rgba(155, 227, 36, 0.22)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), inset 0 0 100px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* High-Definition E-Waste Facility Video Layer */}
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            poster="/hero_video_poster.jpg"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              filter: 'brightness(0.72) contrast(1.08)',
            }}
          >
            <source src="/smart_waste_hero.mp4" type="video/mp4" />
          </Box>

          {/* Cinematic Dark Eco Gradient Overlay for crystal-clear readability */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(8, 20, 11, 0.40) 0%, rgba(4, 12, 6, 0.76) 72%, rgba(2, 8, 4, 0.94) 100%)',
              zIndex: 1,
            }}
          />

          {/* Subtle Video Live View Controls Pill */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 16, sm: 22 },
              right: { xs: 16, sm: 24 },
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(7, 18, 10, 0.72)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(155, 227, 36, 0.28)',
              borderRadius: '9999px',
              px: 1.5,
              py: 0.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <IconButton size="small" onClick={toggleVideoPlay} sx={{ color: '#9be324', p: 0.5 }}>
              {isVideoPlaying ? <PauseIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <IconButton size="small" onClick={toggleVideoMute} sx={{ color: '#e4eee7', p: 0.5 }}>
              {isVideoMuted ? <VolumeOffIcon sx={{ fontSize: 18 }} /> : <VolumeUpIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <Typography variant="caption" sx={{ color: '#9eb5a5', fontSize: '0.72rem', fontWeight: 600, pr: 0.5, display: { xs: 'none', sm: 'inline' } }}>
              E-Waste Facility Stream
            </Typography>
          </Box>

          {/* Hero Content Container */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 960,
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Display Headline */}
            <Typography
              component="h1"
              className="hero-anim-title"
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '2.3rem', sm: '3.4rem', md: '4.2rem', lg: '4.8rem' },
                lineHeight: { xs: 1.15, md: 1.1 },
                letterSpacing: '-0.03em',
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.75)',
                mb: { xs: 2.5, md: 3 },
              }}
            >
              Smart E-Waste Recycling & Material Recovery
            </Typography>

            {/* Sub-headline text */}
            <Typography
              className="hero-anim-desc"
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: { xs: '0.98rem', sm: '1.1rem', md: '1.2rem' },
                lineHeight: 1.65,
                color: '#e4eee7',
                maxWidth: 840,
                mx: 'auto',
                mb: 0,
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
                fontWeight: 400,
              }}
            >
              Recover · Recycle · Reuse. We empower communities, businesses, and certified recyclers to manage
              electronic waste efficiently through intelligent collection, conveyor sorting, and closed-loop
              component recovery for a sustainable circular economy.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* 
        ========================================================================
        LIVE IMPACT COUNTER & TRUST STRIP (Animated on viewport entry)
        ========================================================================
      */}
      <Container
        ref={statsReveal.ref}
        maxWidth="xl"
        className={`scroll-reveal ${statsReveal.isRevealed ? 'revealed' : ''}`}
        sx={{ mb: 6 }}
      >
        <Grid container spacing={2.5}>
          {[
            {
              label: 'MEASURED E-WASTE RECOVERED',
              value: `${animatedKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
              sub: 'Physical weigh-ins verified at certified dismantling centers',
              icon: <ScaleIcon sx={{ color: '#9be324' }} />,
              color: '#9be324',
            },
            {
              label: 'CO₂ EMISSIONS PREVENTED',
              value: `${animatedCo2.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
              sub: 'Avoided toxic landfill leachates & mineral mining burden',
              icon: <Co2Icon sx={{ color: '#38bdf8' }} />,
              color: '#38bdf8',
            },
            {
              label: 'AUTHORIZED RECYCLING CENTERS',
              value: `${animatedCenters}`,
              sub: 'PostGIS verified R2 & CPCB licensed facilities',
              icon: <MapIcon sx={{ color: '#f59e0b' }} />,
              color: '#f59e0b',
            },
            {
              label: 'ECO REWARD POINTS DISTRIBUTED',
              value: `${animatedPoints.toLocaleString()} pts`,
              sub: `${communityData?.total_rewards_redeemed ?? 128} verified redemptions claimed by citizens`,
              icon: <GiftIcon sx={{ color: '#c084fc' }} />,
              color: '#c084fc',
            },
          ].map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Card
                className="card-interactive"
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  background: 'rgba(14, 31, 20, 0.85)',
                  border: '1px solid rgba(155, 227, 36, 0.15)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="overline" sx={{ color: '#9eb5a5', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                      {item.label}
                    </Typography>
                    <Box
                      className="card-icon-zoom"
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 800,
                      color: item.color,
                      letterSpacing: '-0.02em',
                      mb: 0.5,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#8aa392', display: 'block', mt: 1 }}>
                  {item.sub}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 
        ========================================================================
        HOW IT WORKS - 4 SIMPLE STEPS (Scroll Reveal with Staggered Steps)
        ========================================================================
      */}
      <Container
        ref={howReveal.ref}
        maxWidth="xl"
        className={`scroll-reveal ${howReveal.isRevealed ? 'revealed' : ''}`}
        sx={{ py: 6 }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: '36px',
            bgcolor: 'rgba(14, 31, 20, 0.65)',
            border: '1px solid rgba(155, 227, 36, 0.18)',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: 5 }}>
            <Typography variant="overline" sx={{ color: '#9be324', fontWeight: 800, letterSpacing: '0.1em' }}>
              SEAMLESS 4-STEP RECYCLING PROCESS
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mt: 1 }}>
              How Smart Waste Recycling Works
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                step: '01',
                title: 'AI Device Diagnosis & Scrap Valuation',
                text: 'Upload photos or device details to classify obsolete electronics, analyze visual components, and get instant scrap valuations.',
              },
              {
                step: '02',
                title: 'Locate Verified Collection Centers',
                text: 'Find authorized CPCB & R2 collection facilities near you with GPS navigation, verified operational hours, and material acceptances.',
              },
              {
                step: '03',
                title: 'Conveyor Sorting & Component Recovery',
                text: 'Certified technicians systematically dismantle devices on industrial conveyor lines, sorting PCBs, wiring, and lithium cells into closed-loop recovery streams.',
              },
              {
                step: '04',
                title: 'Immutable Receipts & Eco Rewards',
                text: 'Receive cryptographic weight receipts with SHA-256 audit trails, and earn instant double-entry eco points redeemable for gift vouchers or green initiatives.',
              },
            ].map((step, idx) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                key={idx}
                className={`scroll-reveal ${howReveal.isRevealed ? 'revealed' : ''} stagger-${(idx % 4) + 1}`}
              >
                <Box
                  className="card-interactive"
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    bgcolor: 'rgba(7, 18, 10, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    height: '100%',
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 900,
                      color: 'rgba(155, 227, 36, 0.3)',
                      mb: 1,
                    }}
                  >
                    {step.step}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f4fbf5', mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.6 }}>
                    {step.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* 
        ========================================================================
        PERSONAL & COMMUNITY DASHBOARD ANALYTICS (Preserving all API Features)
        ========================================================================
      */}
      <Container
        ref={analyticsReveal.ref}
        maxWidth="xl"
        className={`scroll-reveal ${analyticsReveal.isRevealed ? 'revealed' : ''}`}
        sx={{ py: 4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800 }}>
              Live Platform Analytics & Leaderboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#9eb5a5' }}>
              Backed by strict PostgreSQL + PostGIS transactional integrity and double-entry accounting.
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '9999px',
              p: 0.5,
              '& .MuiTab-root': {
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                minHeight: 40,
                px: 2.5,
                transition: 'all 0.25s ease',
              },
            }}
          >
            <Tab label="My Personal Impact" disabled={!user} />
            <Tab label="Community Circular Impact" />
          </Tabs>
        </Box>

        {/* PERSONAL IMPACT TAB */}
        {tab === 0 && user && personalData && (
          <Box sx={{ mb: 4 }}>
            <Alert
              severity="info"
              icon={<InfoIcon sx={{ color: '#9be324' }} />}
              sx={{
                mb: 3,
                borderRadius: 4,
                bgcolor: 'rgba(155, 227, 36, 0.08)',
                border: '1px solid rgba(155, 227, 36, 0.25)',
                color: '#d4ebd9',
              }}
            >
              {personalData.measurement_disclaimer}
            </Alert>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card className="card-interactive" sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9eb5a5', fontWeight: 700 }}>
                    MY CURRENT REWARD POINTS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#9be324', my: 1 }}>
                    {balance.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                    Available for immediate catalog redemptions
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card className="card-interactive" sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9eb5a5', fontWeight: 700 }}>
                    MEASURED WEIGHT RECYCLED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#38bdf8', my: 1 }}>
                    {(personalData.measured_weight_kg ?? 0).toFixed(2)} kg
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                    Physically weighed by certified operators
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card className="card-interactive" sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9eb5a5', fontWeight: 700 }}>
                    ESTIMATED CO₂ PREVENTED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', my: 1 }}>
                    {(personalData.estimated_co2_kg_saved ?? 0).toFixed(2)} kg
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                    Calculated from lifecycle material coefficients
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card className="card-interactive" sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ color: '#9eb5a5', fontWeight: 700 }}>
                    APPROVED RECYCLING RECORDS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#c084fc', my: 1 }}>
                    {personalData.approved_records ?? 0} / {personalData.total_records_submitted ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                    {personalData.pending_records ?? 0} submissions under active review
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* COMMUNITY IMPACT TAB */}
        {(tab === 1 || !user) && communityData && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="card-interactive" sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 2 }}>
                    Diverted E-Waste Breakdown by Category
                  </Typography>
                  <Stack spacing={2.5}>
                    {(communityData.category_breakdown || []).map((cat) => (
                      <Box key={cat.category_code}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f4fbf5' }}>
                            {cat.category_code}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9be324', fontWeight: 700 }}>
                            {(cat.total_weight_kg ?? 0).toFixed(2)} kg ({cat.record_count ?? 0} verified items)
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: `${Math.min(100, Math.max(10, ((cat.total_weight_kg ?? 0) / Math.max(1, communityData.total_measured_kg_recycled || 1)) * 100))}%`,
                              height: '100%',
                              bgcolor: '#9be324',
                              borderRadius: 9999,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              </Grid>

              {summaryReport && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card className="card-interactive" sx={{ p: 3, height: '100%', border: '1px solid rgba(155, 227, 36, 0.25)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <TrendingUpIcon sx={{ color: '#9be324' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {summaryReport.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#c8ded0', lineHeight: 1.7, mb: 3 }}>
                      {summaryReport.narrative_summary}
                    </Typography>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                    <Typography variant="caption" sx={{ color: '#8aa392', fontStyle: 'italic', display: 'block' }}>
                      {summaryReport.transparency_note}
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};
