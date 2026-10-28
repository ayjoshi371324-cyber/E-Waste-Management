import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Business as BusinessIcon,
  CardGiftcard as GiftIcon,
  CheckCircle as CheckIcon,
  FactCheck as ReceiptIcon,
  LocationOn as MapIcon,
  MiscellaneousServices as ServicesIcon,
  MilitaryTech as BadgeIcon,
  PrecisionManufacturing as ProcessIcon,
  Recycling as EcoIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { QuoteCalculatorModal } from '../components/QuoteCalculatorModal';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const ServicesPage: React.FC = () => {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const coreServicesReveal = useScrollReveal({ threshold: 0.1 });
  const enterpriseReveal = useScrollReveal({ threshold: 0.1 });
  const workflowReveal = useScrollReveal({ threshold: 0.1 });

  const servicesList = [
    {
      title: 'AI Computer Vision Device Triage',
      badge: 'PYTORCH MOBILENETV3',
      desc: 'Instant visual contour and component classification from your camera. Detects smartphones, laptops, PCBs, lithium batteries, and hazardous materials with confidence probability scores.',
      icon: <AIIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Launch AI Scanner',
      link: '/ai-classify',
      features: ['Automatic hazard level classification', 'Component material breakdown', 'Manufacturer disposal guidelines'],
    },
    {
      title: 'PostGIS Authorized Center Network',
      badge: 'POSTGIS GEOSPATIAL',
      desc: 'Locate authorized, government-certified e-waste collection facilities using accurate geodesic spatial queries. Filter by accepted categories and active operational hours.',
      icon: <MapIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Explore Center Map',
      link: '/centers',
      features: ['Live distance & GPS directions', 'Certified CPCB registration verification', 'Real-time intake status'],
    },
    {
      title: 'Cryptographic Chain of Custody & Receipts',
      badge: 'TAMPER-PROOF AUDIT',
      desc: 'Receive digital receipts with verifiable SHA-256 cryptographic hashes for every drop-off. Ideal for corporate environmental compliance, CSR filings, and audit tracking.',
      icon: <ShieldIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Submit Drop-Off Evidence',
      link: '/submit',
      features: ['Immutable digital receipt generator', 'EPR regulatory compliance export', 'On-site scale weight verification'],
    },
    {
      title: 'Circular Eco-Points & Reward Marketplace',
      badge: 'TRANSACTIONAL REWARDS',
      desc: 'Earn verified eco-points tied strictly to physical scale weigh-ins. Redeem points for zero-waste lifestyle vouchers, certified carbon offsets, and tree planting drives.',
      icon: <GiftIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Browse Reward Catalog',
      link: '/rewards',
      features: ['Double-entry ledger accounting', 'Zero counterfeit point guarantee', 'Instant redemption with idempotency keys'],
    },
    {
      title: 'NIST 800-88 Data Sanitization & Shredding',
      badge: 'DATA SECURITY CERTIFIED',
      desc: 'Enterprise-grade data sanitization for retired servers, hard drives, and mobile devices. Certified multi-pass overwrites or physical punch deconstruction with serial certificate.',
      icon: <SecurityIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Schedule Corporate Disposal',
      action: () => setQuoteOpen(true),
      features: ['DoD 5220.22-M & NIST 800-88 compliance', 'Serialized destruction certificates', 'Video audit logs for confidential media'],
    },
    {
      title: 'Material Recovery & Smelting Partnerships',
      badge: 'CIRCULAR ECONOMY',
      desc: 'Closed-loop extraction of precious and critical raw materials: 99.8% recovery of gold, silver, palladium, and copper. Reintroduced directly into renewable clean-tech manufacturing.',
      icon: <ProcessIcon sx={{ fontSize: 36, color: '#9be324' }} />,
      cta: 'Inspect Material Catalog',
      link: '/guide',
      features: ['Direct smelter supply chain routing', 'Toxic leachate and slag mitigation', 'Formalized circular economy metrics'],
    },
  ];

  return (
    <Box sx={{ color: '#f4fbf5', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="xl">
        {/* Header Hero Section */}
        <Box sx={{ textAlign: 'center', maxWidth: 880, mx: 'auto', mb: { xs: 6, md: 10 } }}>
          <Chip
            icon={<ServicesIcon style={{ color: '#9be324' }} />}
            label="FULL-SPECTRUM E-WASTE INFRASTRUCTURE"
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
            End-to-End <span style={{ color: '#9be324' }}>Circular Electronics</span> Services
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
            From automated AI triage on your mobile phone to certified drop-off logistics, NIST data sanitization, and regulatory EPR reporting, we power high-integrity e-waste stewardship.
          </Typography>
        </Box>

        {/* 6 Comprehensive Services Cards */}
        <Box ref={coreServicesReveal.ref} sx={{ mb: { xs: 8, md: 12 } }}>
          <Grid container spacing={3.5} className={`scroll-reveal ${coreServicesReveal.isRevealed ? 'revealed' : ''}`}>
            {servicesList.map((service, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx} className={`stagger-${(idx % 4) + 1}`}>
                <Card
                  className="card-interactive"
                  sx={{
                    p: 4,
                    borderRadius: '28px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(14, 31, 20, 0.65)',
                    border: '1px solid rgba(155, 227, 36, 0.22)',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box
                        className="card-icon-zoom"
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '20px',
                          bgcolor: 'rgba(155, 227, 36, 0.12)',
                          border: '1px solid rgba(155, 227, 36, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {service.icon}
                      </Box>
                      <Chip
                        label={service.badge}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: '#a3b8aa',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 800,
                        color: '#f4fbf5',
                        mb: 1.5,
                      }}
                    >
                      {service.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9eb5a5', lineHeight: 1.65, mb: 3 }}>
                      {service.desc}
                    </Typography>

                    {/* Feature bullet list */}
                    <Stack spacing={1} sx={{ mb: 4 }}>
                      {service.features.map((feat, fIdx) => (
                        <Box key={fIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <CheckIcon sx={{ color: '#9be324', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: '#d1e3d7', fontWeight: 600 }}>
                            {feat}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {service.link ? (
                    <Button
                      component={Link}
                      to={service.link}
                      variant="outlined"
                      fullWidth
                      className="btn-premium-interactive"
                      sx={{
                        borderColor: 'rgba(155, 227, 36, 0.4)',
                        color: '#9be324',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        py: 1.3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        '&:hover': {
                          borderColor: '#9be324',
                          bgcolor: 'rgba(155, 227, 36, 0.1)',
                        },
                      }}
                    >
                      <span>{service.cta}</span>
                      <span className="btn-arrow-icon">↗</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={service.action}
                      variant="outlined"
                      fullWidth
                      className="btn-premium-interactive"
                      sx={{
                        borderColor: 'rgba(155, 227, 36, 0.4)',
                        color: '#9be324',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        py: 1.3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        '&:hover': {
                          borderColor: '#9be324',
                          bgcolor: 'rgba(155, 227, 36, 0.1)',
                        },
                      }}
                    >
                      <span>{service.cta}</span>
                      <span className="btn-arrow-icon">↗</span>
                    </Button>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Enterprise & Corporate Disposal Banner */}
        <Box
          ref={enterpriseReveal.ref}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: '36px',
            background: 'linear-gradient(135deg, rgba(14, 38, 22, 0.9) 0%, rgba(7, 18, 10, 0.95) 100%)',
            border: '2px solid rgba(155, 227, 36, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            mb: 8,
          }}
          className={`scroll-reveal ${enterpriseReveal.isRevealed ? 'revealed' : ''}`}
        >
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Chip
                label="ENTERPRISE IT DISPOSAL (ITAD)"
                sx={{ bgcolor: 'rgba(155, 227, 36, 0.2)', color: '#9be324', fontWeight: 800, fontSize: '0.75rem', mb: 2 }}
              />
              <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5', mb: 2 }}>
                Bulk Corporate Decommissioning & Extended Producer Responsibility
              </Typography>
              <Typography variant="body1" sx={{ color: '#c8ded0', lineHeight: 1.7, mb: 3 }}>
                Managing corporate office relocations, fleet laptop refreshes, or data center hardware retirements?
                We provide scheduled secure transport, serialized barcode intake, on-premise disk shredding, and legal CPCB Form 6 documentation.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  onClick={() => setQuoteOpen(true)}
                  variant="contained"
                  className="btn-premium-interactive"
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    px: 3.5,
                    py: 1.3,
                    '&:hover': { bgcolor: '#a8ee30' },
                  }}
                >
                  Request Bulk Enterprise Valuation ↗
                </Button>
                <Button
                  component={Link}
                  to="/#contact"
                  variant="outlined"
                  className="btn-premium-interactive"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#f4fbf5',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    px: 3,
                    py: 1.3,
                  }}
                >
                  Contact Sustainability Team
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(155, 227, 36, 0.2)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9be324', mb: 1.5, letterSpacing: '0.06em' }}>
                  ENTERPRISE DELIVERABLES
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    'Form 6 Manifest & CPCB Regulatory Filing',
                    'NIST 800-88 Cryptographic Sanitization Audit',
                    'Scope 3 GHG Avoidance Carbon Offsets',
                    'Customizable Employee Recycling Drives',
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: '#9be324', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: '#c8ded0', fontWeight: 600 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <QuoteCalculatorModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </Box>
  );
};

