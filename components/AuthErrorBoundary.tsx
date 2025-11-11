'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import React from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary component for handling authentication-related errors
 * Provides graceful degradation when auth services fail
 */
export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Update state to trigger error UI
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    // Auth Error Boundary caught an error

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Reload the page to retry authentication
    window.location.reload();
  };

  private handleSignOut = () => {
    // Clear any cached auth state and redirect to sign-in
    // This should trigger Clerk's sign out
    window.location.href = '/sign-in';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 500, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Typography
                variant='h5'
                component='h1'
                gutterBottom
                color='error'
              >
                Authentication Error
              </Typography>

              <Alert severity='error' sx={{ mb: 3, textAlign: 'left' }}>
                {process.env.NODE_ENV === 'development' ? (
                  <>
                    <Typography variant='body2' paragraph>
                      <strong>Development Error Details:</strong>
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    >
                      {this.state.error?.message ||
                        'Unknown authentication error'}
                    </Typography>
                    {this.state.error?.stack && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ cursor: 'pointer' }}>
                          Stack Trace
                        </summary>
                        <pre
                          style={{
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            marginTop: '8px',
                          }}
                        >
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </>
                ) : (
                  'We encountered an issue with authentication. Please try signing in again.'
                )}
              </Alert>

              <Typography variant='body1' color='text.secondary' paragraph>
                {process.env.NODE_ENV === 'development'
                  ? 'Check the console for more details and verify your Clerk configuration.'
                  : 'If this problem persists, please contact support.'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant='contained'
                  onClick={this.handleRetry}
                  data-testid='retry-button'
                >
                  Retry
                </Button>
                <Button
                  variant='outlined'
                  onClick={this.handleSignOut}
                  data-testid='sign-out-button'
                >
                  Sign Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export function useAuthErrorHandler() {
  return {
    reportError: (error: Error) => {
      // This will be caught by the nearest error boundary
      throw error;
    },
  };
}
