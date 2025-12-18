/**
 * Admin Courses Index Page
 *
 * Main admin dashboard showing all courses
 * with actions to create, edit, and delete.
 */

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Paper, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import CourseListWithDelete from '../../../components/admin/CourseListWithDelete';
import { listCourses } from '../../../lib/db/admin/courses';

export const metadata: Metadata = {
  title: 'Kursverwaltung - Admin',
  description: 'Verwalte alle Kurse im System',
};

export default async function AdminCoursesPage() {
  const courses = await listCourses();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' component='h1'>
          Kursverwaltung
        </Typography>
        <Link href='/admin/courses/new' style={{ textDecoration: 'none' }}>
          <Button variant='contained' color='primary' startIcon={<AddIcon />}>
            Neuen Kurs erstellen
          </Button>
        </Link>
      </Box>

      <Paper elevation={2}>
        <CourseListWithDelete courses={courses} />
      </Paper>
    </Box>
  );
}
