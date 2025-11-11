import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import BookingSuccessContent, {
	type BookingSuccessViewModel,
} from "@/components/booking/BookingSuccessContent";
import { getBookingById } from "@/lib/services/booking";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
	PENDING: "Ausstehend",
	PAID: "Bestätigt",
	FAILED: "Fehlgeschlagen",
	CANCELLED: "Storniert",
	REFUNDED: "Erstattet",
	CONFIRMED: "Bestätigt",
};

function formatCurrency(amount: number, currency: string) {
	try {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency,
			minimumFractionDigits: 2,
		}).format(amount / 100);
	} catch (_error) {
		return `${(amount / 100).toFixed(2)} ${currency}`;
	}
}

interface BookingSuccessPageProps {
	// Next.js 15 passes searchParams as a Promise for better streaming.
	// Support that shape here to satisfy PageProps constraint during build.
	searchParams?: Promise<{
		bookingId?: string;
	}>;
}

export default async function BookingSuccessPage({
	searchParams,
}: BookingSuccessPageProps) {
	const { bookingId } = (await searchParams) ?? {};

	if (!bookingId) {
		notFound();
	}

	const { userId } = await auth();

	if (!userId) {
		redirect(
			`/sign-in?redirect_url=${encodeURIComponent(`/booking-success?bookingId=${bookingId}`)}`,
		);
	}

	const booking = await getBookingById(bookingId);

	if (!booking || booking.userId !== userId) {
		notFound();
	}

	const viewModel: BookingSuccessViewModel = {
		id: booking.id,
		courseTitle: booking.course?.title ?? "Dein Kurs",
		courseDescription: booking.course?.description ?? null,
		courseDate: booking.course?.date?.toISOString() ?? null,
		// Optional time fields may not exist on Course type; access defensively
		courseStartTime:
			(
				booking.course as unknown as { startTime?: Date | null }
			)?.startTime?.toISOString() ?? null,
		courseEndTime:
			(
				booking.course as unknown as { endTime?: Date | null }
			)?.endTime?.toISOString() ?? null,
		bookingCreatedAt: booking.createdAt.toISOString(),
		bookingUpdatedAt: booking.updatedAt.toISOString(),
		paymentStatus: booking.paymentStatus,
		paymentStatusLabel:
			PAYMENT_STATUS_LABELS[booking.paymentStatus ?? ""] ??
			booking.paymentStatus ??
			"Unbekannt",
		amount: booking.amount ?? 0,
		currency: booking.currency ?? "EUR",
		formattedAmount: formatCurrency(
			booking.amount ?? 0,
			booking.currency ?? "EUR",
		),
		courseSlug: booking.course?.slug ?? null,
	};

	return <BookingSuccessContent booking={viewModel} />;
}
