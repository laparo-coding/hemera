/**
 * DashboardSection Component
 *
 * Reusable wrapper for dashboard sections with consistent styling
 * and German localization.
 */

'use client';

import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { TERMS } from '@/lib/constants/terminology';
import { colors, typography } from '@/lib/design-tokens';

// Section titles (German localization)
export const SECTION_TITLES = {
  NEXT_SEMINAR: `Nächstes ${TERMS.course}`,
  UPCOMING: `Weitere gebuchte ${TERMS.courses}`,
  COMPLETED: `Absolvierte ${TERMS.courses}`,
  NO_SHOW: `${TERMS.courses} ohne Teilnahme`,
} as const;

export type SectionType = keyof typeof SECTION_TITLES;

interface DashboardSectionProps {
  /** The section type for automatic title/description */
  sectionType?: SectionType;
  /** Custom title (overrides sectionType title) */
  title?: string;
  /** Custom description (overrides sectionType description) */
  description?: string;
  /** Section content */
  children: ReactNode;
  /** Whether the section is empty */
  isEmpty?: boolean;
  /** Whether to hide the section when empty (default: true) */
  hideWhenEmpty?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Test ID for E2E testing */
  testId?: string;
}

/**
 * Determines if a section should be visible
 */
export const shouldShowSection = (
  isEmpty: boolean,
  hideWhenEmpty: boolean = true
): boolean => {
  if (isEmpty && hideWhenEmpty) {
    return false;
  }
  return true;
};

export default function DashboardSection({
  sectionType,
  title,
  description,
  children,
  isEmpty = false,
  hideWhenEmpty = true,
  emptyMessage,
  testId,
}: DashboardSectionProps) {
  // Don't render if empty and should hide
  if (!shouldShowSection(isEmpty, hideWhenEmpty)) {
    return null;
  }

  // Determine title and description
  const sectionTitle =
    title || (sectionType ? SECTION_TITLES[sectionType] : TERMS.courses);
  const sectionDescription = description;

  return (
    <Paper
      elevation={0}
      data-testid={
        testId || `section-${sectionType?.toLowerCase() || 'custom'}`
      }
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 3,
        borderRadius: '16px',
        border: `1px solid ${colors.tealAlpha10}`,
        boxShadow: `0 4px 24px ${colors.tealAlpha8}`,
        bgcolor: colors.white,
      }}
    >
      {/* Section Header */}
      <Box sx={{ mb: isEmpty ? 0 : 3 }}>
        <Typography
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 600,
            color: colors.marsala,
            mb: sectionDescription ? 0.5 : 0,
          }}
        >
          {sectionTitle}
        </Typography>
        {sectionDescription && (
          <Typography
            sx={{
              fontFamily: typography.body,
              fontSize: '0.875rem',
              color: colors.lightBlack,
              opacity: 0.7,
            }}
          >
            {sectionDescription}
          </Typography>
        )}
      </Box>

      {/* Content or Empty State */}
      {isEmpty ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            sx={{
              fontFamily: typography.body,
              fontSize: '1rem',
              color: colors.lightBlack,
              opacity: 0.6,
            }}
          >
            {emptyMessage || `${TERMS.noCourses} in dieser Kategorie`}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Paper>
  );
}
