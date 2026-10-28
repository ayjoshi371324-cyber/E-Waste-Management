import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#07120a' }}>
      <Navbar />
      <Box
        component="main"
        key={location.pathname}
        className="page-transition-enter"
        sx={{ flexGrow: 1, pb: 6 }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

