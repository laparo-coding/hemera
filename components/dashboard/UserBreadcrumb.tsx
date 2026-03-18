'use client';

/**
 * UserBreadcrumb Component
 * Feature: 024-admin-dashboard
 *
 * Provides consistent breadcrumb navigation across user dashboard pages.
 */

import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';
import { colors, typography } from '@/lib/design-tokens';

export interface UserBreadcrumbItem {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Whether this is the current page */
  current?: boolean;
}

interface UserBreadcrumbProps {
  /** Breadcrumb items to display. Dashboard is always prepended. */
  items: UserBreadcrumbItem[];
}

export function UserBreadcrumb({ items }: UserBreadcrumbProps) {
  // Always include dashboard as first item
  const allItems: UserBreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      current: items.length === 0,
    },
    ...items,
  ];

  return (
    <Breadcrumbs
      data-testid='user-breadcrumb'
      separator={
        <NavigateNextIcon
          fontSize='small'
          sx={{ color: colors.marsala, opacity: 0.5 }}
        />
      }
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
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: colors.marsala,
                fontFamily: typography.body,
                fontSize: '0.875rem',
              }}
            >
              {isFirst && <HomeIcon fontSize='small' />}
              {item.label}
            </Typography>
          );
        }

        // Navigable link
        return (
          <MuiLink
            key={item.href}
            component={Link}
            href={item.href}
            underline='hover'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: colors.marsala,
              opacity: 0.7,
              fontFamily: typography.body,
              fontSize: '0.875rem',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            {isFirst && <HomeIcon fontSize='small' />}
            {item.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}
