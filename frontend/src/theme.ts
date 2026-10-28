import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9be324', // Electric Eco-Lime matching the reference UI
      light: '#bbf255',
      dark: '#7bc412',
      contrastText: '#0a1a0f',
    },
    secondary: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#07120a', // Deep forest night
      paper: '#0e1f14',   // Dark forest card background
    },
    text: {
      primary: '#f4fbf5',
      secondary: '#a3b8aa',
    },
    success: {
      main: '#9be324',
      light: '#bbf255',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shaped matching the reference UI
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(155, 227, 36, 0.25)',
          },
        },
        contained: {
          backgroundColor: '#9be324',
          color: '#07160c',
          '&:hover': {
            backgroundColor: '#a8ee30',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(14, 31, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(155, 227, 36, 0.12)',
          borderRadius: 24,
          transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            borderColor: 'rgba(155, 227, 36, 0.35)',
            boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(155, 227, 36, 0.15)',
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 9999,
        },
      },
    },
  },
});

