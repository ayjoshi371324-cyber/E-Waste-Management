import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  Chip,
  Container,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CardGiftcard as GiftIcon,
  Recycling as EcoIcon,
  TrendingUp as TrendingUpIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const DashboardPage: React.FC = () => {
  // Video Background Control State
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const highlightsReveal = useScrollReveal({ threshold: 0.1 });
  const howReveal = useScrollReveal({ threshold: 0.1 });

  return (
    <Box sx={{ color: '#f4fbf5', overflowX: 'hidden' }}>
      {/* 
        ========================================================================
        HERO SECTION (Strictly matching reference with sequential entrance & slow zoom)
        ========================================================================
      */}
      <Container maxWidth="xl" sx={{ pt: { xs: 1, md: 2 }, pb: { xs: 3, md: 4 } }}>
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
        FEATURE HIGHLIGHTS CARDS
        ========================================================================
      */}
      <Container
        ref={highlightsReveal.ref}
        maxWidth="xl"
        className={`scroll-reveal ${highlightsReveal.isRevealed ? 'revealed' : ''}`}
        sx={{ py: { xs: 3, md: 5 } }}
      >
        <Grid container spacing={3}>
          {[
            {
              title: 'AI-Powered E-Waste Classification',
              desc: 'Identifies electronic waste using AI-based vision classification. Upload photos or documents to identify device categories, component composition, and recycling value.',
              tag: 'Computer Vision AI',
              icon: <AIIcon sx={{ fontSize: 28, color: '#9be324' }} />,
              color: '#9be324',
              badgeBg: 'rgba(155, 227, 36, 0.12)',
            },
            {
              title: 'Verified Recycling Centers',
              desc: 'Discover authorized and government-certified (CPCB/R2) recycling centers near you. Access real-time location details, operational hours, and accepted electronic devices.',
              tag: 'Certified Facility Network',
              icon: <VerifiedIcon sx={{ fontSize: 28, color: '#38bdf8' }} />,
              color: '#38bdf8',
              badgeBg: 'rgba(56, 189, 248, 0.12)',
            },
            {
              title: 'Smart Recycling Records',
              desc: 'Maintains clear recycling activity records and verification details for transparent tracking. Ensures end-to-end accountability for every collected and dismantled device.',
              tag: 'Verifiable Audit Trail',
              icon: <ShieldIcon sx={{ fontSize: 28, color: '#a78bfa' }} />,
              color: '#a78bfa',
              badgeBg: 'rgba(167, 139, 250, 0.12)',
            },
            {
              title: 'Reward Points System',
              desc: 'Encourages responsible disposal by awarding eco points for eligible, verified recycling activities. Track your balance and redeem points for sustainable rewards.',
              tag: 'Activity-Driven Points',
              icon: <GiftIcon sx={{ fontSize: 28, color: '#f59e0b' }} />,
              color: '#f59e0b',
              badgeBg: 'rgba(245, 158, 11, 0.12)',
            },
            {
              title: 'Environmental Sustainability',
              desc: 'Promotes responsible e-waste disposal, resource recovery, and reduced environmental pollution by diverting hazardous heavy metals and recovering valuable materials.',
              tag: 'Circular Economy',
              icon: <EcoIcon sx={{ fontSize: 28, color: '#10b981' }} />,
              color: '#10b981',
              badgeBg: 'rgba(16, 185, 129, 0.12)',
            },
            {
              title: 'Data-Driven Impact',
              desc: 'Displays authentic recycling and environmental impact metrics backed by real application data, showing verified kilograms recycled and CO₂ emissions prevented.',
              tag: 'Live Verified Metrics',
              icon: <TrendingUpIcon sx={{ fontSize: 28, color: '#ec4899' }} />,
              color: '#ec4899',
              badgeBg: 'rgba(236, 72, 153, 0.12)',
            },
          ].map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
              <Card
                className="card-interactive"
                sx={{
                  p: 3.5,
                  borderRadius: '24px',
                  bgcolor: 'rgba(14, 31, 20, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(155, 227, 36, 0.14)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    borderColor: item.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 30px ${item.badgeBg}`,
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box
                      className="card-icon-zoom"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        bgcolor: item.badgeBg,
                        border: `1px solid ${item.color}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Chip
                      label={item.tag}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        color: '#9eb5a5',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 700,
                      color: '#ffffff',
                      mb: 1.2,
                      fontSize: '1.2rem',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#9eb5a5',
                      lineHeight: 1.65,
                      fontSize: '0.92rem',
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
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
        sx={{ py: { xs: 4, md: 6 }, mb: { xs: 4, md: 6 } }}
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
    </Box>
  );
};
