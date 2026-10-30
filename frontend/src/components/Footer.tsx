import React from 'react';
import { Box, Container, Divider, Grid, Link, Typography } from '@mui/material';
import { Recycling as EcoIcon, Security as SecurityIcon } from '@mui/icons-material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#07120a',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} sx={{ justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                }}
              >
                <EcoIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#f3f4f6' }}>
                EcoCycle Platform
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2, maxWidth: 450, lineHeight: 1.6 }}>
              A high-integrity digital platform for verifiable e-waste recycling, certified collection center discovery,
              device safety guidance, and incentivized circular economy rewards.
            </Typography>
            {/* Disclaimer box */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 2,
                borderRadius: 2.5,
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                maxWidth: 520,
              }}
            >
              <SecurityIcon sx={{ color: '#f59e0b', fontSize: 20, mt: 0.2 }} />
              <Typography variant="caption" sx={{ color: '#fbbf24', lineHeight: 1.5 }}>
                <strong>Important Notice:</strong> AI classification models provide suggestive categories only. Predictions
                do not replace certified chemical or physical safety assessments. Always follow manufacturer-guided
                battery removal and data wipe procedures before drop-off.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 2 }}>
              Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/centers" underline="hover" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nearby Centers</Link>
              <Link href="/ai-classify" underline="hover" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>AI Scanner</Link>
              <Link href="/guide" underline="hover" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>Recycling Guides</Link>
              <Link href="/rewards" underline="hover" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>Eco Rewards</Link>
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 2 }}>
              Integrity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                PostgreSQL + PostGIS
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Double-Entry Ledger
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Digital Receipts
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Single Award Guarantee
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            © {new Date().getFullYear()} EcoCycle E-Waste Recycling Platform. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
            Zero Pickup Policy • 100% Certified Center Drop-Off
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
