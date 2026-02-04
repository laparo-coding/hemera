/**
 * Admin Layout Constants
 * Feature: 024-admin-dashboard
 *
 * Centralized constants for admin dashboard layout consistency.
 */

/**
 * Layout dimensions and spacing for admin pages
 */
export const ADMIN_LAYOUT = {
  /** Max width for admin content area in pixels */
  MAX_WIDTH: 1280,

  /** MUI Container maxWidth prop value */
  CONTAINER_MAX_WIDTH: 'lg' as const,

  /** Head space for all admin subpages (MUI spacing units) */
  HEAD_SPACE: {
    paddingTop: 4, // 32px
    paddingBottom: 3, // 24px
    marginBottom: 4, // 32px
  },

  /** Dashboard grid spacing (MUI spacing units) */
  GRID_SPACING: 3,

  /** Dashboard card min height in pixels */
  CARD_MIN_HEIGHT: 160,

  /** Table row height in pixels */
  TABLE_ROW_HEIGHT: 52,
} as const;

/**
 * Admin route paths
 */
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  COURSES: '/admin/courses',
  LOCATIONS: '/admin/locations',
  TESTIMONIALS: '/admin/testimonials',
  SETTINGS: '/admin/settings',
  REPORTS: '/admin/reports',
  COURSE_MATERIAL: '/admin/course-material',
} as const;

/**
 * Dashboard card configuration
 */
export const DASHBOARD_CARDS = [
  {
    id: 'users',
    titleDe: 'Benutzerverwaltung',
    descriptionDe: 'Benutzerkonten und Rollen verwalten',
    route: ADMIN_ROUTES.USERS,
    icon: 'People',
    enabled: true,
  },
  {
    id: 'courses',
    titleDe: 'Kursverwaltung',
    descriptionDe: 'Kurse erstellen und bearbeiten',
    route: ADMIN_ROUTES.COURSES,
    icon: 'School',
    enabled: true,
  },
  {
    id: 'locations',
    titleDe: 'Standortverwaltung',
    descriptionDe: 'Kursstandorte verwalten',
    route: ADMIN_ROUTES.LOCATIONS,
    icon: 'LocationOn',
    enabled: true,
  },
  {
    id: 'testimonials',
    titleDe: 'Testimonial-Verwaltung',
    descriptionDe: 'Erfahrungsberichte prüfen und freigeben',
    route: ADMIN_ROUTES.TESTIMONIALS,
    icon: 'FormatQuote',
    enabled: true,
  },
  {
    id: 'settings',
    titleDe: 'Systemeinstellungen',
    descriptionDe: 'Plattform-Einstellungen konfigurieren',
    route: ADMIN_ROUTES.SETTINGS,
    icon: 'Settings',
    enabled: false, // Coming soon
  },
  {
    id: 'reports',
    titleDe: 'Berichte & Analysen',
    descriptionDe: 'Statistiken und Systemstatus einsehen',
    route: ADMIN_ROUTES.REPORTS,
    icon: 'Analytics',
    enabled: true,
  },
] as const;

/**
 * German translations for admin UI
 */
export const ADMIN_LABELS = {
  // Navigation
  adminDashboard: 'Admin Dashboard',
  backToDashboard: 'Zurück zum Dashboard',

  // Page titles
  users: 'Benutzerverwaltung',
  reports: 'Berichte & Analysen',
  courses: 'Seminarverwaltung',
  locations: 'Standortverwaltung',
  testimonials: 'Erfahrungsberichte',
  bookings: 'Buchungsverwaltung',

  // Actions
  save: 'Speichern',
  cancel: 'Abbrechen',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  add: 'Hinzufügen',
  search: 'Suchen',
  filter: 'Filtern',
  refresh: 'Aktualisieren',

  // Status
  published: 'Veröffentlicht',
  unpublished: 'Unveröffentlicht',
  active: 'Aktiv',
  inactive: 'Inaktiv',

  // User management
  userManagement: 'Benutzerverwaltung',
  outperformer: 'Outperformer',
  outperformerOnly: 'Nur Outperformer',
  role: 'Rolle',
  admin: 'Administrator',
  user: 'Benutzer',
  lastSignIn: 'Letzte Anmeldung',
  deleteUser: 'Benutzer löschen',
  assignRole: 'Rolle zuweisen',

  // Reports
  reportsAnalytics: 'Berichte & Analysen',
  systemStatus: 'Systemstatus',
  bookingStats: 'Buchungsstatistiken',
  courseUtilization: 'Kursauslastung',
  userGrowth: 'Benutzer-Wachstum',
  healthy: 'Gesund',
  degraded: 'Eingeschränkt',
  unhealthy: 'Nicht verfügbar',

  // Table headers
  name: 'Name',
  email: 'E-Mail',
  actions: 'Aktionen',
  status: 'Status',
  createdAt: 'Erstellt am',
} as const;

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];
export type DashboardCard = (typeof DASHBOARD_CARDS)[number];
