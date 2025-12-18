/**
 * Course Card Component
 *
 * Individual course display card for grid layouts
 * with thumbnail, details, and action buttons.
 */

'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import type { CourseWithEnrollmentCount } from '../../lib/types/admin';

interface CourseCardProps {
  course: CourseWithEnrollmentCount;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
}

export default function CourseCard({
  course,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const enrollmentPercentage = (course._count.bookings / course.capacity) * 100;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardMedia
        component='img'
        height='200'
        image={course.thumbnailUrl || '/placeholder-course.jpg'}
        alt={course.title}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip
            label={course.level}
            size='small'
            color={
              course.level === 'BEGINNER'
                ? 'success'
                : course.level === 'INTERMEDIATE'
                  ? 'warning'
                  : 'error'
            }
          />
          <Chip
            label={course.isPublished ? 'Published' : 'Draft'}
            size='small'
            variant='outlined'
            color={course.isPublished ? 'success' : 'default'}
          />
        </Box>

        <Typography variant='h6' component='h3' gutterBottom>
          {course.title}
        </Typography>

        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {course.description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant='body2'>
            <strong>Instructor:</strong> {course.instructor}
          </Typography>

          <Typography variant='body2'>
            <strong>Start:</strong>{' '}
            {course.startDate
              ? `${format(new Date(course.startDate), 'MMM d, yyyy')} ${
                  course.startTime
                    ? format(new Date(course.startTime), 'HH:mm')
                    : ''
                }`
              : 'TBD'}
          </Typography>

          <Typography variant='body2'>
            <strong>End:</strong>{' '}
            {course.endTime ? format(new Date(course.endTime), 'HH:mm') : 'TBD'}
          </Typography>

          <Typography variant='body2'>
            <strong>Price:</strong> €{course.price.toString()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon fontSize='small' color='action' />
            <Typography variant='body2'>
              {course._count.bookings} / {course.capacity} enrolled
            </Typography>
            <Chip
              label={`${Math.round(enrollmentPercentage)}%`}
              size='small'
              variant='outlined'
              color={enrollmentPercentage >= 80 ? 'error' : 'default'}
            />
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
        {onEdit && (
          <Button
            size='small'
            startIcon={<EditIcon />}
            onClick={() => onEdit(course.id)}
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            size='small'
            color='error'
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(course.id)}
          >
            Delete
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
