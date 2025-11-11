"use client";

import { AttachMoneyOutlined, SchoolOutlined } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	FormControlLabel,
	Radio,
	RadioGroup,
	Stack,
	Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CourseWithSEO } from "@/lib/api/courses";

interface BookingFormProps {
	courses: CourseWithSEO[];
	userId: string;
	selectedCourseId?: string;
}

export default function BookingForm({
	courses,
	userId: _userId,
	selectedCourseId,
}: BookingFormProps) {
	const router = useRouter();
	const [selectedCourse, setSelectedCourse] = useState<string>(
		selectedCourseId || "",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleCourseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedCourse(event.target.value);
		setError(null);
		setSuccess(null);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!selectedCourse) {
			setError("Please select a course");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/bookings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					courseId: selectedCourse,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create booking");
			}

			setSuccess("Booking created successfully!");

			// Redirect to bookings page after a short delay
			setTimeout(() => {
				router.push("/bookings?message=booking-created");
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	const selectedCourseData = courses.find(
		(course) => course.id === selectedCourse,
	);

	return (
		<Box component="form" onSubmit={handleSubmit}>
			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 3 }}>
					{success}
				</Alert>
			)}

			<Typography variant="h6" gutterBottom>
				Select a Course
			</Typography>

			<RadioGroup
				value={selectedCourse}
				onChange={handleCourseChange}
				name="course-selection"
			>
				<Stack spacing={2}>
					{courses.map((course) => (
						<Card
							key={course.id}
							variant="outlined"
							sx={{
								cursor: "pointer",
								transition: "all 0.2s",
								"&:hover": {
									borderColor: "primary.main",
									bgcolor: "action.hover",
								},
								...(selectedCourse === course.id && {
									borderColor: "primary.main",
									bgcolor: "primary.50",
								}),
							}}
							onClick={() => setSelectedCourse(course.id)}
						>
							<CardContent>
								<FormControlLabel
									value={course.id}
									control={<Radio />}
									label={
										<Box sx={{ width: "100%" }}>
											<Stack
												direction="row"
												spacing={2}
												alignItems="flex-start"
											>
												<SchoolOutlined color="primary" />
												<Box sx={{ flex: 1 }}>
													<Typography variant="h6" gutterBottom>
														{course.title}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														paragraph
														sx={{ mb: 2 }}
													>
														{course.description || "No description available"}
													</Typography>

													<Stack
														direction="row"
														spacing={2}
														alignItems="center"
													>
														{course.price && (
															<Stack
																direction="row"
																spacing={0.5}
																alignItems="center"
															>
																<AttachMoneyOutlined
																	fontSize="small"
																	color="primary"
																/>
																<Typography variant="h6" color="primary">
																	€{(Number(course.price) / 100).toFixed(2)}
																</Typography>
															</Stack>
														)}
														<Chip
															label="Available"
															color="success"
															size="small"
														/>
													</Stack>
												</Box>
											</Stack>
										</Box>
									}
									sx={{
										margin: 0,
										width: "100%",
										"& .MuiFormControlLabel-label": {
											width: "100%",
										},
									}}
								/>
							</CardContent>
						</Card>
					))}
				</Stack>
			</RadioGroup>

			{selectedCourseData && (
				<Card sx={{ mt: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Booking Summary
						</Typography>
						<Divider sx={{ mb: 2 }} />

						<Stack spacing={2}>
							<Box>
								<Typography variant="subtitle2" color="text.secondary">
									Course
								</Typography>
								<Typography variant="body1">
									{selectedCourseData.title}
								</Typography>
							</Box>

							{selectedCourseData.price && (
								<Box>
									<Typography variant="subtitle2" color="text.secondary">
										Price
									</Typography>
									<Typography variant="h6" color="primary">
										€{(Number(selectedCourseData.price) / 100).toFixed(2)}
									</Typography>
								</Box>
							)}

							<Box>
								<Typography variant="subtitle2" color="text.secondary">
									Status
								</Typography>
								<Chip label="Pending Review" color="warning" size="small" />
							</Box>
						</Stack>
					</CardContent>
				</Card>
			)}

			<Box sx={{ mt: 4, textAlign: "right" }}>
				<Button
					type="submit"
					variant="contained"
					size="large"
					disabled={!selectedCourse || isSubmitting}
					startIcon={
						isSubmitting ? <CircularProgress size={20} /> : <SchoolOutlined />
					}
				>
					{isSubmitting ? "Creating Booking..." : "Book Course"}
				</Button>
			</Box>
		</Box>
	);
}
