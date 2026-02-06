/**
 * Course List Component
 * Feature: 024-admin-dashboard (PublishSwitch integration)
 *
 * Displays all courses in a table sorted by start time
 * with enrollment counts and admin actions.
 * Uses PublishSwitch for publishing/unpublishing courses.
 * Includes search and pagination for better UX.
 */

'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { TERMS } from '../../lib/constants';
import type { CourseWithEnrollmentCount } from '../../lib/types/admin';
import { getLevelLabel } from '../../lib/utils/course-level';
import { formatShortDate, formatTimeRange } from '../../lib/utils/date-format';
import { normalizeForSearch } from '../../lib/utils/searchNormalization';
import { PublishSwitch } from './PublishSwitch';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter courses based on search
  const filteredCourses = courses.filter(course => {
    const searchLower = normalizeForSearch(searchQuery);
    return (
      normalizeForSearch(course.title).includes(searchLower) ||
      normalizeForSearch(course.instructor).includes(searchLower)
    );
  });

  // Paginate
  const paginatedCourses = filteredCourses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
    <Paper
      sx={{ width: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}
    >
      {/* Search and Actions Bar */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          fullWidth
          size='small'
          placeholder='Suchen nach Titel oder Dozent/in...'
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 280, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon color='action' />
              </InputAdornment>
            ),
          }}
        />
        <Link href='/admin/courses/new' style={{ textDecoration: 'none' }}>
          <Button variant='contained' startIcon={<AddIcon />}>
            Neues Seminar
          </Button>
        </Link>
      </Box>

      <TableContainer>
        <Table stickyHeader aria-label='Kurse Tabelle'>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: 'background.paper',
                '& th': { backgroundColor: 'background.paper' },
              }}
            >
              <TableCell>Titel</TableCell>
              <TableCell>Dozent/in</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell align='right'>Preis</TableCell>
              <TableCell align='center'>Teilnehmer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <Typography color='text.secondary' sx={{ py: 4 }}>
                    {searchQuery
                      ? 'Keine Kurse gefunden'
                      : 'Noch keine Kurse vorhanden'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCourses.map(course => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      {course.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{course.instructor || '—'}</TableCell>
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
                      {formatTimeRange(course.startTime, course.endTime) ??
                        'TBD'}
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
                    {onPublishToggle && (
                      <PublishSwitch
                        courseId={course.id}
                        isPublished={course.isPublished}
                        courseTitle={course.title}
                        onToggle={onPublishToggle}
                      />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Tooltip title='Ansehen'>
                        <IconButton
                          size='small'
                          component={Link}
                          href={`/courses/${course.id}`}
                          aria-label={`${course.title} ansehen`}
                        >
                          <VisibilityIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Bearbeiten'>
                        <IconButton
                          size='small'
                          component={Link}
                          href={`/admin/courses/${course.id}/edit`}
                          aria-label={`${course.title} bearbeiten`}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Löschen'>
                        <IconButton
                          size='small'
                          onClick={() => onDeleteClick?.(course)}
                          aria-label={`${course.title} löschen`}
                          color='error'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={filteredCourses.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage='Zeilen pro Seite:'
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} von ${count !== -1 ? count : `mehr als ${to}`}`
        }
      />
    </Paper>
  );
}
