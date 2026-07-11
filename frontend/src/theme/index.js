import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF',
      light: '#33EAFF',
      dark: '#00B8CC',
      contrastText: '#050816',
    },
    accent: {
      main: '#00D395',
      light: '#33DCAA',
      dark: '#00B17D',
    },
    secondary: {
      main: '#4F7CFF',
      light: '#7296FF',
      dark: '#3A5FCC',
      contrastText: '#fff',
    },
    success: {
      main: '#00C853',
      light: '#33D375',
      dark: '#00A042',
    },
    error: {
      main: '#FF5252',
      light: '#FF7575',
      dark: '#CC4242',
    },
    warning: {
      main: '#FFC107',
      light: '#FFCD38',
      dark: '#CC9A06',
    },
    info: {
      main: '#4F7CFF',
      light: '#7296FF',
      dark: '#3A5FCC',
    },
    background: {
      default: '#050816',
      paper: '#0B1220',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      disabled: 'rgba(148, 163, 184, 0.5)',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.25,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.005em',
      lineHeight: 1.35,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.8rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: 'rgba(148,163,184,0.2) transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: 'transparent',
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: 'rgba(148,163,184,0.2)',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(148,163,184,0.35)',
          },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.35)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00E5FF 0%, #00BCD4 100%)',
          color: '#050816',
          boxShadow: '0 4px 16px rgba(0, 229, 255, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33EAFF 0%, #00E5FF 100%)',
            boxShadow: '0 6px 24px rgba(0, 229, 255, 0.35)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #4F7CFF 0%, #3A5FCC 100%)',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(79, 124, 255, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7296FF 0%, #4F7CFF 100%)',
            boxShadow: '0 6px 24px rgba(79, 124, 255, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          '&:hover': {
            borderColor: '#00E5FF',
            background: 'rgba(0, 229, 255, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00E5FF',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '0 4px',
          fontWeight: 500,
          textTransform: 'none',
          minHeight: 36,
          '&.Mui-selected': {
            background: 'rgba(0, 229, 255, 0.1)',
            color: '#00E5FF',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #00E5FF, #4F7CFF)',
        },
      },
    },
  },
});

export default darkTheme;