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
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { TERMS } from '../../lib/constants/terminology';
import type { CurriculumModule } from '../../lib/schemas/admin/course';
import { courseCreateSchema } from '../../lib/schemas/admin/course';
import CurriculumEditor from './CurriculumEditor';
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
      teaser: initialData?.teaser || '',
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
      curriculum:
        (initialData?.curriculum as CurriculumModule[] | null) || null,
      // Learning Path fields (021)
      recommended: initialData?.recommended || null,
      notRecommended: initialData?.notRecommended || null,
      isNonPublic: initialData?.isNonPublic ?? false,
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
            label={TERMS.courseTitle}
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

      <Controller
        name='teaser'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value || ''}
            label='Teaser (Kurzbeschreibung für Übersichten)'
            multiline
            rows={2}
            error={!!errors.teaser}
            helperText={
              errors.teaser?.message ||
              `${(field.value || '').trim().length}/300 Zeichen`
            }
            fullWidth
            disabled={isLoading || isSubmitting}
            inputProps={{ maxLength: 300 }}
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
                // Parse as local date (not UTC) with validation
                const parts = dateStr.split('-').map(Number);
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];

                // Validate parsed values are valid numbers
                if (
                  year !== undefined &&
                  !Number.isNaN(year) &&
                  year > 0 &&
                  month !== undefined &&
                  !Number.isNaN(month) &&
                  month >= 1 &&
                  month <= 12 &&
                  day !== undefined &&
                  !Number.isNaN(day) &&
                  day >= 1 &&
                  day <= 31
                ) {
                  const date = new Date(year, month - 1, day);
                  // Verify the date is valid (not Invalid Date)
                  if (!Number.isNaN(date.getTime())) {
                    field.onChange(date);
                  } else {
                    field.onChange(null);
                  }
                } else {
                  field.onChange(null);
                }
              } else {
                field.onChange(null);
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
                const timeStr = e.target.value;
                if (timeStr) {
                  const parts = timeStr.split(':');
                  const hoursStr = parts[0];
                  const minutesStr = parts[1];
                  const hours = hoursStr ? parseInt(hoursStr, 10) : NaN;
                  const minutes = minutesStr ? parseInt(minutesStr, 10) : NaN;

                  // Validate parsed values are valid numbers in range
                  if (
                    !Number.isNaN(hours) &&
                    hours >= 0 &&
                    hours <= 23 &&
                    !Number.isNaN(minutes) &&
                    minutes >= 0 &&
                    minutes <= 59
                  ) {
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    field.onChange(date);
                  } else {
                    field.onChange(null);
                  }
                } else {
                  field.onChange(null);
                }
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
                const timeStr = e.target.value;
                if (timeStr) {
                  const parts = timeStr.split(':');
                  const hoursStr = parts[0];
                  const minutesStr = parts[1];
                  const hours = hoursStr ? parseInt(hoursStr, 10) : NaN;
                  const minutes = minutesStr ? parseInt(minutesStr, 10) : NaN;

                  // Validate parsed values are valid numbers in range
                  if (
                    !Number.isNaN(hours) &&
                    hours >= 0 &&
                    hours <= 23 &&
                    !Number.isNaN(minutes) &&
                    minutes >= 0 &&
                    minutes <= 59
                  ) {
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    field.onChange(date);
                  } else {
                    field.onChange(null);
                  }
                } else {
                  field.onChange(null);
                }
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

      {/* Learning Path fields (021) */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant='subtitle2' gutterBottom sx={{ mb: 2 }}>
          Lernpfad-Empfehlungen
        </Typography>

        <Controller
          name='recommended'
          control={control}
          render={({ field }) => {
            const currentLength = (field.value || '').trim().length;
            const maxLength = 300;
            const isNearLimit = currentLength > maxLength * 0.9;
            const isOverLimit = currentLength > maxLength;

            return (
              <TextField
                {...field}
                value={field.value || ''}
                label='Passende Voraussetzungen'
                placeholder='z.B. Grundkurs Laparoskopie abgeschlossen'
                multiline
                rows={2}
                error={!!errors.recommended}
                helperText={
                  errors.recommended?.message ||
                  `Zeichen: ${currentLength}/${maxLength}${isNearLimit ? ' ⚠️ Limit fast erreicht' : ''} • Erscheint als "Das sind passende Voraussetzungen für das Seminar"`
                }
                fullWidth
                disabled={isLoading || isSubmitting}
                inputProps={{ maxLength }}
                sx={{ mb: 2 }}
                onChange={e => field.onChange(e.target.value || null)}
                FormHelperTextProps={{
                  sx: {
                    color: isOverLimit
                      ? 'error.main'
                      : isNearLimit
                        ? 'warning.main'
                        : 'text.secondary',
                  },
                }}
              />
            );
          }}
        />

        <Controller
          name='notRecommended'
          control={control}
          render={({ field }) => {
            const currentLength = (field.value || '').trim().length;
            const maxLength = 300;
            const isNearLimit = currentLength > maxLength * 0.9;
            const isOverLimit = currentLength > maxLength;

            return (
              <TextField
                {...field}
                value={field.value || ''}
                label='Nicht passende Voraussetzungen'
                placeholder='z.B. Keine laparoskopischen Vorkenntnisse'
                multiline
                rows={2}
                error={!!errors.notRecommended}
                helperText={
                  errors.notRecommended?.message ||
                  `Zeichen: ${currentLength}/${maxLength}${isNearLimit ? ' ⚠️ Limit fast erreicht' : ''} • Erscheint als "Das sind keine passenden Voraussetzungen für das Seminar"`
                }
                fullWidth
                disabled={isLoading || isSubmitting}
                inputProps={{ maxLength }}
                sx={{ mb: 2 }}
                onChange={e => field.onChange(e.target.value || null)}
                FormHelperTextProps={{
                  sx: {
                    color: isOverLimit
                      ? 'error.main'
                      : isNearLimit
                        ? 'warning.main'
                        : 'text.secondary',
                  },
                }}
              />
            );
          }}
        />

        <Controller
          name='isNonPublic'
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                  disabled={isLoading || isSubmitting}
                />
              }
              label={
                <Typography variant='body2' color='text.secondary'>
                  Nicht-öffentlicher Kurs (wird nicht in der Kursliste
                  angezeigt)
                </Typography>
              }
            />
          )}
        />
      </Box>

      <Controller
        name='curriculum'
        control={control}
        render={({ field }) => (
          <CurriculumEditor
            value={field.value as CurriculumModule[] | null | undefined}
            onChange={field.onChange}
            disabled={isLoading || isSubmitting}
          />
        )}
      />

      <Box>
        <Typography variant='subtitle2' gutterBottom>
          {TERMS.coursePreview}
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                  disabled={isLoading || isSubmitting}
                />
              }
              label={
                <Typography variant='body2' color='text.secondary'>
                  Sofort veröffentlichen
                </Typography>
              }
            />
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
