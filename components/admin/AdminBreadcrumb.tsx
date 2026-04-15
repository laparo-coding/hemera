'use client';

/**
 * AdminBreadcrumb Component
 * Feature: 024-admin-dashboard
 *
 * Provides consistent breadcrumb navigation across all admin pages.
 */

import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import Link from 'next/link';
import { ADMIN_LABELS, ADMIN_ROUTES } from '@/lib/constants/admin';
import type { BreadcrumbItem } from '@/lib/types/admin';

interface AdminBreadcrumbProps {
  /** Breadcrumb items to display. Dashboard is always prepended. */
  items: BreadcrumbItem[];
}

const breadcrumbTextSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  // Always include dashboard as first item
  const allItems: BreadcrumbItem[] = [
    {
      label: ADMIN_LABELS.adminDashboard,
      href: ADMIN_ROUTES.DASHBOARD,
      current: items.length === 0,
    },
    ...items,
  ];

  return (
    <Breadcrumbs
      data-testid='admin-breadcrumb'
      separator={<NavigateNextIcon fontSize='small' />}
      aria-label='Breadcrumb-Navigation'
      sx={{ mb: 2 }}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isFirst = index === 0;

        if (isLast || item.current) {
          // Current page - not a link
          return (
            <Typography
              key={item.href}
              color='text.primary'
              sx={breadcrumbTextSx}
            >
              {isFirst && <HomeIcon fontSize='small' />}
              {item.label}
            </Typography>
          );
        }

        // Link to other page
        return (
          <MuiLink
            key={item.href}
            component={Link}
            href={item.href}
            color='text.primary'
            underline='hover'
            sx={breadcrumbTextSx}
          >
            {isFirst && <HomeIcon fontSize='small' />}
            {item.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}
