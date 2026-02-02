/**
 * CurriculumSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Tabular curriculum display with expandable day/module sections.
 */

'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import { TERMS } from '../../lib/constants/terminology';
import { colors, spacing, typography } from '../../lib/design-tokens';

// Shared styles for curriculum table cells
const timeRangeCellSx = {
  fontFamily: typography.body,
  fontWeight: 500,
  color: colors.gold,
  whiteSpace: 'nowrap',
  width: '140px',
  pl: 0,
} as const;

const titleCellSx = {
  fontFamily: typography.body,
  color: colors.petrol,
} as const;

export interface CurriculumTopic {
  id: string;
  timeRange: string;
  title: string;
}

export interface CurriculumModule {
  id: string;
  day: number;
  title: string;
  topics: CurriculumTopic[];
}

export interface CurriculumSectionProps {
  modules?: CurriculumModule[] | null;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  modules = [],
}) => {
  // Ensure modules is always an array (guard against undefined/null)
  const safeModules = Array.isArray(modules) ? modules : [];

  // First accordion expanded by default (hooks must be called unconditionally)
  // Safe access with guard - won't throw if array is empty
  const [expanded, setExpanded] = useState<string | false>(
    safeModules.length > 0 ? safeModules[0]!.id : false
  );

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  // No fallback data - if no curriculum from DB, show nothing
  if (safeModules.length === 0) {
    return null;
  }

  return (
    <Box
      component='section'
      data-testid='curriculum-section'
      aria-labelledby='curriculum-title'
      sx={{
        backgroundColor: colors.white,
        py: spacing.sectionPy,
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        {/* Section Title */}
        <Typography
          id='curriculum-title'
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: colors.petrol,
            mb: 4,
            textAlign: 'center',
          }}
        >
          {TERMS.courseProgress}
        </Typography>

        {/* Accordions - or direct display for single-day courses */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            maxWidth: '900px',
            mx: 'auto',
          }}
        >
          {safeModules.length === 1 && safeModules[0] ? (
            // Single-day course: show topics directly without accordion
            <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
              <Table size='small'>
                <TableBody>
                  {safeModules[0].topics.map(topic => (
                    <TableRow
                      key={topic.id}
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={timeRangeCellSx}>
                        {topic.timeRange || '–'}
                      </TableCell>
                      <TableCell sx={titleCellSx}>
                        {topic.title || 'Thema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            // Multi-day course: show accordions
            safeModules.map(module => (
              <Accordion
                key={module.id}
                expanded={expanded === module.id}
                onChange={handleChange(module.id)}
                disableGutters
                sx={{
                  '&:before': { display: 'none' },
                  borderBottom: `1px solid ${colors.lightGray}`,
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: colors.petrol }} />}
                  sx={{
                    backgroundColor:
                      expanded === module.id ? colors.cream : colors.white,
                    px: { xs: 2, md: 4 },
                    py: 1,
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      fontFamily: typography.heading,
                      fontWeight: 600,
                      color: colors.petrol,
                    }}
                  >
                    {module.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
                  <Table size='small'>
                    <TableBody>
                      {module.topics.map(topic => (
                        <TableRow
                          key={topic.id}
                          sx={{
                            '&:last-child td': { borderBottom: 0 },
                          }}
                        >
                          <TableCell sx={timeRangeCellSx}>
                            {topic.timeRange || '–'}
                          </TableCell>
                          <TableCell sx={titleCellSx}>
                            {topic.title || 'Thema'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default CurriculumSection;
