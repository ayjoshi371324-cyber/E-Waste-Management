import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AutoAwesome as AIIcon,
  CardGiftcard as GiftIcon,
  CheckCircle as VerifiedIcon,
  Recycling as EcoIcon,
  FactCheck as SubmitIcon,
  Leaderboard as LeaderboardIcon,
  LocationOn as MapIcon,
  Menu as MenuIcon,
  MenuBook as GuideIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, balance, logout, isAdmin, isCenterRep } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElMobile, setAnchorElMobile] = useState<null | HTMLElement>(null);

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: <EcoIcon fontSize="small" /> },
    { label: 'Find Centers', path: '/centers', icon: <MapIcon fontSize="small" /> },
    { label: 'AI Identify', path: '/ai-classify', icon: <AIIcon fontSize="small" /> },
    { label: 'Catalog & Guide', path: '/guide', icon: <GuideIcon fontSize="small" /> },
    { label: 'Submit Evidence', path: '/submit', icon: <SubmitIcon fontSize="small" /> },
    { label: 'Rewards', path: '/rewards', icon: <GiftIcon fontSize="small" /> },
  ];

  if (isAdmin || isCenterRep) {
    navLinks.push({
      label: 'Admin Queue',
      path: '/admin',
      icon: <AdminIcon fontSize="small" />,
    });
  }

  const handleLogout = async () => {
    setAnchorElUser(null);
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 70 }}>
          {/* Brand Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 3,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              <EcoIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #34d399 0%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}
              >
                EcoCycle
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                SMART E-WASTE PLATFORM
              </Typography>
            </Box>
          </Box>

          {/* Desktop Nav Links */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', lg: 'flex' }, gap: 0.5 }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  component={Link}
                  to={link.path}
                  startIcon={link.icon}
                  sx={{
                    color: active ? '#10b981' : '#9ca3af',
                    backgroundColor: active ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    border: active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                    borderRadius: 2,
                    px: 1.8,
                    py: 0.8,
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#f3f4f6',
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          {/* User Controls & Balance Pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                {/* Eco Points Pill */}
                <Box
                  component={Link}
                  to="/rewards"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.6,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      borderColor: '#10b981',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                    },
                  }}
                >
                  <EcoIcon sx={{ color: '#10b981', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#34d399' }}>
                    {balance.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                    PTS
                  </Typography>
                </Box>

                {/* Role Chip */}
                <Chip
                  label={isAdmin ? 'Admin' : isCenterRep ? 'Center Rep' : 'Citizen'}
                  size="small"
                  color={isAdmin ? 'error' : isCenterRep ? 'info' : 'success'}
                  variant="outlined"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 600 }}
                />

                {/* User Avatar Menu */}
                <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.dark',
                      border: '2px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        background: '#111827',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 3,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        minWidth: 200,
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                      {user.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={() => { setAnchorElUser(null); navigate('/submit'); }}>
                    My Submissions
                  </MenuItem>
                  <MenuItem onClick={() => { setAnchorElUser(null); navigate('/rewards'); }}>
                    Rewards & Badges
                  </MenuItem>
                  {isAdmin && (
                    <MenuItem onClick={() => { setAnchorElUser(null); navigate('/admin'); }}>
                      Admin Review Queue
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button component={Link} to="/login" variant="outlined" color="primary">
                  Sign In
                </Button>
                <Button component={Link} to="/register" variant="contained" color="primary">
                  Register
                </Button>
              </Box>
            )}

            {/* Mobile Hamburger Menu */}
            <IconButton
              sx={{ display: { xs: 'flex', lg: 'none' }, color: '#9ca3af' }}
              onClick={(e) => setAnchorElMobile(e.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElMobile}
              open={Boolean(anchorElMobile)}
              onClose={() => setAnchorElMobile(null)}
              slotProps={{
                paper: {
                  sx: {
                    background: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    width: 220,
                  },
                },
              }}
            >
              {navLinks.map((link) => (
                <MenuItem
                  key={link.path}
                  onClick={() => {
                    setAnchorElMobile(null);
                    navigate(link.path);
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>{link.icon}</Box>
                  {link.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
