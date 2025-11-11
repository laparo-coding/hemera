"use client";

import { CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	Container,
	Typography,
} from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BookingSuccessContent() {
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const sessionId = searchParams.get("session_id");
	const bookingId = searchParams.get("booking_id");

	useEffect(() => {
		const verify = async () => {
			if (!sessionId || !bookingId) {
				setError("Fehlende Parameter für die Buchungsbestätigung");
				setLoading(false);
				return;
			}

			try {
				// Minimal verification: check if booking exists for current user
				const resp = await fetch("/api/bookings?page=1&limit=100", {
					headers: { Accept: "application/json" },
				});

				if (resp.status === 401) {
					setError("Bitte melde dich an, um deine Buchung zu bestätigen.");
					setLoading(false);
					return;
				}

				if (!resp.ok) {
					throw new Error("Überprüfung nicht möglich");
				}

				const data = await resp.json();
				const exists =
					Array.isArray(data?.data?.bookings) &&
					data.data.bookings.some((b: { id: string }) => b.id === bookingId);

				if (!exists) {
					setError(
						"Buchung nicht gefunden. Bitte prüfe den Link oder kontaktiere den Support.",
					);
				}
			} catch (_e) {
				setError("Es ist ein Fehler bei der Überprüfung aufgetreten.");
			} finally {
				setLoading(false);
			}
		};

		verify();
	}, [sessionId, bookingId]);

	if (loading) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Card>
					<CardContent sx={{ textAlign: "center", p: 4 }}>
						<CircularProgress size={32} sx={{ mb: 2 }} />
						<Typography>Buchung wird überprüft...</Typography>
					</CardContent>
				</Card>
			</Container>
		);
	}

	if (error) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Card>
					<CardHeader>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<ErrorIcon color="error" sx={{ mr: 1 }} />
							<Typography variant="h6" color="error">
								Fehler bei der Buchung
							</Typography>
						</Box>
					</CardHeader>
					<CardContent>
						<Typography color="text.secondary" sx={{ mb: 3 }}>
							{error}
						</Typography>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							<Button
								variant="contained"
								component={Link}
								href="/courses"
								fullWidth
							>
								Zurück zu den Kursen
							</Button>
							<Button
								variant="outlined"
								component={Link}
								href="/dashboard"
								fullWidth
							>
								Dashboard
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Container>
		);
	}

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Card>
				<CardHeader>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<CheckCircle color="success" sx={{ mr: 1 }} />
						<Typography variant="h6" color="success.main">
							Buchung erfolgreich!
						</Typography>
					</Box>
				</CardHeader>
				<CardContent>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						<Box>
							<Typography variant="h5" gutterBottom>
								Kurs erfolgreich gebucht
							</Typography>
							<Typography color="text.secondary">
								Deine Buchung wurde erfolgreich abgeschlossen.
							</Typography>
						</Box>

						<Alert severity="info">
							Du erhältst in Kürze eine Bestätigungs-E-Mail mit allen Details
							deiner Buchung.
						</Alert>

						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							<Button
								variant="contained"
								component={Link}
								href="/bookings"
								fullWidth
							>
								Meine Buchungen
							</Button>
							<Button
								variant="outlined"
								component={Link}
								href="/courses"
								fullWidth
							>
								Weitere Kurse
							</Button>
						</Box>
					</Box>
				</CardContent>
			</Card>
		</Container>
	);
}

export default function BookingSuccessPage() {
	return (
		<Suspense
			fallback={
				<Container maxWidth="md" sx={{ py: 4 }}>
					<Card>
						<CardContent sx={{ textAlign: "center", p: 4 }}>
							<CircularProgress size={32} sx={{ mb: 2 }} />
							<Typography>Lade...</Typography>
						</CardContent>
					</Card>
				</Container>
			}
		>
			<BookingSuccessContent />
		</Suspense>
	);
}
