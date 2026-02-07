'use client';

/**
 * AdminPageContainer Component
 * Feature: 024-admin-dashboard
 *
 * Provides consistent layout container with standardized width and spacing
 * for all admin pages.
 */

import { Box, Container, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { ADMIN_LAYOUT } from '@/lib/constants/admin';
import type { BreadcrumbItem } from '@/lib/types/admin';
import { AdminBreadcrumb } from './AdminBreadcrumb';

interface AdminPageContainerProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Breadcrumb items (dashboard is auto-prepended) */
  breadcrumbs?: BreadcrumbItem[];
  /** Page content */
  children: ReactNode;
  /** Optional action buttons for the header area */
  actions?: ReactNode;
  /** Optional props for the h1 title (e.g., data-testid) */
  titleProps?: React.HTMLAttributes<HTMLHeadingElement> & {
    'data-testid'?: string;
  };
}

export function AdminPageContainer({
  title,
  subtitle,
  breadcrumbs = [],
  children,
  actions,
  titleProps,
}: AdminPageContainerProps) {
  return (
    <Container
      maxWidth={ADMIN_LAYOUT.CONTAINER_MAX_WIDTH}
      data-testid='admin-page-container'
      sx={{
        pt: ADMIN_LAYOUT.HEAD_SPACE.paddingTop,
        pb: ADMIN_LAYOUT.HEAD_SPACE.paddingBottom,
      }}
    >
      {/* Breadcrumb Navigation */}
      <AdminBreadcrumb items={breadcrumbs} />

      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
          mb: ADMIN_LAYOUT.HEAD_SPACE.marginBottom,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom={!!subtitle}
            {...titleProps}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant='body1' color='text.secondary'>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Box>

      {/* Page Content */}
      {children}
    </Container>
  );
}
