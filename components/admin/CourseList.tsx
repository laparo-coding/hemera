/**
 * Course List Component
 *
 * Displays all courses in a table sorted by start time
 * with enrollment counts and admin actions.
 */

'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { TERMS } from '../../lib/constants';
import type { CourseWithEnrollmentCount } from '../../lib/types/admin';
import { getLevelLabel } from '../../lib/utils/course-level';
import { formatShortDate, formatTimeRange } from '../../lib/utils/date-format';
import PublishToggle from './PublishToggle';

interface CourseListProps {
  courses: CourseWithEnrollmentCount[];
  onDeleteClick?: (course: CourseWithEnrollmentCount) => void;
  onPublishToggle?: (courseId: string, publish: boolean) => Promise<void>;
}

export default function CourseList({
  courses,
  onDeleteClick,
  onPublishToggle,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant='h6' color='text.secondary'>
          {TERMS.noCoursesFound}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Erstelle dein erstes {TERMS.course}, um loszulegen
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Titel</TableCell>
            <TableCell>Dozent/in</TableCell>
            <TableCell>Niveau</TableCell>
            <TableCell>Startzeit</TableCell>
            <TableCell align='right'>Preis</TableCell>
            <TableCell align='center'>Teilnehmer</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Veröffentlichen</TableCell>
            <TableCell align='right'>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.map(course => (
            <TableRow key={course.id} hover>
              <TableCell>
                <Typography variant='body2' fontWeight='medium'>
                  {course.title}
                </Typography>
              </TableCell>
              <TableCell>{course.instructor}</TableCell>
              <TableCell>
                <Chip
                  label={getLevelLabel(course.level)}
                  size='small'
                  color={
                    course.level === 'BEGINNER'
                      ? 'success'
                      : course.level === 'INTERMEDIATE'
                        ? 'warning'
                        : 'error'
                  }
                />
              </TableCell>
              <TableCell>
                <Typography variant='body2'>
                  {formatShortDate(course.startDate) ?? 'TBD'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {formatTimeRange(course.startTime, course.endTime) ?? 'TBD'}
                </Typography>
              </TableCell>
              <TableCell align='right'>
                {(course.price / 100).toFixed(2)} €
              </TableCell>
              <TableCell align='center'>
                <Chip
                  label={`${course._count.bookings} / ${course.capacity}`}
                  size='small'
                  variant='outlined'
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={course.isPublished ? 'Veröffentlicht' : 'Entwurf'}
                  size='small'
                  color={course.isPublished ? 'success' : 'default'}
                  variant='outlined'
                />
              </TableCell>
              <TableCell>
                {onPublishToggle && (
                  <PublishToggle
                    courseId={course.id}
                    isPublished={course.isPublished}
                    onToggle={onPublishToggle}
                  />
                )}
              </TableCell>
              <TableCell align='right'>
                <Box
                  sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}
                >
                  <IconButton
                    size='small'
                    component={Link}
                    href={`/courses/${course.id}`}
                    title='Ansehen'
                    color='primary'
                  >
                    <VisibilityIcon fontSize='small' />
                  </IconButton>
                  <IconButton
                    size='small'
                    component={Link}
                    href={`/admin/courses/${course.id}/edit`}
                    title='Bearbeiten'
                    color='primary'
                  >
                    <EditIcon fontSize='small' />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => onDeleteClick?.(course)}
                    title='Löschen'
                    color='primary'
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
