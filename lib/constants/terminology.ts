/**
 * Terminology Constants
 *
 * Centralized terminology for consistent branding.
 * Use these constants instead of hardcoding terms in components.
 * Simplifies future rebranding and i18n.
 */

export const TERMS = {
  // Singular forms
  course: 'Seminar',
  Course: 'Seminar',
  COURSE: 'SEMINAR',

  // Plural forms
  courses: 'Seminare',
  Courses: 'Seminare',
  COURSES: 'SEMINARE',

  // Dative/Genitive forms (German)
  coursesDative: 'Seminaren', // "in Seminaren"
  courseDative: 'Seminar', // "im Seminar"

  // Compound terms
  courseDetail: 'Seminardetails',
  courseOverview: 'Seminarübersicht',
  courseBooking: 'Seminarbuchung',
  courseFee: 'Seminargebühr',
  courseDate: 'Seminardatum',
  courseVideo: 'Seminarvideo',
  courseProgress: 'Seminarablauf',
  courseLocation: 'Seminarstandort',
  courseLocations: 'Seminarstandorte',
  courseManagement: 'Seminarverwaltung',
  courseTitle: 'Seminartitel',
  courseDescription: 'Seminarbeschreibung',
  coursePreview: 'Seminar-Vorschaubild',

  // UI Labels
  myCourses: 'Meine Seminare',
  allCourses: 'Alle Seminare',
  bookedCourses: 'Gebuchte Seminare',
  completedCourses: 'Abgeschlossene Seminare',
  discoverCourses: 'Seminare entdecken',
  bookCourse: 'Seminar buchen',
  newCourse: 'Neues Seminar',
  editCourse: 'Seminar bearbeiten',
  deleteCourse: 'Seminar löschen',

  // Messages
  noCourses: 'Keine Seminare',
  noCoursesFound: 'Keine Seminare gefunden',
  courseNotFound: 'Seminar nicht gefunden',
  noCourseSelected: 'Kein Seminar ausgewählt',
  courseBooked: 'Seminar erfolgreich gebucht',
  courseAlreadyBooked: 'Du hast dieses Seminar bereits gebucht.',
  courseSoldOut: 'Dieses Seminar ist aktuell ausgebucht.',
  courseNotPublished: 'Dieses Seminar ist noch nicht veröffentlicht.',
  courseDatePast: 'Der Seminartermin liegt in der Vergangenheit.',

  // Instructor/Participant terms
  courseParticipant: 'Seminarteilnehmer',
  courseParticipants: 'Seminarteilnehmer',

  // Form Labels
  descriptionLabel: 'Beschreibung',
  teaserLabel: 'Kurzbeschreibung',
  recommendedLabel: 'Passende Voraussetzungen',
  notRecommendedLabel: 'Nicht passende Voraussetzungen',
  priceLabel: 'Preis (€)',
  capacityLabel: 'Kapazität',
  startDateLabel: 'Startdatum',
  endDateLabel: 'Enddatum',
  startTimeLabel: 'Startzeit',
  endTimeLabel: 'Endzeit',
  instructorLabel: 'Dozent/in',
  levelLabel: 'Niveau',
  locationLabel: 'Veranstaltungsort',
  visibilityLabel: 'Sichtbarkeit',

  // Level Options
  levelBeginner: 'Basis',
  levelIntermediate: 'Fortgeschrittene',
  levelAdvanced: 'Masterclass',

  // Placeholders & Helper Text
  recommendedPlaceholder: 'z.B. Grundkurs Laparoskopie abgeschlossen',
  notRecommendedPlaceholder: 'z.B. Keine laparoskopischen Vorkenntnisse',
  noLocationSelected: 'Kein Ort ausgewählt',
  locationHelperText: 'Optional - Ort des Seminars',

  // Visibility Labels
  isNonPublicLabel:
    'Nicht-öffentliches Seminar (wird nicht in der Seminarliste angezeigt)',
  isPublishedLabel: 'Sofort veröffentlichen (Seminar ist buchbar)',

  // Buttons & Actions
  cancelButton: 'Abbrechen',
  savingMessage: 'Wird gespeichert...',
} as const;

/**
 * Helper function to get course count label
 * @param count Number of courses
 * @returns Formatted label like "1 Seminar" or "3 Seminare"
 */
export function getCourseCountLabel(count: number): string {
  return count === 1 ? `1 ${TERMS.course}` : `${count} ${TERMS.courses}`;
}

/**
 * Helper function to get pluralized course term without count
 * @param count Number to determine singular/plural
 * @returns 'Seminar' or 'Seminare'
 */
export function getCourseTerm(count: number): string {
  return count === 1 ? TERMS.course : TERMS.courses;
}

/**
 * Helper function for dative pluralization
 * @param count Number to determine singular/plural
 * @returns 'Seminar' or 'Seminaren'
 */
export function getCourseTermDative(count: number): string {
  return count === 1 ? TERMS.courseDative : TERMS.coursesDative;
}

/**
 * Type for accessing TERMS keys
 */
export type TermKey = keyof typeof TERMS;
