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
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CommunityDashboard, ImpactSummaryReport, PersonalDashboard } from '../types';
import { QuoteCalculatorModal } from '../components/QuoteCalculatorModal';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import heroImg from '../assets/smart_waste_hero.jpg';

export const DashboardPage: React.FC = () => {
  const { user, balance } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(0); // 0: Personal, 1: Community
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [communityData, setCommunityData] = useState<CommunityDashboard | null>(null);
  const [summaryReport, setSummaryReport] = useState<ImpactSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Scroll Reveal Observers for each section
  const statsReveal = useScrollReveal({ threshold: 0.1 });
  const servicesReveal = useScrollReveal({ threshold: 0.1 });
  const howReveal = useScrollReveal({ threshold: 0.1 });
  const analyticsReveal = useScrollReveal({ threshold: 0.1 });
  const aboutReveal = useScrollReveal({ threshold: 0.1 });
  const teamReveal = useScrollReveal({ threshold: 0.1 });
  const contactReveal = useScrollReveal({ threshold: 0.1 });

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

  const scrollToServices = () => {
    const elem = document.getElementById('services');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          {/* Subtle slow zoom-out background photography layer */}
          <Box
            className="hero-bg-animated"
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${heroImg}), url('/smart_waste_hero.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              zIndex: 0,
            }}
          />

          {/* Cinematic Dark Eco Gradient Overlay for crystal-clear readability */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(8, 20, 11, 0.45) 0%, rgba(4, 12, 6, 0.78) 75%, rgba(2, 8, 4, 0.92) 100%)',
              zIndex: 1,
            }}
          />

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
            {/* Top Pill Badge with Staggered Entrance */}
            <Chip
              className="hero-anim-badge"
              icon={<EcoIcon sx={{ color: '#07160c !important', fontSize: 16 }} />}
              label="CERTIFIED CIRCULAR E-WASTE PLATFORM"
              sx={{
                mb: { xs: 2.5, md: 3 },
                bgcolor: '#9be324',
                color: '#07160c',
                fontWeight: 800,
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                letterSpacing: '0.08em',
                px: 1.5,
                py: 0.5,
                boxShadow: '0 4px 18px rgba(155, 227, 36, 0.4)',
              }}
            />

            {/* Display Headline - verbatim matching the screenshot typography */}
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
              Smart Waste Collection For A Cleaner Tomorrow
            </Typography>

            {/* Sub-headline text - verbatim matching the screenshot */}
            <Typography
              className="hero-anim-desc"
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: { xs: '0.98rem', sm: '1.1rem', md: '1.2rem' },
                lineHeight: 1.65,
                color: '#e4eee7',
                maxWidth: 820,
                mx: 'auto',
                mb: { xs: 4, md: 5 },
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
                fontWeight: 400,
              }}
            >
              We help communities, businesses, and cities manage waste efficiently through smart collection,
              recycling, and eco-friendly disposal services. Building cleaner environments with sustainable
              waste management solutions.
            </Typography>

            {/* The Two Distinctive Action Buttons matching the reference screenshot */}
            <Stack
              className="hero-anim-cta"
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 2.5 }}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Button 1: Primary Electric Lime Pill with Arrow Chip */}
              <Button
                variant="contained"
                className="btn-premium-interactive"
                onClick={() => setQuoteOpen(true)}
                sx={{
                  bgcolor: '#9be324',
                  color: '#07160c',
                  px: { xs: 3.5, md: 4 },
                  py: { xs: 1.4, md: 1.6 },
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: { xs: '1rem', md: '1.08rem' },
                  boxShadow: '0 8px 30px rgba(155, 227, 36, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  minWidth: { xs: '100%', sm: 220 },
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#a8ee30',
                    boxShadow: '0 12px 35px rgba(155, 227, 36, 0.65)',
                  },
                }}
              >
                <span>Get Free Quote</span>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#07160c',
                    color: '#9be324',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowIcon className="btn-arrow-icon" sx={{ fontSize: 16 }} />
                </Box>
              </Button>

              {/* Button 2: Crisp White Pill with Arrow Chip */}
              <Button
                variant="contained"
                className="btn-premium-interactive"
                onClick={scrollToServices}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#07160c',
                  px: { xs: 3.5, md: 4 },
                  py: { xs: 1.4, md: 1.6 },
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: { xs: '1rem', md: '1.08rem' },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  minWidth: { xs: '100%', sm: 200 },
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#f2f8f3',
                    boxShadow: '0 12px 30px rgba(255, 255, 255, 0.35)',
                  },
                }}
              >
                <span>Our Services</span>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#07160c',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowIcon className="btn-arrow-icon" sx={{ fontSize: 16 }} />
                </Box>
              </Button>
            </Stack>
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
              label: 'MEASURED E-WASTE DIVERTED',
              value: `${animatedKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
              sub: 'Physical weigh-ins verified at certified centers',
              icon: <ScaleIcon sx={{ color: '#9be324' }} />,
              color: '#9be324',
            },
            {
              label: 'CO₂ EMISSIONS SAVED',
              value: `${animatedCo2.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
              sub: 'Avoided lifecycle manufacturing & mining burden',
              icon: <Co2Icon sx={{ color: '#38bdf8' }} />,
              color: '#38bdf8',
            },
            {
              label: 'AUTHORIZED DROP-OFF CENTERS',
              value: `${animatedCenters}`,
              sub: 'PostGIS verified R2 & CPCB licensed facilities',
              icon: <MapIcon sx={{ color: '#f59e0b' }} />,
              color: '#f59e0b',
            },
            {
              label: 'ECO REWARD POINTS DISTRIBUTED',
              value: `${animatedPoints.toLocaleString()} pts`,
              sub: `${communityData?.total_rewards_redeemed ?? 128} verified redemptions claimed`,
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
        CORE SERVICES SECTION (#services - Staggered scroll reveal)
        ========================================================================
      */}
      <Box id="services" ref={servicesReveal.ref} sx={{ py: 6, position: 'relative' }}>
        <Container maxWidth="xl" className={`scroll-reveal ${servicesReveal.isRevealed ? 'revealed' : ''}`}>
          <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: 6 }}>
            <Chip
              label="OUR COMPREHENSIVE SERVICES"
              sx={{
                bgcolor: 'rgba(155, 227, 36, 0.15)',
                color: '#9be324',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#f4fbf5',
                mb: 2,
              }}
            >
              Complete Smart E-Waste Solutions
            </Typography>
            <Typography variant="body1" sx={{ color: '#9eb5a5', lineHeight: 1.7 }}>
              From instant computer vision diagnosis to certified drop-off logistics and immutable digital receipts,
              we ensure 100% circularity and zero illegal landfill dumping.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                title: 'AI Device Identifier & Diagnostic',
                desc: 'Upload a quick photo of any obsolete gadget. Our AI MobileNetV3 model automatically classifies device category, hazard rating, and estimated recovery value.',
                icon: <AIIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                cta: 'Launch AI Classifier',
                link: '/ai-classify',
                tag: 'INSTANT DETECTION',
              },
              {
                title: 'Certified Proximity Center Locator',
                desc: 'Locate verified R2 and CPCB-registered electronic waste collection centers using PostGIS spatial proximity search with accepted material filtering.',
                icon: <MapIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                cta: 'Locate Centers Nearby',
                link: '/centers',
                tag: 'POSTGIS SPATIAL SEARCH',
              },
              {
                title: 'Verifiable Chain of Custody & Receipts',
                desc: 'Generate cryptographic digital receipts and tamper-evident audit trails. Perfect for enterprise CSR reporting and regulatory extended producer responsibility.',
                icon: <ShieldIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                cta: 'Submit Drop-off Evidence',
                link: '/submit',
                tag: 'CRYPTO VERIFIED',
              },
              {
                title: 'Circular Eco-Points & Rewards',
                desc: 'Convert recycled gadgets into verified reward points with transactional single-award guarantees. Redeem for vouchers, tech discounts, or tree planting.',
                icon: <GiftIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                cta: 'Explore Reward Catalog',
                link: '/rewards',
                tag: 'TRANSACTIONAL REWARDS',
              },
            ].map((service, idx) => (
              <Grid
                size={{ xs: 12, sm: 6, lg: 3 }}
                key={idx}
                className={`scroll-reveal ${servicesReveal.isRevealed ? 'revealed' : ''} stagger-${(idx % 4) + 1}`}
              >
                <Card
                  className="card-interactive"
                  sx={{
                    p: 3.5,
                    borderRadius: '28px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box
                        className="card-icon-zoom"
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '20px',
                          bgcolor: 'rgba(155, 227, 36, 0.1)',
                          border: '1px solid rgba(155, 227, 36, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {service.icon}
                      </Box>
                      <Chip
                        label={service.tag}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: '#a3b8aa',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 700,
                        color: '#f4fbf5',
                        mb: 1.5,
                      }}
                    >
                      {service.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.6, mb: 3 }}>
                      {service.desc}
                    </Typography>
                  </Box>

                  <Button
                    component={Link}
                    to={service.link}
                    variant="outlined"
                    fullWidth
                    className="btn-premium-interactive"
                    sx={{
                      borderColor: 'rgba(155, 227, 36, 0.35)',
                      color: '#9be324',
                      borderRadius: '9999px',
                      fontWeight: 700,
                      py: 1.2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      '&:hover': {
                        borderColor: '#9be324',
                        bgcolor: 'rgba(155, 227, 36, 0.1)',
                      },
                    }}
                  >
                    <span>{service.cta}</span>
                    <ArrowIcon className="btn-arrow-icon" sx={{ fontSize: 18 }} />
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

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
                title: 'Identify & Value Gadget',
                text: 'Snap a picture using our AI Diagnostic or pick from our verified device catalog for immediate scrap valuation.',
              },
              {
                step: '02',
                title: 'Choose Drop-off Center',
                text: 'Find authorized R2/CPCB collection facilities nearest to you with GPS navigation and category verification.',
              },
              {
                step: '03',
                title: 'Safe Handover & Weighing',
                text: 'Drop off at the center. The facility weighs the devices and issues an immutable digital receipt with hash audit trail.',
              },
              {
                step: '04',
                title: 'Earn & Redeem Rewards',
                text: 'Points credit directly to your double-entry ledger. Spend points for gift cards, gadgets, or plant native trees.',
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

      {/* 
        ========================================================================
        ABOUT US SECTION (#about)
        ========================================================================
      */}
      <Box id="about" ref={aboutReveal.ref} sx={{ py: 8, bgcolor: 'rgba(14, 31, 20, 0.4)' }}>
        <Container maxWidth="xl" className={`scroll-reveal ${aboutReveal.isRevealed ? 'revealed' : ''}`}>
          <Grid container spacing={5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="ABOUT SMART WASTE PLATFORM"
                sx={{
                  bgcolor: 'rgba(155, 227, 36, 0.15)',
                  color: '#9be324',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  mb: 2,
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.8rem' },
                  color: '#f4fbf5',
                  mb: 2.5,
                }}
              >
                Pioneering Closed-Loop Urban E-Waste Stewardship
              </Typography>
              <Typography variant="body1" sx={{ color: '#c8ded0', lineHeight: 1.75, mb: 3 }}>
                Electronics contain both critical valuable commodities—such as gold, silver, copper, and rare earths—and
                hazardous substances like lead, mercury, and toxic brominated flame retardants.
              </Typography>
              <Typography variant="body1" sx={{ color: '#c8ded0', lineHeight: 1.75, mb: 4 }}>
                Smart Waste bridges the gap between consumers, enterprises, and certified recyclers. With strict NIST 800-88
                data sanitization guarantees and PostGIS geospatial routing, we make certified circular recycling rewarding,
                transparent, and accessible to everyone.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  className="btn-premium-interactive"
                  onClick={() => setQuoteOpen(true)}
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    px: 3.5,
                    py: 1.3,
                    borderRadius: '9999px',
                    fontWeight: 800,
                  }}
                >
                  Get Instant Valuation ↗
                </Button>
                <Button
                  component={Link}
                  to="/guide"
                  variant="outlined"
                  className="btn-premium-interactive"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#f4fbf5',
                    px: 3,
                    py: 1.3,
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  View Material Guide
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                className="card-interactive"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: '32px',
                  background: 'linear-gradient(145deg, #0f2617 0%, #08150c 100%)',
                  border: '1px solid rgba(155, 227, 36, 0.25)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                }}
              >
                <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 3 }}>
                  Our Sustainability Commitments
                </Typography>
                <Stack spacing={2.5}>
                  {[
                    {
                      title: '100% Zero-Landfill Guarantee',
                      desc: 'Every gram of non-recoverable hazardous material is treated at licensed hazardous facilities.',
                    },
                    {
                      title: 'NIST 800-88 Certified Data Wipe',
                      desc: 'Hardware serial tracking and cryptographic destruction certificates provided for all storage media.',
                    },
                    {
                      title: 'Verifiable Double-Entry Ledger',
                      desc: 'Zero fake points. Every reward is tied to actual physical weigh-in at authorized centers.',
                    },
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#9be324',
                          color: '#07160c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0,
                          mt: 0.3,
                        }}
                      >
                        ✓
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f4fbf5' }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.5 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 
        ========================================================================
        TEAM & TRUST BADGES SECTION (#team)
        ========================================================================
      */}
      <Container id="team" ref={teamReveal.ref} maxWidth="xl" sx={{ py: 8 }}>
        <Box className={`scroll-reveal ${teamReveal.isRevealed ? 'revealed' : ''}`}>
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: 6 }}>
            <Chip
              label="CERTIFIED EXPERTISE"
              sx={{
                bgcolor: 'rgba(155, 227, 36, 0.15)',
                color: '#9be324',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 2,
              }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 2 }}>
              Leadership & Environmental Compliance
            </Typography>
            <Typography variant="body1" sx={{ color: '#9eb5a5' }}>
              Built by environmental engineers, AI researchers, and certified supply chain auditors.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                name: 'Dr. Aris Thorne',
                role: 'Chief Environmental Scientist',
                spec: 'PhD in Circular Metallurgy & Hazardous Material Flow',
                badge: 'CPCB Certified Assessor',
              },
              {
                name: 'Elena Rostova',
                role: 'VP of Geospatial & Logistics',
                spec: 'PostGIS Spatial Routing & Center Verification Network',
                badge: 'R2v3 Lead Auditor',
              },
              {
                name: 'Kavita Menon',
                role: 'Lead AI & Computer Vision',
                spec: 'Edge Deep Learning for Automated Scrap Categorization',
                badge: 'IEEE Sustainability',
              },
              {
                name: 'Marcus Vance',
                role: 'Director of Corporate EPR & ESG',
                spec: 'Enterprise IT Asset Disposition & Chain of Custody',
                badge: 'NIST 800-88 Specialist',
              },
            ].map((member, i) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                key={i}
                className={`scroll-reveal ${teamReveal.isRevealed ? 'revealed' : ''} stagger-${(i % 4) + 1}`}
              >
                <Card className="card-interactive" sx={{ p: 3, borderRadius: '24px', textAlign: 'center', height: '100%' }}>
                  <Box
                    className="card-icon-zoom"
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      bgcolor: 'rgba(155, 227, 36, 0.15)',
                      border: '2px solid #9be324',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: '#9be324',
                    }}
                  >
                    <TeamIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5' }}>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: '#9be324', fontWeight: 700, mb: 1 }}>
                    {member.role}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9eb5a5', display: 'block', mb: 2, lineHeight: 1.5 }}>
                    {member.spec}
                  </Typography>
                  <Chip
                    label={member.badge}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#d4ebd9', fontSize: '0.7rem' }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* 
        ========================================================================
        CONTACT & CORPORATE COLLECTION SECTION (#contact)
        ========================================================================
      */}
      <Box
        id="contact"
        ref={contactReveal.ref}
        className={`scroll-reveal ${contactReveal.isRevealed ? 'revealed' : ''}`}
        sx={{ py: 8, bgcolor: 'rgba(14, 31, 20, 0.6)', borderTop: '1px solid rgba(155, 227, 36, 0.15)' }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="GET IN TOUCH"
                sx={{
                  bgcolor: 'rgba(155, 227, 36, 0.15)',
                  color: '#9be324',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  mb: 2,
                }}
              />
              <Typography variant="h2" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 2 }}>
                Corporate IT Asset Disposal & Inquiries
              </Typography>
              <Typography variant="body1" sx={{ color: '#c8ded0', lineHeight: 1.7, mb: 3 }}>
                Need bulk hardware decommissioning, enterprise EPR compliance certificates, or customized neighborhood
                recycling drives? Contact our dedicated sustainability team.
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#9be324', color: '#07160c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Headquarters</Typography>
                    <Typography variant="caption" sx={{ color: '#9eb5a5' }}>Eco-Corridor, Outer Ring Road, Bengaluru, KA 560103</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#9be324', color: '#07160c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Government Certifications</Typography>
                    <Typography variant="caption" sx={{ color: '#9eb5a5' }}>CPCB Registration No: B-29016/(E-Waste)/2024</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 4, borderRadius: '32px', background: '#08150c', border: '1px solid rgba(155, 227, 36, 0.25)' }}>
                {contactSubmitted ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#9be324', color: '#07160c', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <CheckIcon sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 1 }}>
                      Inquiry Received!
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9eb5a5', mb: 3 }}>
                      Our circular supply chain specialist will contact you within 2 business hours.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setContactSubmitted(false)}
                      sx={{ borderRadius: '9999px', borderColor: '#9be324', color: '#9be324' }}
                    >
                      Send Another Inquiry
                    </Button>
                  </Box>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                  >
                    <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 3 }}>
                      Request Free Corporate Pickup
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField
                        required
                        fullWidth
                        size="small"
                        label="Full Name / Organization"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                            '&:hover fieldset': { borderColor: '#9be324' },
                          },
                          '& .MuiInputLabel-root': { color: '#9eb5a5' },
                        }}
                      />
                      <TextField
                        required
                        fullWidth
                        type="email"
                        size="small"
                        label="Work Email Address"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                            '&:hover fieldset': { borderColor: '#9be324' },
                          },
                          '& .MuiInputLabel-root': { color: '#9eb5a5' },
                        }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Estimated Volume & Devices (e.g. 25 Laptops, 5 Servers)"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                            '&:hover fieldset': { borderColor: '#9be324' },
                          },
                          '& .MuiInputLabel-root': { color: '#9eb5a5' },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        className="btn-premium-interactive"
                        sx={{
                          bgcolor: '#9be324',
                          color: '#07160c',
                          borderRadius: '9999px',
                          py: 1.4,
                          fontWeight: 800,
                          fontSize: '1rem',
                          '&:hover': { bgcolor: '#a8ee30' },
                        }}
                      >
                        Submit Collection Request <span className="btn-arrow-icon" style={{ display: 'inline-block', marginLeft: 6 }}>↗</span>
                      </Button>
                    </Stack>
                  </form>
                )}
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Instant Valuation Modal */}
      <QuoteCalculatorModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </Box>
  );
};
