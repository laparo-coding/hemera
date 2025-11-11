import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0056d2', // Coursera blue
      light: '#3373cc',
      dark: '#0041a3',
    },
    secondary: {
      main: '#f09300', // Coursera orange
      light: '#f3a733',
      dark: '#cc7500',
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
      main: '#4caf50',
      light: '#66bb6a',
      dark: '#43a047',
    },
    info: {
      main: '#00acc1',
      light: '#26c6da',
      dark: '#00acc1',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
  },
  shape: {
    borderRadius: 3,
  },
});

export default theme;
