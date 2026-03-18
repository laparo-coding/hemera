import { createTheme } from '@mui/material/styles';
import { colors } from './design-tokens';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.marsala,
      light: '#A05A5C',
      dark: colors.marsalaDark,
    },
    secondary: {
      main: colors.bronze,
      light: '#AB856A',
      dark: '#7A5639',
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
      main: colors.rosyBrown,
      light: '#CCAAAA',
      dark: '#A07878',
    },
    info: {
      main: colors.infoMain,
      light: colors.infoLight,
      dark: colors.infoDark,
    },
    background: {
      default: colors.beige,
      paper: colors.white,
    },
    text: {
      primary: colors.lightBlack,
      secondary: colors.marsala,
    },
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    body1: {
      color: colors.lightBlack,
    },
    body2: {
      color: colors.lightBlack,
    },
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.marsala,
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.marsala,
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.marsala,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.marsala,
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '0.02em',
      color: colors.marsala,
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: colors.marsala,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.rosyBrown,
          color: colors.beige,
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
