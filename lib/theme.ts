import { createTheme } from '@mui/material/styles';

// Hemera Design Tokens
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.petrol,
      light: '#2A5A6A',
      dark: '#0D2A33',
    },
    secondary: {
      main: colors.gold,
      light: '#E5BC75',
      dark: '#C99744',
    },
    warning: {
      main: '#ff9800',
      light: '#ffa726',
      dark: '#fb8c00',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#e53935',
    },
    success: {
      main: colors.sage,
      light: '#B8D9D2',
      dark: '#8FBFB6',
    },
    info: {
      main: colors.petrol,
      light: '#2A5A6A',
      dark: '#0D2A33',
    },
    background: {
      default: colors.cream,
      paper: '#ffffff',
    },
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.petrol,
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.petrol,
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.petrol,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.petrol,
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '0.02em',
      color: colors.petrol,
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.petrol,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.cream,
          color: colors.petrol,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          '@media (min-width: 600px)': {
            minHeight: '64px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        maxWidthLg: {
          '@media (min-width: 1200px)': {
            maxWidth: '1200px',
          },
        },
      },
    },
  },
});

export default theme;
