'use client';

/**
 * DashboardCard Component
 * Feature: 024-admin-dashboard
 *
 * Clickable card for admin dashboard navigation grid.
 */

import AnalyticsIcon from '@mui/icons-material/Analytics';
import FolderIcon from '@mui/icons-material/Folder';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DashboardCard as DashboardCardConfig } from '@/lib/constants/admin';
import { ADMIN_LAYOUT } from '@/lib/constants/admin';

interface DashboardCardProps {
  /** Card configuration from DASHBOARD_CARDS */
  config: DashboardCardConfig;
}

// Icon mapping
const iconMap: Record<string, ReactNode> = {
  People: <PeopleIcon sx={{ fontSize: 48 }} />,
  School: <SchoolIcon sx={{ fontSize: 48 }} />,
  Folder: <FolderIcon sx={{ fontSize: 48 }} />,
  LocationOn: <LocationOnIcon sx={{ fontSize: 48 }} />,
  FormatQuote: <FormatQuoteIcon sx={{ fontSize: 48 }} />,
  Settings: <SettingsIcon sx={{ fontSize: 48 }} />,
  Analytics: <AnalyticsIcon sx={{ fontSize: 48 }} />,
};

export function DashboardCard({ config }: DashboardCardProps) {
  const { id, titleDe, descriptionDe, route, icon, enabled } = config;

  const cardContent = (
    <CardContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: ADMIN_LAYOUT.CARD_MIN_HEIGHT,
        position: 'relative',
      }}
    >
      {/* Coming Soon Badge */}
      {!enabled && (
        <Chip
          label='Demnächst'
          size='small'
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'grey.300',
            color: 'grey.700',
          }}
        />
      )}

      {/* Icon */}
      <Box
        sx={{
          color: enabled ? 'primary.main' : 'grey.400',
          mb: 2,
        }}
      >
        {iconMap[icon] || <SettingsIcon sx={{ fontSize: 48 }} />}
      </Box>

      {/* Title */}
      <Typography
        variant='h6'
        component='h2'
        gutterBottom
        sx={{
          color: enabled ? 'text.primary' : 'text.disabled',
        }}
      >
        {titleDe}
      </Typography>

      {/* Description */}
      <Typography
        variant='body2'
        color={enabled ? 'text.secondary' : 'text.disabled'}
      >
        {descriptionDe}
      </Typography>
    </CardContent>
  );

  if (!enabled) {
    return (
      <Card
        data-testid={`dashboard-card-${id}`}
        aria-disabled='true'
        sx={{
          height: '100%',
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card
      data-testid={`dashboard-card-${id}`}
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea component={Link} href={route} sx={{ height: '100%' }}>
        {cardContent}
      </CardActionArea>
    </Card>
  );
}
