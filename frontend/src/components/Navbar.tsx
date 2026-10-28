import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AutoAwesome as AIIcon,
  CardGiftcard as GiftIcon,
  FactCheck as SubmitIcon,
  Info as AboutIcon,
  LocationOn as MapIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  MenuBook as GuideIcon,
  NorthEast as ArrowIcon,
  People as TeamIcon,
  Person as PersonIcon,
  Phone as ContactIcon,
  Recycling as EcoIcon,
  MiscellaneousServices as ServicesIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, balance, logout, isAdmin, isCenterRep } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems = [
    { label: 'Home', path: '/', isAnchor: false },
    { label: 'Find Centers', path: '/centers', isAnchor: false },
    { label: 'AI Scanner', path: '/ai-classify', isAnchor: false },
    { label: 'Rewards', path: '/rewards', isAnchor: false },
  ];

  const handleNavClick = (item: { label: string; path: string; isAnchor: boolean }) => {
    if (item.isAnchor) {
      if (location.pathname !== '/') {
        navigate(item.path);
      } else {
        const anchorId = item.path.replace('/#', '');
        const elem = document.getElementById(anchorId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setAnchorElUser(null);
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Floating Pill Top Header */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 8, md: 16 },
          zIndex: 1100,
          px: { xs: 2, sm: 3, md: 4 },
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1320,
            bgcolor: '#ffffff',
            borderRadius: '9999px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.08)',
            px: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 1, md: 1.2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Logo matching the reference image */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: 1.2,
              '&:hover .logo-svg-container': {
                transform: 'rotate(12deg) scale(1.06)',
              },
            }}
          >
            <Box
              className="logo-svg-container"
              sx={{
                width: { xs: 38, md: 44 },
                height: { xs: 38, md: 44 },
                borderRadius: '50%',
                bgcolor: '#0e2616',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(14, 38, 22, 0.25)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Custom SVG logo evoking the circular green bin & leaf in screenshot */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 7L18.1 19.1C18 20.2 17.1 21 16 21H8C6.9 21 6 20.2 5.9 19.1L5 7"
                  stroke="#9be324"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M10 11V17" stroke="#9be324" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 11V17" stroke="#9be324" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 7H21" stroke="#9be324" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7"
                  stroke="#9be324"
                  strokeWidth="2"
                />
              </svg>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', md: '1.25rem' },
                  color: '#0e2616',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Smart Waste
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  color: '#2a5937',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                E-Waste Recycling
              </Typography>
            </Box>
          </Box>

          {/* Center Navigation Links with Animated Lime-Green Active Indicator */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: { lg: 1.2, xl: 2 },
            }}
          >
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  sx={{
                    color: isActive ? '#0e2616' : '#2b4433',
                    fontSize: '0.92rem',
                    fontWeight: isActive ? 800 : 600,
                    px: 1.8,
                    py: 0.8,
                    borderRadius: '9999px',
                    position: 'relative',
                    transition: 'color 0.25s ease, background-color 0.25s ease, transform 0.2s ease',
                    bgcolor: isActive ? 'rgba(155, 227, 36, 0.22)' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(155, 227, 36, 0.3)' : 'none',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 4,
                      left: '25%',
                      width: '50%',
                      height: '2.5px',
                      borderRadius: '9999px',
                      bgcolor: '#9be324',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'center',
                      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    },
                    '&:hover': {
                      color: '#0e2616',
                      bgcolor: isActive ? 'rgba(155, 227, 36, 0.28)' : 'rgba(14, 38, 22, 0.06)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'scale(0.97)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Right Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* User points balance if logged in */}
            {user && (
              <Chip
                component={Link}
                to="/rewards"
                icon={<EcoIcon style={{ color: '#0e2616', fontSize: 16 }} />}
                label={`${balance.toLocaleString()} pts`}
                sx={{
                  bgcolor: '#9be324',
                  color: '#0e2616',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: { xs: 'none', sm: 'inline-flex' },
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    bgcolor: '#a8ee30',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(155, 227, 36, 0.4)',
                  },
                }}
              />
            )}

            {/* Profile Avatar / Login */}
            {user ? (
              <>
                <IconButton
                  onClick={(e) => setAnchorElUser(e.currentTarget)}
                  sx={{
                    p: 0.4,
                    border: '2px solid #0e2616',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(14, 38, 22, 0.08)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#0e2616',
                      color: '#9be324',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        borderRadius: '20px',
                        background: '#0e1f14',
                        border: '1px solid rgba(155, 227, 36, 0.2)',
                        color: '#fff',
                        minWidth: 200,
                        boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f4fbf5' }}>
                      {user.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem component={Link} to="/rewards" onClick={() => setAnchorElUser(null)}>
                    <ListItemIcon><GiftIcon fontSize="small" sx={{ color: '#9be324' }} /></ListItemIcon>
                    My Rewards & Points
                  </MenuItem>
                  <MenuItem component={Link} to="/submit" onClick={() => setAnchorElUser(null)}>
                    <ListItemIcon><SubmitIcon fontSize="small" sx={{ color: '#9be324' }} /></ListItemIcon>
                    Submit Drop-off
                  </MenuItem>
                  {(isAdmin || isCenterRep) && (
                    <MenuItem component={Link} to="/admin" onClick={() => setAnchorElUser(null)}>
                      <ListItemIcon><AdminIcon fontSize="small" sx={{ color: '#f59e0b' }} /></ListItemIcon>
                      Admin Queue
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={Link}
                to="/login"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  color: '#0e2616',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  px: 1.8,
                  borderRadius: '9999px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(14,38,22,0.08)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Hamburger Menu */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: '#0e2616',
                bgcolor: 'rgba(14, 38, 22, 0.06)',
                p: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 290,
              bgcolor: '#07120a',
              color: '#f4fbf5',
              p: 3,
              borderLeft: '1px solid rgba(155, 227, 36, 0.2)',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#9be324',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07160c',
            }}
          >
            <EcoIcon />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800 }}>
            Smart Waste
          </Typography>
        </Box>

        <List sx={{ pt: 0 }}>
          {mainNavItems.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item)}
                sx={{
                  borderRadius: 3,
                  bgcolor: location.pathname === item.path ? 'rgba(155,227,36,0.15)' : 'transparent',
                  color: location.pathname === item.path ? '#9be324' : '#c8ded0',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' },
                }}
              >
                <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</Typography>} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              component={Link}
              to="/submit"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 3, color: '#c8ded0' }}
            >
              <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Submit Evidence</Typography>} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/guide"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 3, color: '#c8ded0' }}
            >
              <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Catalog & Safety Guide</Typography>} />
            </ListItemButton>
          </ListItem>
        </List>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            component={Link}
            to="/ai-classify"
            onClick={() => setMobileOpen(false)}
            sx={{
              bgcolor: '#9be324',
              color: '#07160c',
              borderRadius: '9999px',
              fontWeight: 800,
              py: 1.2,
              mb: 1.5,
            }}
          >
            AI Device Scanner ↗
          </Button>
          {!user ? (
            <Button
              variant="outlined"
              fullWidth
              component={Link}
              to="/login"
              onClick={() => setMobileOpen(false)}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '9999px',
                py: 1,
              }}
            >
              Sign In
            </Button>
          ) : (
            <Button
              variant="text"
              fullWidth
              onClick={handleLogout}
              sx={{ color: '#ef4444', py: 1 }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Drawer>
    </>
  );
};
