/**
 * Dashboard Components Index
 *
 * Re-exports all dashboard components for easier imports.
 */

export type { CourseCardProps } from './CourseCard';
export {
  default as CourseCard,
  formatDateRange,
  formatTimeRange,
  getLocationDisplayText,
} from './CourseCard';
export {
  default as DashboardSection,
  SECTION_TITLES,
  type SectionType,
  shouldShowSection,
} from './DashboardSection';
export {
  BUTTON_TEXT,
  default as InvoiceDownloadButton,
  ERROR_MESSAGES,
  initiateInvoiceDownload,
} from './InvoiceDownloadButton';
export { UserBreadcrumb, type UserBreadcrumbItem } from './UserBreadcrumb';
export { UserPageContainer } from './UserPageContainer';
