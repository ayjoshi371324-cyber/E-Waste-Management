import React from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  Recycling as EcoIcon,
  Groups as TeamIcon,
  LocationOn as MapIcon,
  MilitaryTech as BadgeIcon,
  PrecisionManufacturing as TechIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const AboutPage: React.FC = () => {
  const missionReveal = useScrollReveal({ threshold: 0.1 });
  const pillarsReveal = useScrollReveal({ threshold: 0.1 });
  const standardsReveal = useScrollReveal({ threshold: 0.1 });
  const teamReveal = useScrollReveal({ threshold: 0.1 });

  return (
    <Box sx={{ color: '#f4fbf5', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="xl">
        {/* Header Hero Section */}
        <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto', mb: { xs: 6, md: 10 } }}>
          <Chip
            icon={<EcoIcon style={{ color: '#9be324' }} />}
            label="ABOUT SMART WASTE PLATFORM"
            sx={{
              bgcolor: 'rgba(155, 227, 36, 0.15)',
              color: '#9be324',
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              mb: 2.5,
              px: 1,
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 900,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.2rem' },
              color: '#f4fbf5',
              lineHeight: 1.15,
              mb: 3,
            }}
          >
            Pioneering Closed-Loop <span style={{ color: '#9be324' }}>E-Waste Stewardship</span>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#c8ded0',
              fontSize: { xs: '1.05rem', md: '1.25rem' },
              lineHeight: 1.75,
              maxWidth: 780,
              mx: 'auto',
            }}
          >
            Discarded electronics are humanity&apos;s fastest-growing municipal waste stream. Smart Waste connects conscious consumers,
            certified recyclers, and enterprises through verified AI classification, immutable chain-of-custody tracking, and tangible circular incentives.
          </Typography>
        </Box>

        {/* Mission & Problem Statement Grid */}
        <Box ref={missionReveal.ref} sx={{ mb: { xs: 8, md: 12 } }}>
          <Grid
            container
            spacing={4}
            className={`scroll-reveal ${missionReveal.isRevealed ? 'revealed' : ''}`}
            sx={{ alignItems: 'center' }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  color: '#f4fbf5',
                  mb: 2.5,
                }}
              >
                Why Urban E-Waste Demands a Smarter Solution
              </Typography>
              <Typography variant="body1" sx={{ color: '#9eb5a5', lineHeight: 1.8, mb: 2.5 }}>
                Every year, over 62 million metric tonnes of electronic waste are generated globally. Less than 22% is properly documented,
                collected, and recycled. Obsolete devices contain valuable critical raw materials—gold, silver, copper, platinum, and cobalt—yet
                often end up incinerated or dumped in informal junkyards, leaking neurotoxic lead, mercury, and PFAS into ground soil.
              </Typography>
              <Typography variant="body1" sx={{ color: '#9eb5a5', lineHeight: 1.8, mb: 4 }}>
                Our platform introduces computational computer vision triage, authorized PostGIS drop-off centers, tamper-evident digital receipts,
                and double-entry eco-points. Every kilogram recycled with Smart Waste is physically verified and audited.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={Link}
                  to="/centers"
                  variant="contained"
                  className="btn-premium-interactive"
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    px: 3.5,
                    py: 1.4,
                    '&:hover': { bgcolor: '#a8ee30' },
                  }}
                >
                  Locate Verified Centers <span className="btn-arrow-icon" style={{ display: 'inline-block', marginLeft: 6 }}>↗</span>
                </Button>
                <Button
                  component={Link}
                  to="/ai-classify"
                  variant="outlined"
                  className="btn-premium-interactive"
                  sx={{
                    borderColor: 'rgba(155, 227, 36, 0.4)',
                    color: '#9be324',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    px: 3,
                    py: 1.4,
                    '&:hover': { borderColor: '#9be324', bgcolor: 'rgba(155, 227, 36, 0.08)' },
                  }}
                >
                  Try AI Scanner ↗
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                className="card-interactive"
                sx={{
                  p: { xs: 3.5, md: 5 },
                  borderRadius: '32px',
                  background: 'linear-gradient(145deg, #0f2617 0%, #07120a 100%)',
                  border: '1px solid rgba(155, 227, 36, 0.3)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                }}
              >
                <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5', mb: 3 }}>
                  Our Sustainability Commitments
                </Typography>
                <Stack spacing={3}>
                  {[
                    {
                      title: '100% Zero-Landfill Guarantee',
                      desc: 'All non-recoverable hazardous constituents are treated at state-certified hazardous treatment, storage, and disposal facilities (TSDF).',
                    },
                    {
                      title: 'NIST 800-88 Data Sanitization',
                      desc: 'Storage media undergo DoD 5220.22-M or NIST 800-88 cryptographic purges and physical degaussing with tamper-proof destruction audit logs.',
                    },
                    {
                      title: 'Transactional Double-Entry Eco-Ledger',
                      desc: 'Points are awarded strictly when verified collection center scales confirm physical device drop-off. No fraudulent claims or double-counting.',
                    },
                    {
                      title: 'Circular Material Recovery',
                      desc: 'Direct smelter partnerships ensure copper, palladium, and rare earths return directly to domestic clean energy manufacturing.',
                    },
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          bgcolor: '#9be324',
                          color: '#07160c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.3,
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f4fbf5', mb: 0.5 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.6 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* 4 Pillars of Integrity */}
        <Box ref={pillarsReveal.ref} sx={{ mb: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: 6 }}>
            <Chip
              label="ARCHITECTURAL FOUNDATION"
              sx={{ bgcolor: 'rgba(155, 227, 36, 0.15)', color: '#9be324', fontWeight: 800, fontSize: '0.75rem', mb: 1.5 }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Built for Absolute Trust & Traceability
            </Typography>
          </Box>

          <Grid container spacing={3} className={`scroll-reveal ${pillarsReveal.isRevealed ? 'revealed' : ''}`}>
            {[
              {
                icon: <TechIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                title: 'AI Computer Vision Classification',
                desc: 'Trained PyTorch MobileNetV3 model predicts device categories, component hazards, and recycling handling priorities directly from smartphone photos.',
              },
              {
                icon: <MapIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                title: 'Geospatial Center Indexing',
                desc: 'PostgreSQL + PostGIS spatial queries calculate accurate geodesic distances to authorized drop-off facilities with verified CPCB licensing status.',
              },
              {
                icon: <ShieldIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                title: 'Cryptographic Chain of Custody',
                desc: 'Digital receipts generate tamper-evident hashes. Organizations use these receipts for corporate Extended Producer Responsibility (EPR) compliance.',
              },
              {
                icon: <BadgeIcon sx={{ fontSize: 32, color: '#9be324' }} />,
                title: 'Gamified Circular Rewards',
                desc: 'Balanced double-entry point system ensures citizen motivation while guaranteeing that rewards correspond to actual verified material tonnage diverted.',
              },
            ].map((pillar, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx} className={`stagger-${idx + 1}`}>
                <Card
                  className="card-interactive"
                  sx={{
                    p: 4,
                    borderRadius: '28px',
                    height: '100%',
                    bgcolor: 'rgba(14, 31, 20, 0.65)',
                    border: '1px solid rgba(155, 227, 36, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    className="card-icon-zoom"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '18px',
                      bgcolor: 'rgba(155, 227, 36, 0.12)',
                      border: '1px solid rgba(155, 227, 36, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    {pillar.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 1.5, color: '#f4fbf5' }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.6, flexGrow: 1 }}>
                    {pillar.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Regulatory & Standards Compliance */}
        <Box
          ref={standardsReveal.ref}
          sx={{
            py: 6,
            px: { xs: 3, md: 6 },
            borderRadius: '36px',
            bgcolor: 'rgba(7, 18, 10, 0.8)',
            border: '1px solid rgba(155, 227, 36, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            mb: { xs: 8, md: 12 },
          }}
          className={`scroll-reveal ${standardsReveal.isRevealed ? 'revealed' : ''}`}
        >
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5', mb: 1.5 }}>
                Official Certifications & Standards
              </Typography>
              <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.7 }}>
                All recycling data, facility credentials, and environmental metrics comply with statutory regulations.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                {[
                  { code: 'CPCB', label: 'Central Pollution Control Board', sub: 'E-Waste (Management) Rules Compliant' },
                  { code: 'NIST', label: 'NIST Special Publication 800-88', sub: 'Guidelines for Media Sanitization' },
                  { code: 'ISO', label: 'ISO 14001 & ISO 27001', sub: 'Environmental & Data Security Certified' },
                  { code: 'WARM', label: 'EPA WARM v15 Methodology', sub: 'Verified GHG CO2e Avoidance Coefficients' },
                ].map((cert, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(155, 227, 36, 0.15)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <VerifiedIcon sx={{ color: '#9be324', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9be324' }}>
                          {cert.code}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#f4fbf5', mb: 0.5 }}>
                        {cert.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8aa392', display: 'block' }}>
                        {cert.sub}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Leadership & Engineering Team */}
        <Box ref={teamReveal.ref} sx={{ mb: 6 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: 6 }}>
            <Chip
              label="OUR LEADERSHIP"
              sx={{ bgcolor: 'rgba(155, 227, 36, 0.15)', color: '#9be324', fontWeight: 800, fontSize: '0.75rem', mb: 1.5 }}
            />
            <Typography variant="h2" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Cross-Disciplinary Experts
            </Typography>
            <Typography variant="body1" sx={{ color: '#9eb5a5', mt: 1 }}>
              Guided by circular economy researchers, distributed systems architects, and certified waste auditors.
            </Typography>
          </Box>

          <Grid container spacing={3} className={`scroll-reveal ${teamReveal.isRevealed ? 'revealed' : ''}`}>
            {[
              {
                name: 'Dr. Aris Thorne',
                role: 'Head of Circular Supply Chains',
                cred: 'PhD Environmental Engineering, ex-UNEP E-Waste Working Group',
              },
              {
                name: 'Maya Lin',
                role: 'Lead AI & Computer Vision',
                cred: 'Computer Vision Researcher, specializing in Edge MobileNetV3 and defect triage',
              },
              {
                name: 'Vikram Seth',
                role: 'Director of Facility Auditing',
                cred: 'Lead CPCB ISO 14001 Environmental Auditor with 15+ years industrial recycling oversight',
              },
              {
                name: 'Elena Rostova',
                role: 'Distributed Systems & Ledger Architect',
                cred: 'Fintech distributed systems expert designing cryptographic double-entry integrity models',
              },
            ].map((member, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx} className={`stagger-${idx + 1}`}>
                <Card
                  className="card-interactive"
                  sx={{
                    p: 3.5,
                    borderRadius: '24px',
                    bgcolor: 'rgba(14, 31, 20, 0.55)',
                    border: '1px solid rgba(155, 227, 36, 0.18)',
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      bgcolor: 'rgba(155, 227, 36, 0.15)',
                      border: '2px solid #9be324',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9be324',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TeamIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5', mb: 0.5 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9be324', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9eb5a5', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {member.cred}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

