'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  capacity?: number;
  isPublished: boolean;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

interface User {
  id: string;
  name?: string;
  email?: string;
  _count: {
    bookings: number;
  };
}

export default function DatabaseAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/courses').then(res => res.json()),
      fetch('/api/admin/users').then(res => res.json()),
    ])
      .then(([coursesData, usersData]) => {
        setCourses(coursesData.courses || []);
        setUsers(usersData.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container>
        <Typography>Loading database data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Typography variant='h3' gutterBottom>
        📊 Database Admin Panel
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Courses
              </Typography>
              <Typography variant='h4'>{courses.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Published Courses
              </Typography>
              <Typography variant='h4'>
                {courses.filter(c => c.isPublished).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Users
              </Typography>
              <Typography variant='h4'>{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color='textSecondary' gutterBottom>
                Total Bookings
              </Typography>
              <Typography variant='h4'>
                {courses.reduce(
                  (sum, course) => sum + course._count.bookings,
                  0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Courses Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' gutterBottom>
          🎓 Courses Overview
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Bookings</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.slice(0, 10).map(course => (
                <TableRow key={course.id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>
                    <code>{course.slug}</code>
                  </TableCell>
                  <TableCell>
                    {course.price.toLocaleString('de-DE')} €
                  </TableCell>
                  <TableCell>{course.capacity || 'Unlimited'}</TableCell>
                  <TableCell>
                    <Chip
                      label={course.isPublished ? 'Published' : 'Draft'}
                      color={course.isPublished ? 'success' : 'default'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>{course._count.bookings}</TableCell>
                  <TableCell>
                    {new Date(course.createdAt).toLocaleDateString('de-DE')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {courses.length > 10 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='textSecondary'>
              Showing 10 of {courses.length} courses
            </Typography>
          </Box>
        )}
      </Box>

      {/* Users Table */}
      <Box>
        <Typography variant='h5' gutterBottom>
          👥 Users Overview
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Bookings</TableCell>
                <TableCell>ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.slice(0, 10).map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || 'No name'}</TableCell>
                  <TableCell>{user.email || 'No email'}</TableCell>
                  <TableCell>{user._count.bookings}</TableCell>
                  <TableCell>
                    <code>{user.id.slice(0, 8)}...</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {users.length > 10 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='textSecondary'>
              Showing 10 of {users.length} users
            </Typography>
          </Box>
        )}
      </Box>

      {/* External Links */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant='outlined'
          href='http://localhost:5555'
          target='_blank'
          rel='noopener noreferrer'
          sx={{ mr: 2 }}
        >
          🔗 Open Prisma Studio (Port 5555)
        </Button>
        <Button
          variant='outlined'
          href='/api/courses'
          target='_blank'
          rel='noopener noreferrer'
        >
          🔗 Courses API
        </Button>
      </Box>
    </Container>
  );
}
