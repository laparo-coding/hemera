"use client";

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import type React from "react";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number | null;
  currency: string;
  capacity?: number | null;
  date: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  availableSpots?: number | null;
  totalBookings?: number;
  userBookingStatus?: string | null;
}

export interface CourseListingProps {
  courses: Course[];
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showBookingStatus?: boolean;
  className?: string;
}

export interface CourseCardProps {
  course: Course;
  showBookingStatus?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  showBookingStatus = false,
}) => {
  // Debug logging removed per observability standards

  const isAvailable =
    course.capacity === null ||
    (course.availableSpots !== null &&
      course.availableSpots !== undefined &&
      course.availableSpots > 0);
  const isUserBooked = course.userBookingStatus === "PAID";

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
      data-testid="course-card"
    >
      <div className="p-6">
        {/* Header with title and status */}
        <div className="flex justify-between items-start mb-3">
          <h3
            className="text-xl font-semibold text-gray-900 line-clamp-2 course-name"
            data-testid="course-name"
          >
            {course.title}
          </h3>
          <div className="flex flex-col items-end gap-1 ml-4">
            {/* Availability badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isAvailable
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isAvailable ? "Verfügbar" : "Ausgebucht"}
            </span>

            {/* User booking status */}
            {showBookingStatus && isUserBooked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Gebucht
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {course.description}
          </p>
        )}

        {/* Course details */}
        <div className="space-y-2 mb-4">
          {/* Date */}
          {course.date && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(course.date).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          {/* Capacity info */}
          {course.capacity && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {course.totalBookings}/{course.capacity} Teilnehmer
              {course.availableSpots !== null &&
                course.availableSpots !== undefined &&
                course.availableSpots > 0 && (
                  <span className="ml-1 text-green-600">
                    ({course.availableSpots} frei)
                  </span>
                )}
            </div>
          )}

          {/* Creation time */}
          <div className="flex items-center text-sm text-gray-400">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Erstellt{" "}
            {formatDistanceToNow(new Date(course.createdAt), {
              addSuffix: true,
              locale: de,
            })}
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-baseline">
            <span
              className="text-2xl font-bold text-gray-900"
              data-testid="course-price"
            >
              {course.price && Number(course.price) > 0
                ? (Number(course.price) / 100).toLocaleString("de-DE", {
                    style: "currency",
                    currency: course.currency,
                  })
                : "Kostenlos"}
            </span>
          </div>

          <Link
            href={`/checkout?courseId=${encodeURIComponent(course.slug || course.id)}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Buchen
          </Link>
        </div>
      </div>
    </div>
  );
};

const LoadingCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <div className="h-8 bg-gray-200 rounded w-20"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

const CourseListing: React.FC<CourseListingProps> = ({
  courses,
  loading = false,
  error = null,
  onLoadMore,
  hasMore = false,
  showBookingStatus = false,
  className = "",
}) => {
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Fehler beim Laden
          </h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && courses.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Kurse gefunden
          </h3>
          <p className="text-gray-500">
            Es sind derzeit keine Kurse verfügbar. Schauen Sie später wieder
            vorbei!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Course Grid */}
      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            showBookingStatus={showBookingStatus}
          />
        ))}

        {/* Loading cards */}
        {loading &&
          Array.from({ length: 1 }).map((_, index) => (
            <LoadingCard key={`loading-${index}`} />
          ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center pt-8">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Laden...
              </>
            ) : (
              <>
                Mehr Kurse laden
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseListing;
export { CourseCard, LoadingCard };
