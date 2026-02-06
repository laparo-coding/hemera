/**
 * Admin Reports API
 * Feature: 024-admin-dashboard
 *
 * Server-side functions for dashboard statistics and health status.
 */

import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import type {
  AdminReportsResponse,
  BookingStats,
  CourseUtilizationStats,
  DashboardStats,
  HealthStatus,
  HealthStatusLevel,
  ServiceHealth,
  UserGrowthStats,
} from '@/lib/types/admin';

/**
 * Helper: Fetch all users from Clerk via pagination
 */
async function getAllClerkUsers() {
  const clerk = await clerkClient();
  let allUsers: Awaited<ReturnType<typeof clerk.users.getUserList>>['data'] =
    [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await clerk.users.getUserList({
      limit,
      offset,
    });
    allUsers = allUsers.concat(response.data);
    offset += limit;
    hasMore = response.data.length === limit;
  }

  return allUsers;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user counts from Clerk (iterative fetch)
  const allClerkUsers = await getAllClerkUsers();
  const totalUsers = allClerkUsers.length;
  const newUsersLast30Days = allClerkUsers.filter(
    user => new Date(user.createdAt) >= thirtyDaysAgo
  ).length;

  // Get course counts
  const [totalCourses, publishedCourses] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  // Get booking counts and revenue
  const [totalBookings, bookingsLast30Days, revenueData] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: { in: ['CONFIRMED', 'PAID'] } },
    }),
  ]);

  const revenueLast30DaysData = await prisma.booking.aggregate({
    _sum: { amount: true },
    where: {
      paymentStatus: { in: ['CONFIRMED', 'PAID'] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Calculate average course utilization
  const coursesWithCapacity = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      capacity: true,
    },
  });

  // Get booking counts for each course
  const bookingCounts = await prisma.booking.groupBy({
    by: ['courseId'],
    where: {
      paymentStatus: { in: ['CONFIRMED', 'PRE_BOOKED', 'PENDING', 'PAID'] },
    },
    _count: true,
  });

  const bookingCountMap = new Map(
    bookingCounts.map(b => [b.courseId, b._count])
  );

  const utilizationValues = coursesWithCapacity.map(course => {
    if (course.capacity === 0) return 0;
    const bookings = bookingCountMap.get(course.id) ?? 0;
    return (bookings / course.capacity) * 100;
  });

  const averageCourseUtilization =
    utilizationValues.length > 0
      ? utilizationValues.reduce((sum, val) => sum + val, 0) /
        utilizationValues.length
      : 0;

  return {
    totalUsers,
    newUsersLast30Days,
    totalCourses,
    publishedCourses,
    totalBookings,
    bookingsLast30Days,
    totalRevenue: revenueData._sum?.amount ?? 0,
    revenueLast30Days: revenueLast30DaysData._sum?.amount ?? 0,
    averageCourseUtilization: Math.round(averageCourseUtilization * 100) / 100,
    updatedAt: now.toISOString(),
  };
}

/**
 * Get booking statistics
 */
export async function getBookingStats(): Promise<BookingStats> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    total,
    confirmed,
    pending,
    preBooked,
    cancelled,
    paid,
    last7Days,
    last30Days,
    totalRevenue,
    revenueLast30Days,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { paymentStatus: 'CONFIRMED' } }),
    prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
    prisma.booking.count({ where: { paymentStatus: 'PRE_BOOKED' } }),
    prisma.booking.count({ where: { paymentStatus: 'CANCELLED' } }),
    prisma.booking.count({ where: { paymentStatus: 'PAID' } }),
    prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: { in: ['CONFIRMED', 'PAID'] } },
    }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: { in: ['CONFIRMED', 'PAID'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    total,
    byStatus: {
      CONFIRMED: confirmed,
      PENDING: pending,
      PRE_BOOKED: preBooked,
      CANCELLED: cancelled,
      COMPLETED: paid, // PAID maps to COMPLETED in our UI
    },
    last7Days,
    last30Days,
    revenue: {
      total: totalRevenue._sum?.amount ?? 0,
      last30Days: revenueLast30Days._sum?.amount ?? 0,
    },
  };
}

/**
 * Get course utilization statistics
 */
export async function getCourseUtilization(): Promise<
  CourseUtilizationStats[]
> {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      capacity: true,
    },
    orderBy: { startDate: 'asc' },
  });

  // Get booking counts for each course
  const bookingCounts = await prisma.booking.groupBy({
    by: ['courseId'],
    where: {
      paymentStatus: { in: ['CONFIRMED', 'PRE_BOOKED', 'PENDING', 'PAID'] },
    },
    _count: true,
  });

  const bookingCountMap = new Map(
    bookingCounts.map(b => [b.courseId, b._count])
  );

  return courses.map(course => {
    const currentBookings = bookingCountMap.get(course.id) ?? 0;
    return {
      courseId: course.id,
      courseTitle: course.title,
      maxParticipants: course.capacity,
      currentBookings,
      utilizationPercent:
        course.capacity > 0
          ? Math.round((currentBookings / course.capacity) * 10000) / 100
          : 0,
    };
  });
}

