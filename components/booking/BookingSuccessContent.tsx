"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SchoolIcon from "@mui/icons-material/School";
import {
  Alert,
  type AlertColor,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import Link from "next/link";

export interface BookingSuccessViewModel {
  id: string;
  courseTitle: string;
  courseDescription: string | null;
  courseDate: string | null;
  courseStartTime: string | null;
  courseEndTime: string | null;
  bookingCreatedAt: string;
  bookingUpdatedAt: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  amount: number;
  currency: string;
  formattedAmount: string;
  courseSlug: string | null;
}

interface BookingSuccessContentProps {
  booking: BookingSuccessViewModel;
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return null;
  try {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "full",
    }).format(date);
  } catch (_error) {
    return null;
  }
}

function formatTimeRange(startIso: string | null, endIso: string | null) {
  if (!startIso) return null;
  try {
    const start = new Date(startIso);
    const formatter = new Intl.DateTimeFormat("de-DE", {
      timeStyle: "short",
    });
    const startLabel = formatter.format(start);
    if (!endIso) {
      return startLabel;
    }
    const end = new Date(endIso);
    return `${startLabel} – ${formatter.format(end)}`;
  } catch (_error) {
    return null;
  }
}

export default function BookingSuccessContent({
  booking,
}: BookingSuccessContentProps) {
  const courseDateLabel = formatDate(booking.courseDate);
  const timeRangeLabel = formatTimeRange(
    booking.courseStartTime,
    booking.courseEndTime,
  );
  const createdAtLabel = formatDate(booking.bookingCreatedAt);
  const statusSeverity: AlertColor =
    booking.paymentStatus === "PAID" || booking.paymentStatus === "CONFIRMED"
      ? "success"
      : booking.paymentStatus === "PENDING"
        ? "info"
        : booking.paymentStatus === "FAILED"
          ? "error"
          : "warning";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Box data-testid="booking-success">
        <Stack
          spacing={4}
          alignItems="center"
          textAlign="center"
          sx={{ mb: 4 }}
        >
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h4" component="h1" data-testid="success-message">
            Zahlung erfolgreich abgeschlossen
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vielen Dank für deine Buchung. Wir haben dir eine Bestätigung per
            E-Mail geschickt.
          </Typography>
        </Stack>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 1.2 }}
                  color="text.secondary"
                >
                  Buchungsnummer
                </Typography>
                <Typography
                  variant="h6"
                  component="p"
                  fontFamily="monospace"
                  data-testid="booking-id"
                >
                  {booking.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Erstellt am {createdAtLabel ?? "–"}
                </Typography>
              </Box>

              <Divider />

              <Grid
                container
                spacing={3}
                data-testid="booking-confirmation-details"
              >
                <Grid item xs={12} md={6}>
                  <Stack spacing={1} alignItems="flex-start">
                    <Chip
                      icon={<SchoolIcon fontSize="small" />}
                      label="Kurs"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="h6">{booking.courseTitle}</Typography>
                    {booking.courseDescription ? (
                      <Typography variant="body2" color="text.secondary">
                        {booking.courseDescription}
                      </Typography>
                    ) : null}
                    {booking.courseSlug ? (
                      <Tooltip title="Kursdetails ansehen">
                        <Button
                          component={Link}
                          href={`/courses/${booking.courseSlug}`}
                          size="small"
                          variant="text"
                        >
                          Kursseite öffnen
                        </Button>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={1} alignItems="flex-start">
                    <Chip
                      icon={<EventAvailableIcon fontSize="small" />}
                      label="Termin"
                      color="success"
                      variant="outlined"
                    />
                    <Typography variant="body1">
                      {courseDateLabel ?? "Termin folgt"}
                    </Typography>
                    {timeRangeLabel ? (
                      <Typography variant="body2" color="text.secondary">
                        {timeRangeLabel}
                      </Typography>
                    ) : null}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={1} alignItems="flex-start">
                    <Typography variant="subtitle2" color="text.secondary">
                      Zahlungsstatus
                    </Typography>
                    <Alert
                      severity={statusSeverity}
                      data-testid="payment-status"
                    >
                      {booking.paymentStatusLabel}
                    </Alert>
                    <Typography variant="caption" color="text.secondary">
                      Systemstatus: {booking.paymentStatus}
                    </Typography>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={1} alignItems="flex-start">
                    <Typography variant="subtitle2" color="text.secondary">
                      Betrag
                    </Typography>
                    <Typography variant="h6">
                      {booking.formattedAmount}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                component={Link}
                href="/protected"
                variant="contained"
                startIcon={<SchoolIcon />}
              >
                Kursbereich öffnen
              </Button>
              <Button
                component={Link}
                href="/"
                variant="outlined"
                startIcon={<HomeOutlinedIcon />}
              >
                Zur Startseite
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
