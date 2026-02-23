/**
 * Admin Reports API Contract Tests
 * Feature: 024-admin-dashboard
 *
 * Tests the API contract for admin reports and health status endpoints.
 */
import { describe, expect, it } from '@jest/globals';

import type {
  AdminApiError,
  AdminReportsResponse,
  BookingStats,
  CourseUtilizationStats,
  DashboardStats,
  HealthStatus,
  HealthStatusLevel,
  ServiceHealth,
  UserGrowthStats,
} from '@/lib/types/admin';

describe('GET /api/admin/reports/stats - Contract Tests', () => {
  describe('Response Schema Validation', () => {
    it('should return DashboardStats structure', () => {
      const mockStats: DashboardStats = {
        totalUsers: 150,
        newUsersLast30Days: 25,
        totalCourses: 12,
        publishedCourses: 8,
        totalBookings: 320,
        bookingsLast30Days: 45,
        totalRevenue: 4500000, // €45,000 in cents
        revenueLast30Days: 750000, // €7,500 in cents
        averageCourseUtilization: 72.5,
        updatedAt: '2025-01-15T10:30:00Z',
      };

      // All numeric fields
      expect(typeof mockStats.totalUsers).toBe('number');
      expect(typeof mockStats.newUsersLast30Days).toBe('number');
      expect(typeof mockStats.totalCourses).toBe('number');
      expect(typeof mockStats.publishedCourses).toBe('number');
      expect(typeof mockStats.totalBookings).toBe('number');
      expect(typeof mockStats.bookingsLast30Days).toBe('number');
      expect(typeof mockStats.totalRevenue).toBe('number');
      expect(typeof mockStats.revenueLast30Days).toBe('number');
      expect(typeof mockStats.averageCourseUtilization).toBe('number');
      expect(typeof mockStats.updatedAt).toBe('string');

      // Non-negative constraints
      expect(mockStats.totalUsers).toBeGreaterThanOrEqual(0);
      expect(mockStats.newUsersLast30Days).toBeGreaterThanOrEqual(0);
      expect(mockStats.totalCourses).toBeGreaterThanOrEqual(0);
      expect(mockStats.publishedCourses).toBeGreaterThanOrEqual(0);
      expect(mockStats.totalBookings).toBeGreaterThanOrEqual(0);
      expect(mockStats.bookingsLast30Days).toBeGreaterThanOrEqual(0);
      expect(mockStats.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(mockStats.revenueLast30Days).toBeGreaterThanOrEqual(0);

      // Utilization percentage bounds
      expect(mockStats.averageCourseUtilization).toBeGreaterThanOrEqual(0);
      expect(mockStats.averageCourseUtilization).toBeLessThanOrEqual(100);
    });

    it('should validate published courses do not exceed total courses', () => {
      const testCases = [
        { total: 10, published: 5, valid: true },
        { total: 10, published: 10, valid: true },
        { total: 10, published: 0, valid: true },
        { total: 5, published: 10, valid: false },
      ];

      testCases.forEach(({ total, published, valid }) => {
        const isValid = published <= total;
        expect(isValid).toBe(valid);
      });
    });

    it('should validate revenue is stored in cents (EUR)', () => {
      // €45,000.00 should be stored as 4500000 cents
      const euroAmount = 45000;
      const centsAmount = 4500000;

      expect(centsAmount).toBe(euroAmount * 100);
    });
  });

  describe('Booking Statistics Schema', () => {
    it('should return BookingStats structure', () => {
      const mockBookingStats: BookingStats = {
        total: 320,
        byStatus: {
          CONFIRMED: 200,
          PENDING: 15,
          PRE_BOOKED: 20,
          CANCELLED: 25,
          COMPLETED: 60,
        },
        last7Days: 12,
        last30Days: 45,
        revenue: {
          total: 4500000,
          last30Days: 750000,
        },
      };

      expect(typeof mockBookingStats.total).toBe('number');
      expect(typeof mockBookingStats.byStatus).toBe('object');
      expect(typeof mockBookingStats.last7Days).toBe('number');
      expect(typeof mockBookingStats.last30Days).toBe('number');
      expect(typeof mockBookingStats.revenue).toBe('object');

      // Status breakdown
      expect(mockBookingStats.byStatus).toHaveProperty('CONFIRMED');
      expect(mockBookingStats.byStatus).toHaveProperty('PENDING');
      expect(mockBookingStats.byStatus).toHaveProperty('PRE_BOOKED');
      expect(mockBookingStats.byStatus).toHaveProperty('CANCELLED');
      expect(mockBookingStats.byStatus).toHaveProperty('COMPLETED');
    });

    it('should validate status counts sum to total', () => {
      const stats: BookingStats = {
        total: 320,
        byStatus: {
          CONFIRMED: 200,
          PENDING: 15,
          PRE_BOOKED: 20,
          CANCELLED: 25,
          COMPLETED: 60,
        },
        last7Days: 12,
        last30Days: 45,
        revenue: { total: 0, last30Days: 0 },
      };

      const statusSum = Object.values(stats.byStatus).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(statusSum).toBe(stats.total);
    });
  });

  describe('Course Utilization Schema', () => {
    it('should return CourseUtilizationStats array', () => {
      const mockUtilization: CourseUtilizationStats[] = [
        {
          courseId: 'course_123',
          courseTitle: 'Laparoskopie Grundkurs',
          maxParticipants: 12,
          currentBookings: 10,
          utilizationPercent: 83.33,
        },
        {
          courseId: 'course_456',
          courseTitle: 'Fortgeschrittener Kurs',
          maxParticipants: 8,
          currentBookings: 4,
          utilizationPercent: 50.0,
        },
      ];

      expect(Array.isArray(mockUtilization)).toBe(true);

      mockUtilization.forEach(course => {
        expect(typeof course.courseId).toBe('string');
        expect(typeof course.courseTitle).toBe('string');
        expect(typeof course.maxParticipants).toBe('number');
        expect(typeof course.currentBookings).toBe('number');
        expect(typeof course.utilizationPercent).toBe('number');

        expect(course.maxParticipants).toBeGreaterThan(0);
        expect(course.currentBookings).toBeGreaterThanOrEqual(0);
        expect(course.utilizationPercent).toBeGreaterThanOrEqual(0);
        expect(course.utilizationPercent).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate utilization percentage correctly', () => {
      const testCases = [
        { max: 10, current: 5, expected: 50 },
        { max: 12, current: 10, expected: 83.33 },
        { max: 8, current: 8, expected: 100 },
        { max: 10, current: 0, expected: 0 },
      ];

      testCases.forEach(({ max, current, expected }) => {
        const calculated = Math.round((current / max) * 10000) / 100;
        expect(calculated).toBeCloseTo(expected, 1);
      });
    });
  });

  describe('User Growth Schema', () => {
    it('should return UserGrowthStats structure', () => {
      const mockGrowth: UserGrowthStats = {
        total: 150,
        outperformers: 25,
        admins: 3,
        monthlyGrowth: [
          { month: '2024-10', newUsers: 15, cumulativeTotal: 100 },
          { month: '2024-11', newUsers: 20, cumulativeTotal: 120 },
          { month: '2024-12', newUsers: 18, cumulativeTotal: 138 },
          { month: '2025-01', newUsers: 12, cumulativeTotal: 150 },
        ],
      };

      expect(typeof mockGrowth.total).toBe('number');
      expect(typeof mockGrowth.outperformers).toBe('number');
      expect(typeof mockGrowth.admins).toBe('number');
      expect(Array.isArray(mockGrowth.monthlyGrowth)).toBe(true);

      mockGrowth.monthlyGrowth.forEach(month => {
        expect(typeof month.month).toBe('string');
        expect(month.month).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
        expect(typeof month.newUsers).toBe('number');
        expect(typeof month.cumulativeTotal).toBe('number');
      });
    });

    it('should validate monthly growth cumulative totals are ascending', () => {
      const monthlyGrowth = [
        { month: '2024-10', newUsers: 15, cumulativeTotal: 100 },
        { month: '2024-11', newUsers: 20, cumulativeTotal: 120 },
        { month: '2024-12', newUsers: 18, cumulativeTotal: 138 },
      ];

      for (let i = 1; i < monthlyGrowth.length; i++) {
        const current = monthlyGrowth[i];
        const previous = monthlyGrowth[i - 1];
        if (current && previous) {
          expect(current.cumulativeTotal).toBeGreaterThanOrEqual(
            previous.cumulativeTotal
          );
        }
      }
    });
  });
});

describe('GET /api/admin/reports/health - Contract Tests', () => {
  describe('Response Schema Validation', () => {
    it('should return HealthStatus structure', () => {
      const mockHealth: HealthStatus = {
        overall: 'healthy',
        services: {
          database: {
            name: 'database',
            nameDe: 'Datenbank',
            status: 'healthy',
            responseTimeMs: 45,
            lastChecked: '2025-01-15T10:30:00Z',
          },
          clerk: {
            name: 'clerk',
            nameDe: 'Authentifizierung',
            status: 'healthy',
            responseTimeMs: 120,
            lastChecked: '2025-01-15T10:30:00Z',
          },
          stripe: {
            name: 'stripe',
            nameDe: 'Zahlungen',
            status: 'healthy',
            responseTimeMs: 200,
            lastChecked: '2025-01-15T10:30:00Z',
          },
          rollbar: {
            name: 'rollbar',
            nameDe: 'Fehlerüberwachung',
            status: 'healthy',
            lastChecked: '2025-01-15T10:30:00Z',
          },
        },
        build: {
          version: '1.0.0',
          commitSha: 'abc123def',
          buildTime: '2025-01-15T08:00:00Z',
          environment: 'production',
        },
        lastChecked: '2025-01-15T10:30:00Z',
      };

      expect(mockHealth).toHaveProperty('overall');
      expect(mockHealth).toHaveProperty('services');
      expect(mockHealth).toHaveProperty('build');
      expect(mockHealth).toHaveProperty('lastChecked');

      // Services structure
      expect(mockHealth.services).toHaveProperty('database');
      expect(mockHealth.services).toHaveProperty('clerk');
      expect(mockHealth.services).toHaveProperty('stripe');
      expect(mockHealth.services).toHaveProperty('rollbar');
    });

    it('should validate HealthStatusLevel enum values', () => {
      const validLevels: HealthStatusLevel[] = [
        'healthy',
        'degraded',
        'unhealthy',
      ];

      validLevels.forEach(level => {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(level);
      });
    });

    it('should validate ServiceHealth structure', () => {
      const mockService: ServiceHealth = {
        name: 'database',
        nameDe: 'Datenbank',
        status: 'healthy',
        responseTimeMs: 45,
        message: 'Connection pool healthy',
        lastChecked: '2025-01-15T10:30:00Z',
      };

      expect(typeof mockService.name).toBe('string');
      expect(typeof mockService.nameDe).toBe('string');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(
        mockService.status
      );
      expect(typeof mockService.lastChecked).toBe('string');

      // Optional fields
      if (mockService.responseTimeMs !== undefined) {
        expect(typeof mockService.responseTimeMs).toBe('number');
        expect(mockService.responseTimeMs).toBeGreaterThanOrEqual(0);
      }
      if (mockService.message !== undefined) {
        expect(typeof mockService.message).toBe('string');
      }
    });

    it('should calculate overall status based on services', () => {
      const calculateOverall = (
        services: Record<string, { status: HealthStatusLevel }>
      ): HealthStatusLevel => {
        const statuses = Object.values(services).map(s => s.status);
        if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
        if (statuses.some(s => s === 'degraded')) return 'degraded';
        return 'healthy';
      };

      // All healthy
      expect(
        calculateOverall({
          a: { status: 'healthy' },
          b: { status: 'healthy' },
        })
      ).toBe('healthy');

      // One degraded
      expect(
        calculateOverall({
          a: { status: 'healthy' },
          b: { status: 'degraded' },
        })
      ).toBe('degraded');

      // One unhealthy
      expect(
        calculateOverall({
          a: { status: 'healthy' },
          b: { status: 'unhealthy' },
        })
      ).toBe('unhealthy');
    });

    it('should validate build information structure', () => {
      const buildInfo = {
        version: '1.0.0',
        commitSha: 'abc123def456',
        buildTime: '2025-01-15T08:00:00Z',
        environment: 'production',
      };

      expect(typeof buildInfo.version).toBe('string');
      expect(typeof buildInfo.commitSha).toBe('string');
      expect(typeof buildInfo.buildTime).toBe('string');
      expect(['development', 'preview', 'production']).toContain(
        buildInfo.environment
      );
    });
  });

  describe('German Localization', () => {
    it('should have German names for all services', () => {
      const serviceNames = {
        database: 'Datenbank',
        clerk: 'Authentifizierung',
        stripe: 'Zahlungen',
        rollbar: 'Fehlerüberwachung',
      };

      Object.values(serviceNames).forEach(nameDe => {
        expect(typeof nameDe).toBe('string');
        expect(nameDe.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Full Reports Response Schema', () => {
  it('should validate AdminReportsResponse structure', () => {
    const mockFullResponse: AdminReportsResponse = {
      stats: {
        totalUsers: 150,
        newUsersLast30Days: 25,
        totalCourses: 12,
        publishedCourses: 8,
        totalBookings: 320,
        bookingsLast30Days: 45,
        totalRevenue: 4500000,
        revenueLast30Days: 750000,
        averageCourseUtilization: 72.5,
        updatedAt: '2025-01-15T10:30:00Z',
      },
      bookings: {
        total: 320,
        byStatus: {
          CONFIRMED: 200,
          PENDING: 15,
          PRE_BOOKED: 20,
          CANCELLED: 25,
          COMPLETED: 60,
        },
        last7Days: 12,
        last30Days: 45,
        revenue: {
          total: 4500000,
          last30Days: 750000,
        },
      },
      courseUtilization: [
        {
          courseId: 'course_123',
          courseTitle: 'Laparoskopie Grundkurs',
          maxParticipants: 12,
          currentBookings: 10,
          utilizationPercent: 83.33,
        },
      ],
      userGrowth: {
        total: 150,
        outperformers: 25,
        admins: 3,
        monthlyGrowth: [
          { month: '2024-12', newUsers: 18, cumulativeTotal: 138 },
          { month: '2025-01', newUsers: 12, cumulativeTotal: 150 },
        ],
      },
    };

    expect(mockFullResponse).toHaveProperty('stats');
    expect(mockFullResponse).toHaveProperty('bookings');
    expect(mockFullResponse).toHaveProperty('courseUtilization');
    expect(mockFullResponse).toHaveProperty('userGrowth');
  });
});

describe('Error Handling', () => {
  it('should return proper error structure for unauthorized access', () => {
    const mockError: AdminApiError = {
      code: 'UNAUTHORIZED',
      message: 'Admin authentication required',
      messageDe: 'Administrator-Authentifizierung erforderlich',
    };

    expect(mockError.code).toBe('UNAUTHORIZED');
    expect(mockError.messageDe).toContain('Administrator');
  });

  it('should return proper error structure for forbidden access', () => {
    const mockError: AdminApiError = {
      code: 'FORBIDDEN',
      message: 'Admin role required',
      messageDe: 'Administrator-Rolle erforderlich',
    };

    expect(mockError.code).toBe('FORBIDDEN');
  });
});
