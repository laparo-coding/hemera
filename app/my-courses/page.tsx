import { requireAuthenticatedUser } from '@/lib/auth/helpers';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses - Hemera Academy',
  description: 'Browse and manage your courses',
};

// Mock course data for demonstration
const mockCourses = [
  {
    id: 1,
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
    progress: 0,
    enrolled: false,
    difficulty: 'Beginner',
  },
  {
    id: 2,
    title: 'React.js Fundamentals',
    description: 'Build modern web applications with React',
    progress: 0,
    enrolled: false,
    difficulty: 'Intermediate',
  },
  {
    id: 3,
    title: 'Full Stack Development',
    description:
      'Complete web application development from frontend to backend',
    progress: 0,
    enrolled: false,
    difficulty: 'Advanced',
  },
];

export default async function CoursesPage() {
  const _user = await requireAuthenticatedUser();

  return (
    <Box data-testid='courses-page'>
      <Typography variant='h4' component='h1' gutterBottom>
        Courses
      </Typography>

      <Typography variant='body1' color='text.secondary' paragraph>
        Explore our course catalog and start your learning journey.
      </Typography>

      <Grid container spacing={3}>
        {mockCourses.map(course => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant='h6' component='h2' gutterBottom>
                  {course.title}
                </Typography>

                <Typography variant='body2' color='text.secondary' paragraph>
                  {course.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={course.difficulty}
                    size='small'
                    color={
                      course.difficulty === 'Beginner'
                        ? 'success'
                        : course.difficulty === 'Intermediate'
                          ? 'warning'
                          : 'error'
                    }
                  />
                  {course.enrolled && (
                    <Chip label='Enrolled' size='small' color='primary' />
                  )}
                </Box>

                {course.enrolled && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Progress: {course.progress}%
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={course.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant={course.enrolled ? 'outlined' : 'contained'}
                  fullWidth
                  disabled
                >
                  {course.enrolled ? 'Continue Learning' : 'Enroll Now'}
                </Button>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  textAlign='center'
                  sx={{ mt: 1 }}
                >
                  Course enrollment coming soon
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {mockCourses.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant='h6' color='text.secondary' gutterBottom>
              No courses available yet
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Check back soon for new course offerings!
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
