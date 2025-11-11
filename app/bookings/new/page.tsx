export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasUserBookedCourse } from "@/lib/api/bookings";
import { getCourseById } from "@/lib/api/courses";
import { requireAuthenticatedUser } from "@/lib/auth/helpers";

export const metadata: Metadata = {
  title: "Book a Course - Hemera Academy",
  description: "Book your course at Hemera Academy",
  robots: "noindex,nofollow",
};

interface BookingNewPageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function BookingNewPage({
  searchParams,
}: BookingNewPageProps) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;

  const courseId = params.courseId;

  if (!courseId) {
    redirect("/courses?message=select-course");
  }

  try {
    await getCourseById(courseId);
  } catch (_error) {
    redirect("/courses?message=course-unavailable");
  }

  const alreadyBooked = await hasUserBookedCourse(user.id, courseId);

  if (alreadyBooked) {
    redirect("/bookings?message=already-booked");
  }

  redirect(`/checkout?courseId=${encodeURIComponent(courseId)}`);
}
