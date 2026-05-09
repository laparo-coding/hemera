/**
 * CourseOverviewSection Component
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Course description, learning objectives, and instructor info.
 */

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import type React from 'react';
import { TERMS } from '../../lib/constants/terminology';
import { colors, spacing, typography } from '../../lib/design-tokens';
import { BookingCTA } from './BookingCTA';

export interface CourseOverviewSectionProps {
  description: string;
  learningObjectives?: string[];
  instructor: string;
  courseId: string;
  courseSlug: string;
}

export const CourseOverviewSection: React.FC<CourseOverviewSectionProps> = ({
  description,
  learningObjectives = [],
  instructor,
  courseId,
  courseSlug,
}) => {
  return (
    <Box
      component='section'
      data-testid='overview-section'
      aria-labelledby='overview-title'
      sx={{
        backgroundColor: colors.beige,
        py: spacing.sectionPy,
      }}
    >
      <Container maxWidth={spacing.containerMaxWidth}>
        {/* Section Title */}
        <Typography
          id='overview-title'
          variant='h2'
          component='h2'
          sx={{
            fontFamily: typography.heading,
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            color: colors.marsala,
            mb: 4,
            textAlign: 'center',
          }}
        >
          {TERMS.courseOverview}
        </Typography>

        {/* Description */}
        <Typography
          variant='body1'
          sx={{
            fontFamily: typography.body,
            fontSize: { xs: '1rem', md: '1.125rem' },
            lineHeight: 1.8,
            color: colors.lightBlack,
            mb: 5,
            maxWidth: '800px',
            mx: 'auto',
            textAlign: 'center',
          }}
        >
          {description}
        </Typography>

        {/* Learning Objectives */}
        {learningObjectives.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: colors.white,
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              mb: 5,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            <Typography
              variant='h3'
              component='h3'
              sx={{
                fontFamily: typography.heading,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: colors.marsala,
                mb: 3,
              }}
            >
              Das lernst du
            </Typography>
            <List>
              {learningObjectives.map((objective, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CheckCircleOutlineIcon sx={{ color: colors.bronze }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={objective}
                    primaryTypographyProps={{
                      fontFamily: typography.body,
                      color: colors.lightBlack,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Instructor */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 5,
          }}
        >
          <PersonIcon sx={{ color: colors.lightBlack, fontSize: 32 }} />
          <Box>
            <Typography
              variant='caption'
              sx={{
                fontFamily: typography.body,
                color: colors.lightBlack,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Seminarleiter
            </Typography>
            <Typography
              variant='h6'
              sx={{
                fontFamily: typography.body,
                fontWeight: 600,
                color: colors.marsala,
              }}
            >
              {instructor}
            </Typography>
          </Box>
        </Box>

        {/* Secondary CTA */}
        <Box sx={{ textAlign: 'center' }}>
          <BookingCTA
            courseId={courseId}
            courseSlug={courseSlug}
            variant='secondary'
            label={TERMS.bookCourse}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default CourseOverviewSection;
