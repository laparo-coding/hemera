import type { Course } from '@prisma/client';

/**
 * Course Level (will be Prisma enum after migration)
 */
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Course with enrollment count
 * Used in list and detail views to show how many students are enrolled
 * Note: We use bookings as a proxy for enrollments in the current schema
 */
export type CourseWithEnrollmentCount = Course & {
  _count: {
    bookings: number;
  };
};

/**
 * DTO for creating a new course
 * Omits auto-generated fields
 */
export type CourseCreateInput = {
  title: string;
  description: string;
  price: number;
  startDate: Date;
  startTime: Date;
  endTime: Date;
  instructor: string;
  level: CourseLevel;
  thumbnailUrl?: string | null;
  capacity: number;
};

/**
 * DTO for updating an existing course
 * All fields optional except updatedAt (for optimistic locking)
 */
export type CourseUpdateInput = {
  title?: string;
  description?: string;
  price?: number;
  startDate?: Date;
  startTime?: Date;
  endTime?: Date;
  instructor?: string;
  level?: CourseLevel;
  thumbnailUrl?: string | null;
  capacity?: number;
  updatedAt: Date; // Required for optimistic locking
};

/**
 * DTO for transferring enrollments
 */
export type EnrollmentTransferInput = {
  targetCourseId: string;
};

/**
 * Admin operation result
 */
export type AdminOperationResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code: string;
    };

// =============================================================================
// User Management Types (024-admin-dashboard)
// =============================================================================

/**
 * User list item as returned by the admin users API
 */
export interface AdminUserListItem {
  /** Clerk user ID */
  id: string;

  /** User's email address */
  email: string;

  /** Full name (firstName + lastName from Clerk) */
  fullName: string | null;

  /** First name from Clerk */
  firstName: string | null;

  /** Last name from Clerk */
  lastName: string | null;

  /** Profile image URL from Clerk */
  imageUrl: string | null;

  /** Whether user has admin role */
  isAdmin: boolean;

  /** Whether user is an Outperformer (completed advanced course) */
  isOutperformer: boolean;

  /** Last sign-in timestamp (ISO 8601) */
  lastSignInAt: string | null;

  /** Account creation timestamp (ISO 8601) */
  createdAt: string;

  /** Number of bookings by this user */
  bookingsCount: number;

  /** Number of completed courses */
  completedCoursesCount: number;
}

/**
 * Paginated user list response
 */
export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: PaginationMeta;
}

/**
 * User list query parameters
 */
export interface AdminUsersQueryParams {
  /** Page number (1-indexed) */
  page?: number;

  /** Items per page */
  limit?: number;

  /** Search term for name/email */
  search?: string;

  /** Filter by Outperformer status */
  outperformerOnly?: boolean;

  /** Filter by admin role */
  adminOnly?: boolean;

  /** Sort field */
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastSignInAt';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Update user request body
 */
export interface AdminUserUpdateRequest {
  /** Set admin role */
  isAdmin?: boolean;
}

// =============================================================================
// Reports & Analytics Types (024-admin-dashboard)
// =============================================================================

/**
 * Dashboard statistics summary
 */
export interface DashboardStats {
  /** Total registered users */
  totalUsers: number;

  /** Users registered in last 30 days */
  newUsersLast30Days: number;

  /** Total courses */
  totalCourses: number;

  /** Published courses */
  publishedCourses: number;

  /** Total bookings */
  totalBookings: number;

  /** Bookings in last 30 days */
  bookingsLast30Days: number;

  /** Total revenue in cents (EUR) */
  totalRevenue: number;

  /** Revenue in last 30 days in cents (EUR) */
  revenueLast30Days: number;

  /** Average course utilization (0-100) */
  averageCourseUtilization: number;

  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Booking statistics for reports
 */
export interface BookingStats {
  /** Total bookings */
  total: number;

  /** Bookings by status */
  byStatus: {
    CONFIRMED: number;
    PENDING: number;
    PRE_BOOKED: number;
    CANCELLED: number;
    COMPLETED: number;
  };

  /** Bookings in last 7 days */
  last7Days: number;

  /** Bookings in last 30 days */
  last30Days: number;

  /** Revenue in cents (EUR) */
  revenue: {
    total: number;
    last30Days: number;
  };
}

/**
 * Course utilization statistics
 */
export interface CourseUtilizationStats {
  /** Course ID */
  courseId: string;

  /** Course title */
  courseTitle: string;

  /** Maximum participants */
  maxParticipants: number;

  /** Current bookings count */
  currentBookings: number;

  /** Utilization percentage (0-100) */
  utilizationPercent: number;
}

/**
 * User growth statistics
 */
export interface UserGrowthStats {
  /** Total users */
  total: number;

  /** Outperformer count */
  outperformers: number;

  /** Admin count */
  admins: number;

  /** Growth data by month */
  monthlyGrowth: Array<{
    /** Month (YYYY-MM) */
    month: string;
    /** New users in that month */
    newUsers: number;
    /** Cumulative total */
    cumulativeTotal: number;
  }>;
}

/**
 * Reports API response
 */
export interface AdminReportsResponse {
  stats: DashboardStats;
  bookings: BookingStats;
  courseUtilization: CourseUtilizationStats[];
  userGrowth: UserGrowthStats;
}

// =============================================================================
// Health Status Types (024-admin-dashboard)
// =============================================================================

/**
 * Health status levels
 */
export type HealthStatusLevel = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Individual service health status
 */
export interface ServiceHealth {
  /** Service name */
  name: string;

  /** German display name */
  nameDe: string;

  /** Health status */
  status: HealthStatusLevel;

  /** Response time in ms (if applicable) */
  responseTimeMs?: number;

  /** Additional details */
  message?: string;

  /** Last check timestamp (ISO 8601) */
  lastChecked: string;
}

/**
 * Overall system health status
 */
export interface HealthStatus {
  /** Overall system status */
  overall: HealthStatusLevel;

  /** Individual service statuses */
  services: {
    database: ServiceHealth;
    clerk: ServiceHealth;
    stripe: ServiceHealth;
    rollbar: ServiceHealth;
  };

  /** Build information */
  build: {
    version: string;
    commitSha: string;
    buildTime: string;
    environment: string;
  };

  /** Last check timestamp (ISO 8601) */
  lastChecked: string;
}

// =============================================================================
// Common Types (024-admin-dashboard)
// =============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page (1-indexed) */
  page: number;

  /** Items per page */
  limit: number;

  /** Total items across all pages */
  totalItems: number;

  /** Total pages */
  totalPages: number;

  /** Whether there's a next page */
  hasNextPage: boolean;

  /** Whether there's a previous page */
  hasPreviousPage: boolean;
}

/**
 * API error response
 */
export interface AdminApiError {
  /** Error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** German error message */
  messageDe: string;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label (German) */
  label: string;

  /** Route path */
  href: string;

  /** Whether this is the current page */
  current?: boolean;
}
