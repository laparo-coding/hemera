import {
	CalendarTodayOutlined,
	MoreVertOutlined,
	SchoolOutlined,
} from "@mui/icons-material";
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemSecondaryAction,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import type { Metadata } from "next";
import Link from "next/link";
import {
	formatBookingStatus,
	getBookingStatusColor,
	getUserBookingStats,
	getUserBookings,
} from "@/lib/api/bookings";
import { requireAuthenticatedUser } from "@/lib/auth/helpers";

export const metadata: Metadata = {
	title: "My Bookings - Hemera Academy",
	description: "View and manage your course bookings",
	robots: "noindex,nofollow",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BookingsPage() {
	const user = await requireAuthenticatedUser();
	const [bookings, stats] = await Promise.all([
		getUserBookings(user.id),
		getUserBookingStats(user.id),
	]);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				My Bookings
			</Typography>
			<Typography variant="body1" color="text.secondary" paragraph>
				View and manage your course bookings and enrollment status.
			</Typography>

			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h3" color="primary">
								{stats.total}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Total Bookings
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h3" color="warning.main">
								{stats.pending}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Pending
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h3" color="success.main">
								{stats.confirmed}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Confirmed
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent sx={{ textAlign: "center" }}>
							<Typography variant="h3" color="error.main">
								{stats.cancelled}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Cancelled
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Card>
				<CardContent>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
						sx={{ mb: 2 }}
					>
						<Typography variant="h6">Course Bookings</Typography>
						<Button
							component={Link}
							href="/courses"
							variant="outlined"
							startIcon={<SchoolOutlined />}
						>
							Browse Courses
						</Button>
					</Stack>

					{bookings.length === 0 ? (
						<Box sx={{ textAlign: "center", py: 6 }}>
							<SchoolOutlined
								sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
							/>
							<Typography variant="h6" color="text.secondary" gutterBottom>
								No bookings yet
							</Typography>
							<Typography variant="body2" color="text.secondary" paragraph>
								Start by exploring our course catalog and book your first
								course.
							</Typography>
							<Button
								component={Link}
								href="/courses"
								variant="contained"
								size="large"
							>
								Browse Courses
							</Button>
						</Box>
					) : (
						<List>
							{bookings.map((booking) => (
								<ListItem
									key={booking.id}
									sx={{
										border: "1px solid",
										borderColor: "divider",
										borderRadius: 1,
										mb: 1,
										"&:last-child": { mb: 0 },
									}}
								>
									<ListItemAvatar>
										<Avatar sx={{ bgcolor: "primary.main" }}>
											<SchoolOutlined />
										</Avatar>
									</ListItemAvatar>
									<ListItemText
										primary={
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography variant="subtitle1" component="span">
													{booking.course.title}
												</Typography>
												<Chip
													label={formatBookingStatus(booking.paymentStatus)}
													color={getBookingStatusColor(booking.paymentStatus)}
													size="small"
												/>
											</Stack>
										}
										secondary={
											<Stack spacing={0.5} sx={{ mt: 1 }}>
												<Typography variant="body2" color="text.secondary">
													{booking.course.description ||
														"No description available"}
												</Typography>
												<Stack direction="row" spacing={2}>
													<Stack
														direction="row"
														spacing={0.5}
														alignItems="center"
													>
														<CalendarTodayOutlined fontSize="small" />
														<Typography variant="caption">
															Booked:{" "}
															{new Date(booking.createdAt).toLocaleDateString()}
														</Typography>
													</Stack>
													{booking.course.price && (
														<Typography variant="caption" color="primary">
															€{(booking.course.price / 100).toFixed(2)}
														</Typography>
													)}
												</Stack>
											</Stack>
										}
									/>
									<ListItemSecondaryAction>
										<IconButton edge="end" aria-label="options">
											<MoreVertOutlined />
										</IconButton>
									</ListItemSecondaryAction>
								</ListItem>
							))}
						</List>
					)}
				</CardContent>
			</Card>
		</Box>
	);
}
