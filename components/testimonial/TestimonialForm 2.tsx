'use client';

/**
 * TestimonialForm Component - Create/Edit testimonial with WYSIWYG preview
 * Feature: 017-testimonial-management
 */

import {
  FormatQuote as QuoteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  formatDisplayName,
  isFormatOptionAvailable,
  type NameDisplayFormat,
} from '@/lib/schemas/testimonial-schema';
import { getAvatarInitial } from '@/lib/utils/avatar';

interface UserProfile {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  city?: string | null;
}

interface TestimonialFormProps {
  bookingId: string;
  courseName: string;
  userProfile: UserProfile;
  initialData?: {
    id: string;
    statement: string;
    nameDisplayFormat: NameDisplayFormat;
    status: string;
  };
  onSuccess?: () => void;
}

const NAME_FORMAT_OPTIONS: {
  value: NameDisplayFormat;
  label: string;
  description: string;
}[] = [
  {
    value: 'FULL_NAME_CITY',
    label: 'Vollständiger Name mit Stadt',
    description: 'z.B. "Max Mustermann, Berlin"',
  },
  {
    value: 'FULL_NAME',
    label: 'Vollständiger Name',
    description: 'z.B. "Max Mustermann"',
  },
  {
    value: 'FIRST_INITIAL',
    label: 'Vorname + Initial',
    description: 'z.B. "Max M."',
  },
  {
    value: 'FIRST_NAME_ONLY',
    label: 'Nur Vorname',
    description: 'z.B. "Max"',
  },
];

const MAX_STATEMENT_LENGTH = 1000;

export default function TestimonialForm({
  bookingId,
  courseName,
  userProfile,
  initialData,
  onSuccess,
}: TestimonialFormProps) {
  const [statement, setStatement] = useState(initialData?.statement || '');
  const [nameFormat, setNameFormat] = useState<NameDisplayFormat>(
    initialData?.nameDisplayFormat || 'FULL_NAME'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasCity = Boolean(userProfile.city);
  const isEdit = Boolean(initialData);

  // Live preview of display name
  const previewDisplayName = useMemo(() => {
    return formatDisplayName(
      userProfile.firstName,
      userProfile.lastName,
      userProfile.city,
      nameFormat
    );
  }, [userProfile, nameFormat]);

  const characterCount = statement.length;
  const isOverLimit = characterCount > MAX_STATEMENT_LENGTH;
  const isTooShort = characterCount < 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/testimonials/${initialData?.id}`
        : '/api/testimonials';
      const method = isEdit ? 'PATCH' : 'POST';

      const body = isEdit
        ? { statement, nameDisplayFormat: nameFormat }
        : { bookingId, statement, nameDisplayFormat: nameFormat };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitForApproval() {
    if (!initialData?.id) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/testimonials/${initialData.id}/submit`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Einreichen');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Alert severity='success' sx={{ my: 2 }}>
        {isEdit
          ? 'Dein Erfahrungsbericht wurde aktualisiert!'
          : 'Dein Erfahrungsbericht wurde gespeichert und wartet auf Freigabe.'}
      </Alert>
    );
  }

  return (
    <Box component='form' onSubmit={handleSubmit}>
      <Typography variant='h6' gutterBottom>
        {isEdit
          ? 'Erfahrungsbericht bearbeiten'
          : 'Erfahrungsbericht schreiben'}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Teile deine Erfahrungen zum Kurs &ldquo;{courseName}&rdquo; mit anderen
        Interessenten.
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statement input */}
      <TextField
        label='Dein Erfahrungsbericht'
        multiline
        rows={5}
        fullWidth
        value={statement}
        onChange={e => setStatement(e.target.value)}
        placeholder='Was hat dir am Kurs besonders gut gefallen? Was hast du gelernt?'
        error={isOverLimit || (statement.length > 0 && isTooShort)}
        helperText={
          isOverLimit
            ? `Maximal ${MAX_STATEMENT_LENGTH} Zeichen erlaubt`
            : isTooShort && statement.length > 0
              ? 'Mindestens 10 Zeichen erforderlich'
              : `${characterCount} / ${MAX_STATEMENT_LENGTH} Zeichen`
        }
        sx={{ mb: 3 }}
      />

      {/* Name format selection */}
      <FormControl component='fieldset' sx={{ mb: 3 }}>
        <FormLabel component='legend'>
          Wie soll dein Name angezeigt werden?
        </FormLabel>
        <RadioGroup
          value={nameFormat}
          onChange={e => setNameFormat(e.target.value as NameDisplayFormat)}
        >
          {NAME_FORMAT_OPTIONS.map(option => {
            const isAvailable = isFormatOptionAvailable(option.value, hasCity);
            return (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant='body2'>{option.label}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.description}
                    </Typography>
                  </Box>
                }
                disabled={!isAvailable}
              />
            );
          })}
        </RadioGroup>
        {!hasCity && (
          <FormHelperText>
            Tipp: Ergänze deine Stadt im Profil, um alle Anzeigeoptionen zu
            nutzen.
          </FormHelperText>
        )}
      </FormControl>

      {/* Live Preview */}
      <Typography variant='subtitle2' gutterBottom>
        Vorschau
      </Typography>
      <Card variant='outlined' sx={{ mb: 3, bgcolor: 'grey.50' }}>
        <CardContent sx={{ pt: 4, position: 'relative' }}>
          <QuoteIcon
            sx={{
              position: 'absolute',
              top: 12,
              left: 16,
              fontSize: 32,
              color: 'primary.light',
              opacity: 0.5,
            }}
          />
          <Typography
            variant='body1'
            sx={{ fontStyle: 'italic', mb: 2, color: 'text.secondary' }}
          >
            &ldquo;{statement || 'Dein Erfahrungsbericht erscheint hier...'}
            &rdquo;
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={userProfile.imageUrl || undefined}
              alt={previewDisplayName}
              sx={{ width: 40, height: 40 }}
            >
              {getAvatarInitial(previewDisplayName)}
            </Avatar>
            <Typography variant='subtitle2' fontWeight='bold'>
              {previewDisplayName}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          type='submit'
          variant='contained'
          disabled={loading || isOverLimit || isTooShort}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {isEdit ? 'Änderungen speichern' : 'Als Entwurf speichern'}
        </Button>
        {isEdit && initialData?.status === 'DRAFT' && (
          <Button
            variant='outlined'
            color='primary'
            disabled={loading || isOverLimit || isTooShort}
            onClick={handleSubmitForApproval}
            startIcon={<SendIcon />}
          >
            Zur Freigabe einreichen
          </Button>
        )}
      </Box>

      {initialData?.status && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ mt: 2, display: 'block' }}
        >
          Status: {initialData.status === 'DRAFT' && 'Entwurf'}
          {initialData.status === 'PENDING' && 'Wartet auf Freigabe'}
          {initialData.status === 'PUBLISHED' && 'Veröffentlicht'}
          {initialData.status === 'HIDDEN' && 'Ausgeblendet'}
        </Typography>
      )}
    </Box>
  );
}
