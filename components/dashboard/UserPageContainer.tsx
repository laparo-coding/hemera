'use client';

/**
 * UserPageContainer Component
 * Feature: 024-admin-dashboard
 *
 * Provides consistent layout container with standardized width and spacing
 * for all user dashboard pages.
 */

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/lib/design-tokens';
import { UserBreadcrumb, type UserBreadcrumbItem } from './UserBreadcrumb';

/** Head space for user dashboard pages (MUI spacing units) */
const USER_HEAD_SPACE = {
  paddingTop: 4, // 32px
  paddingBottom: 3, // 24px
  marginBottom: 4, // 32px
} as const;

interface UserPageContainerProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Breadcrumb items (dashboard is auto-prepended) */
  breadcrumbs?: UserBreadcrumbItem[];
  /** Page content */
  children: ReactNode;
  /** Optional action buttons for the header area */
  actions?: ReactNode;
  /** Optional h1 element attributes (e.g., data-testid) */
  titleProps?: React.HTMLAttributes<HTMLHeadingElement> & {
    'data-testid'?: string;
  };
}

export function UserPageContainer({
  title,
  subtitle,
  breadcrumbs = [],
  children,
  actions,
  titleProps,
}: UserPageContainerProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.cream,
        pt: USER_HEAD_SPACE.paddingTop,
        px: { xs: 2, sm: 3, md: 4 },
        pb: USER_HEAD_SPACE.paddingBottom,
      }}
    >
      <Box
        sx={{ maxWidth: 1200, mx: 'auto' }}
        data-testid='user-page-container'
      >
        {/* Breadcrumb Navigation */}
        <UserBreadcrumb items={breadcrumbs} />

        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            mb: USER_HEAD_SPACE.marginBottom,
          }}
        >
          <Box>
            <Typography
              component='h1'
              data-testid={titleProps?.['data-testid'] ?? 'dashboard-title'}
              {...titleProps}
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: colors.petrol,
                mb: subtitle ? 1 : 0,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1rem',
                  color: colors.petrol,
                  opacity: 0.8,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
        </Box>

        {/* Page Content */}
        {children}
      </Box>
    </Box>
  );
}
