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
  modules: CurriculumModule[];
}

// Placeholder curriculum data for MVP
const PLACEHOLDER_CURRICULUM: CurriculumModule[] = [
  {
    id: 'day-1',
    day: 1,
    title: 'Grundlagen der Verhandlung',
    topics: [
      {
        id: 't1',
        timeRange: '09:00 - 09:30',
        title: 'Stelle dich und deinen Plan vor',
      },
      {
        id: 't2',
        timeRange: '09:30 - 10:00',
        title: 'So gehst du ein Gespräch rein, so nicht',
      },
      { id: 't3', timeRange: '10:00 - 10:30', title: 'Videoanalyse 1' },
      { id: 't4', timeRange: '10:30 - 11:00', title: 'Videoanalyse 2' },
      { id: 't5', timeRange: '11:00 - 11:15', title: 'Pause' },
      { id: 't6', timeRange: '11:15 - 11:45', title: 'Videoanalyse 4' },
      { id: 't7', timeRange: '11:45 - 12:15', title: 'Videoanalyse 5' },
      { id: 't8', timeRange: '12:15 - 12:45', title: 'Videoanalyse 6' },
      { id: 't9', timeRange: '12:45 - 13:30', title: 'Mittagspause' },
      {
        id: 't10',
        timeRange: '13:30 - 14:00',
        title: 'Verhandele dein Ergebnis, nicht deine Gefühle',
      },
      { id: 't11', timeRange: '14:30 - 15:00', title: 'Gehaltsgespräch 1' },
      { id: 't12', timeRange: '15:00 - 15:30', title: 'Gehaltsgespräch 2' },
      { id: 't13', timeRange: '15:30 - 16:00', title: 'Gehaltsgespräch 3' },
      { id: 't14', timeRange: '16:00 - 16:15', title: 'Pause' },
      { id: 't15', timeRange: '16:15 - 16:45', title: 'Gehaltsgespräch 4' },
      { id: 't16', timeRange: '16:45 - 17:15', title: 'Gehaltsgespräch 5' },
      { id: 't17', timeRange: '17:15 - 17:45', title: 'Gehaltsgespräch 6' },
      {
        id: 't18',
        timeRange: '17:45 - 18:15',
        title: 'Bereite dich vor. Ab jetzt zählt es',
      },
    ],
  },
];

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  modules,
}) => {
  // Use placeholder if no modules provided
  const displayModules = modules.length > 0 ? modules : PLACEHOLDER_CURRICULUM;

  // First accordion expanded by default
  const [expanded, setExpanded] = useState<string | false>(
    displayModules[0]?.id || false
  );

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  // Empty state
  if (displayModules.length === 0) {
    return (
      <Box
        component='section'
        data-testid='curriculum-section'
        sx={{
          backgroundColor: colors.white,
          py: spacing.sectionPy,
        }}
      >
        <Container maxWidth={spacing.containerMaxWidth}>
          <Typography
            variant='body1'
            sx={{ textAlign: 'center', color: colors.petrol }}
          >
            Kein Curriculum verfügbar
          </Typography>
        </Container>
      </Box>
    );
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

        {/* Accordions */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            maxWidth: '900px',
            mx: 'auto',
          }}
        >
          {displayModules.map(module => (
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
                        <TableCell
                          sx={{
                            fontFamily: typography.body,
                            fontWeight: 500,
                            color: colors.gold,
                            whiteSpace: 'nowrap',
                            width: '140px',
                            pl: 0,
                          }}
                        >
                          {topic.timeRange}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: typography.body,
                            color: colors.petrol,
                          }}
                        >
                          {topic.title}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Container>
    </Box>
  );
};

export default CurriculumSection;
