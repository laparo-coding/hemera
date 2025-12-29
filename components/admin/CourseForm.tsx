/**
 * Course Form Component
 *
 * Reusable form for creating and editing courses
 * with Zod validation and React Hook Form.
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { courseCreateSchema } from '../../lib/schemas/admin/course';
import type { CourseImageUrls } from './FileUpload';
import FileUpload from './FileUpload';

// Use input type for form (before transformation)
type FormData = z.input<typeof courseCreateSchema>;

interface LocationOption {
  id: string;
  name: string;
  city: string;
}

interface CourseFormProps {
  initialData?: Partial<FormData>;
  locations?: LocationOption[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function CourseForm({
  initialData,
  locations = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Course',
  isLoading = false,
}: CourseFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price ? initialData.price / 100 : 0, // Convert Cents to Euro for display
      startDate: initialData?.startDate || new Date(),
      startTime: initialData?.startTime || new Date(),
      endTime:
        initialData?.endTime || new Date(Date.now() + 4 * 60 * 60 * 1000),
      instructor: initialData?.instructor || '',
      level: initialData?.level || 'BEGINNER',
      thumbnailUrl: initialData?.thumbnailUrl || null,
      imageDetail: initialData?.imageDetail || null,
      imageTwitter: initialData?.imageTwitter || null,
      capacity: initialData?.capacity || 20,
      isPublished: initialData?.isPublished ?? false,
      locationId: initialData?.locationId || null,
    },
  });

  const thumbnailUrl = watch('thumbnailUrl');

  const handleImageUpload = (urls: CourseImageUrls) => {
    setValue('thumbnailUrl', urls.thumbnail);
    setValue('imageDetail', urls.detail);
    setValue('imageTwitter', urls.twitter);
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Controller
        name='title'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label='Kurstitel'
            required
            error={!!errors.title}
            helperText={errors.title?.message}
            fullWidth
            disabled={isLoading || isSubmitting}
          />
        )}
      />

      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label='Beschreibung'
            required
            multiline
            rows={4}
            error={!!errors.description}
            helperText={errors.description?.message}
            fullWidth
            disabled={isLoading || isSubmitting}
          />
        )}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Controller
          name='price'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type='number'
              label='Preis (€)'
              required
              error={!!errors.price}
              helperText={errors.price?.message}
              inputProps={{ min: 0, step: 0.01 }}
              disabled={isLoading || isSubmitting}
              value={field.value === 0 ? '' : field.value}
              onChange={e => {
                const val = e.target.value;
                field.onChange(val === '' ? 0 : parseFloat(val));
              }}
            />
          )}
        />

        <Controller
          name='capacity'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type='number'
              label='Kapazität'
              required
              error={!!errors.capacity}
              helperText={errors.capacity?.message}
              inputProps={{ min: 1 }}
              disabled={isLoading || isSubmitting}
              value={field.value === 0 ? '' : field.value}
              onChange={e => {
                const val = e.target.value;
                field.onChange(val === '' ? 0 : parseInt(val, 10));
              }}
            />
          )}
        />
      </Box>

      <Controller
        name='startDate'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type='date'
            label='Startdatum'
            required
            error={!!errors.startDate}
            helperText={errors.startDate?.message}
            InputLabelProps={{ shrink: true }}
            disabled={isLoading || isSubmitting}
            value={
              field.value instanceof Date
                ? field.value.toISOString().split('T')[0]
                : field.value || ''
            }
            onChange={e => {
              const dateStr = e.target.value;
              if (dateStr) {
                // Parse as local date (not UTC)
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                field.onChange(date);
              }
            }}
          />
        )}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Controller
          name='startTime'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type='time'
              label='Startzeit'
              required
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading || isSubmitting}
              value={
                field.value instanceof Date
                  ? `${String(field.value.getHours()).padStart(2, '0')}:${String(field.value.getMinutes()).padStart(2, '0')}`
                  : field.value || ''
              }
              onChange={e => {
                const [hours, minutes] = e.target.value.split(':');
                const date = new Date();
                date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                field.onChange(date);
              }}
            />
          )}
        />

        <Controller
          name='endTime'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type='time'
              label='Endzeit'
              required
              error={!!errors.endTime}
              helperText={errors.endTime?.message}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading || isSubmitting}
              value={
                field.value instanceof Date
                  ? `${String(field.value.getHours()).padStart(2, '0')}:${String(field.value.getMinutes()).padStart(2, '0')}`
                  : field.value || ''
              }
              onChange={e => {
                const [hours, minutes] = e.target.value.split(':');
                const date = new Date();
                date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                field.onChange(date);
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Controller
          name='instructor'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label='Dozent/in'
              required
              error={!!errors.instructor}
              helperText={errors.instructor?.message}
              disabled={isLoading || isSubmitting}
            />
          )}
        />

        <Controller
          name='level'
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label='Niveau'
              required
              error={!!errors.level}
              helperText={errors.level?.message}
              disabled={isLoading || isSubmitting}
            >
              <MenuItem value='BEGINNER'>Basis</MenuItem>
              <MenuItem value='INTERMEDIATE'>Fortgeschrittene</MenuItem>
              <MenuItem value='ADVANCED'>Masterclass</MenuItem>
            </TextField>
          )}
        />
      </Box>

      <Controller
        name='locationId'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label='Veranstaltungsort'
            error={!!errors.locationId}
            helperText={
              errors.locationId?.message || 'Optional - Ort des Kurses'
            }
            disabled={isLoading || isSubmitting}
            value={field.value || ''}
            onChange={e => field.onChange(e.target.value || null)}
          >
            <MenuItem value=''>
              <em>Kein Ort ausgewählt</em>
            </MenuItem>
            {locations.map(location => (
              <MenuItem key={location.id} value={location.id}>
                {location.name} – {location.city}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <Box>
        <Typography variant='subtitle2' gutterBottom>
          Kurs-Vorschaubild
        </Typography>
        <FileUpload
          currentUrl={thumbnailUrl}
          onUploadComplete={handleImageUpload}
          disabled={isLoading || isSubmitting}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
        }}
      >
        <Controller
          name='isPublished'
          control={control}
          render={({ field }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type='checkbox'
                id='isPublished'
                checked={field.value}
                onChange={e => field.onChange(e.target.checked)}
                disabled={isLoading || isSubmitting}
              />
              <label htmlFor='isPublished' style={{ cursor: 'pointer' }}>
                <Typography variant='body2' color='text.secondary'>
                  Sofort veröffentlichen
                </Typography>
              </label>
            </Box>
          )}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          {onCancel && (
            <Button
              variant='outlined'
              color='primary'
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Abbrechen
            </Button>
          )}
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={isLoading || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Wird gespeichert...' : submitLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
