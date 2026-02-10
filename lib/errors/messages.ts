/**
 * Error Message Translation Layer
 *
 * Maps machine-stable errorCode values to user-facing, localized messages.
 * The errorCode remains constant for monitoring/logging; the message is for display.
 *
 * Convention: All keys correspond to the `errorCode` property on the error classes
 * in domain.ts and base.ts.
 */

const ERROR_MESSAGES = {
  // Course errors
  COURSE_NOT_FOUND: 'Der Kurs wurde nicht gefunden.',
  COURSE_NOT_PUBLISHED: 'Dieser Kurs ist derzeit nicht verfügbar.',
  COURSE_SLUG_EXISTS: 'Ein Kurs mit diesem URL-Kürzel existiert bereits.',
  CURRICULUM_VALIDATION_ERROR:
    'Die Kursstruktur ist ungültig. Es wird ein Array von Einträgen erwartet.',

  // Booking errors
  BOOKING_NOT_FOUND: 'Die Buchung wurde nicht gefunden.',
  BOOKING_ALREADY_EXISTS: 'Du hast diesen Kurs bereits gebucht.',
  INVALID_BOOKING_STATUS: 'Der Buchungsstatus kann nicht geändert werden.',

  // User errors
  USER_NOT_FOUND: 'Der Benutzer wurde nicht gefunden.',
  USER_EMAIL_EXISTS:
    'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
  USER_VALIDATION_ERROR: 'Die Benutzerdaten sind ungültig.',

  // Payment errors
  PAYMENT_PROCESSING_FAILED: 'Die Zahlungsabwicklung ist fehlgeschlagen.',
  STRIPE_CONFIG_ERROR: 'Die Zahlungskonfiguration ist unvollständig.',

  // Auth errors
  UNAUTHORIZED: 'Du hast keinen Zugriff auf diese Ressource.',
  SESSION_EXPIRED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',

  // Database / Infrastructure errors
  DATABASE_CONNECTION_FAILED:
    'Ein Datenbankfehler ist aufgetreten. Bitte versuche es später erneut.',
  DATABASE_CONSTRAINT_VIOLATION: 'Ein Datenkonsistenz-Fehler ist aufgetreten.',
  DATABASE_VALIDATION_FAILED: 'Die Datenbankvalidierung ist fehlgeschlagen.',
  FIELD_VALIDATION_ERROR: 'Ein Feld enthält einen ungültigen Wert.',
  UNEXPECTED_DATABASE_ERROR:
    'Ein unerwarteter Datenbankfehler ist aufgetreten.',

  // Generic fallback
  INTERNAL_ERROR:
    'Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.',
} as const;

/**
 * Union type of all known error message keys.
 * Use this to ensure type-safe access to error messages.
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Returns the localized, user-facing message for a given errorCode.
 * Falls back to INTERNAL_ERROR if the key is unknown.
 */
export function errorMessage(key: string): string {
  if (Object.hasOwn(ERROR_MESSAGES, key)) {
    return ERROR_MESSAGES[key as ErrorMessageKey];
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}