/**
 * Get user growth statistics
 */
export async function getUserGrowthStats(): Promise<UserGrowthStats> {
  // Get all users from Clerk (iterative fetch)
  const allClerkUsers = await getAllClerkUsers();

  // Count admins
  const admins = allClerkUsers.filter(
    user => user.publicMetadata?.role === 'admin'
  ).length;

  // Count outperformers (from Prisma)
  const outperformers = await prisma.user.count({
    where: { isOutperformer: true },
  });

  // Calculate monthly growth (last 6 months)
  const monthlyGrowth: UserGrowthStats['monthlyGrowth'] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const month = monthDate.toISOString().slice(0, 7); // YYYY-MM

    const newUsersInMonth = allClerkUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= monthDate && createdAt <= monthEnd;
    }).length;

    const cumulativeTotal = allClerkUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt <= monthEnd;
    }).length;

    monthlyGrowth.push({
      month,
      newUsers: newUsersInMonth,
      cumulativeTotal,
    });
  }

  return {
    total: allClerkUsers.length,
    outperformers,
    admins,
    monthlyGrowth,
  };
}

/**
 * Get full reports response
 */
export async function getAdminReports(): Promise<AdminReportsResponse> {
  const [stats, bookings, courseUtilization, userGrowth] = await Promise.all([
    getDashboardStats(),
    getBookingStats(),
    getCourseUtilization(),
    getUserGrowthStats(),
  ]);

  return {
    stats,
    bookings,
    courseUtilization,
    userGrowth,
  };
}

/**
 * Get health status for all services
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const now = new Date().toISOString();

  const services: HealthStatus['services'] = {
    database: await checkDatabaseHealth(),
    clerk: await checkClerkHealth(),
    stripe: await checkStripeHealth(),
    rollbar: await checkRollbarHealth(),
  };

  // Calculate overall status
  const statuses = Object.values(services).map(s => s.status);
  let overall: HealthStatusLevel = 'healthy';
  if (statuses.some(s => s === 'unhealthy')) {
    overall = 'unhealthy';
  } else if (statuses.some(s => s === 'degraded')) {
    overall = 'degraded';
  }

  // Get build info
  const { getBuildInfo } = await import('@/lib/buildInfo');
  const buildInfo = getBuildInfo();

  return {
    overall,
    services,
    build: {
      version: buildInfo.version,
      commitSha: buildInfo.commitSha ?? 'unknown',
      buildTime: buildInfo.buildTime ?? now,
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    },
    lastChecked: now,
  };
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      nameDe: 'Datenbank',
      status: 'healthy',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'database',
      nameDe: 'Datenbank',
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Verbindung fehlgeschlagen',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkClerkHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const clerk = await clerkClient();
    await clerk.users.getUserList({ limit: 1 });
    return {
      name: 'clerk',
      nameDe: 'Authentifizierung',
      status: 'healthy',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'clerk',
      nameDe: 'Authentifizierung',
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Verbindung fehlgeschlagen',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStripeHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return {
        name: 'stripe',
        nameDe: 'Zahlungen',
        status: 'degraded',
        message: 'API-Schlüssel nicht konfiguriert',
        lastChecked: new Date().toISOString(),
      };
    }

    // Light-weight check: just verify key format
    const isValidFormat = stripeKey.startsWith('sk_');
    return {
      name: 'stripe',
      nameDe: 'Zahlungen',
      status: isValidFormat ? 'healthy' : 'degraded',
      responseTimeMs: Date.now() - startTime,
      message: isValidFormat ? undefined : 'Ungültiges Schlüsselformat',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'stripe',
      nameDe: 'Zahlungen',
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Prüfung fehlgeschlagen',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkRollbarHealth(): Promise<ServiceHealth> {
  const rollbarEnabled = process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '1';
  const rollbarToken = process.env.ROLLBAR_SERVER_TOKEN;

  if (!rollbarEnabled) {
    return {
      name: 'rollbar',
      nameDe: 'Fehlerüberwachung',
      status: 'degraded',
      message: 'Deaktiviert',
      lastChecked: new Date().toISOString(),
    };
  }

  return {
    name: 'rollbar',
    nameDe: 'Fehlerüberwachung',
    status: rollbarToken ? 'healthy' : 'degraded',
    message: rollbarToken ? undefined : 'Server-Token nicht konfiguriert',
    lastChecked: new Date().toISOString(),
  };
}
