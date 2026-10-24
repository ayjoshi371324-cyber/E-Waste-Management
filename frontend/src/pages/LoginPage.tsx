import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Recycling as EcoIcon, Login as LoginIcon, Lock as LockIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
            mb: 2,
          }}
        >
          <EcoIcon sx={{ color: '#fff', fontSize: 32 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
          Welcome to EcoCycle
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
          Sign in to track recycling records, earn points, and discover nearby certified drop-off centers.
        </Typography>
      </Box>

      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{ py: 1.5, mt: 1, fontSize: '1rem' }}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" sx={{ color: '#6b7280', px: 1 }}>
              QUICK DEMO ACCOUNTS
            </Typography>
          </Divider>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickLogin('citizen.jane@example.com', 'AdminPass123!')}
              sx={{ justifyContent: 'space-between', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
            >
              <span>Citizen Jane (User)</span>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>citizen.jane@example.com</Typography>
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickLogin('admin@ewaste.org', 'AdminPass123!')}
              sx={{ justifyContent: 'space-between', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
            >
              <span>System Administrator (Admin)</span>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>admin@ewaste.org</Typography>
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickLogin('center.rep@ecocenter.org', 'AdminPass123!')}
              sx={{ justifyContent: 'space-between', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#22d3ee' }}
            >
              <span>Robert (Center Representative)</span>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>center.rep@ecocenter.org</Typography>
            </Button>
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Don't have an account?{' '}
              <Link href="/register" underline="hover" sx={{ color: '#10b981', fontWeight: 600 }}>
                Create one now
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
