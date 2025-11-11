"use client";

import {
	Error as ErrorIcon,
	Info as InfoIcon,
	Refresh as RefreshIcon,
	CheckCircle as ResolveIcon,
	Warning as WarningIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Container,
	IconButton,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useCallback, useEffect, useState } from "react";

interface ErrorMetrics {
	errorCount: number;
	errorsByCategory: Record<string, number>;
	errorsByCode: Record<string, number>;
	errorsByHour: Record<string, number>;
	topErrors: Array<{
		code: string;
		message: string;
		count: number;
		lastOccurrence: string;
	}>;
}

interface ErrorLogEntry {
	id: string;
	timestamp: string;
	errorCode: string;
	category: string;
	message: string;
	statusCode: number;
	requestId: string;
	context?: Record<string, unknown>;
	resolved: boolean;
}

export default function ErrorDashboard() {
	const [tabValue, setTabValue] = useState(0);
	const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
	const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("day");

	const fetchMetrics = useCallback(async () => {
		try {
			const response = await fetch(
				`/api/admin/errors?action=metrics&timeRange=${timeRange}`,
			);
			const data = await response.json();
			setMetrics(data.metrics);
		} catch (_error) {
			console.warn("Failed to fetch error metrics:", _error);
		}
	}, [timeRange]);
	const fetchLogs = useCallback(async () => {
		try {
			const response = await fetch("/api/admin/errors?action=logs&limit=20");
			const data = await response.json();
			setErrorLogs(data.errors);
		} catch (_error) {
			console.warn("Failed to fetch error logs:", _error);
		}
	}, []);
	const resolveError = async (errorId: string) => {
		try {
			await fetch("/api/admin/errors?action=resolve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ errorId }),
			});

			setErrorLogs((logs) =>
				logs.map((log) =>
					log.id === errorId ? { ...log, resolved: true } : log,
				),
			);
		} catch (_error) {
			console.warn("Failed to resolve error:", _error);
		}
	};
	const refreshData = useCallback(async () => {
		setLoading(true);
		await Promise.all([fetchMetrics(), fetchLogs()]);
		setLoading(false);
	}, [fetchMetrics, fetchLogs]);

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "business":
				return <WarningIcon color="warning" />;
			case "validation":
				return <InfoIcon color="info" />;
			case "auth":
				return <ErrorIcon color="error" />;
			case "infrastructure":
				return <ErrorIcon color="error" />;
			default:
				return <ErrorIcon />;
		}
	};

	const getCategoryColor = (
		category: string,
	): "warning" | "info" | "error" | "default" => {
		switch (category) {
			case "business":
				return "warning";
			case "validation":
				return "info";
			case "auth":
				return "error";
			case "infrastructure":
				return "error";
			default:
				return "default";
		}
	};

	if (loading && !metrics) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="400px"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={4}
			>
				<Typography variant="h4" component="h1">
					Error Dashboard
				</Typography>

				<Box display="flex" gap={2} alignItems="center">
					<Box>
						<Button
							variant={timeRange === "hour" ? "contained" : "outlined"}
							size="small"
							onClick={() => setTimeRange("hour")}
							sx={{ mr: 1 }}
						>
							1 Stunde
						</Button>
						<Button
							variant={timeRange === "day" ? "contained" : "outlined"}
							size="small"
							onClick={() => setTimeRange("day")}
							sx={{ mr: 1 }}
						>
							24 Stunden
						</Button>
						<Button
							variant={timeRange === "week" ? "contained" : "outlined"}
							size="small"
							onClick={() => setTimeRange("week")}
						>
							7 Tage
						</Button>
					</Box>

					<IconButton onClick={refreshData} disabled={loading}>
						<RefreshIcon />
					</IconButton>
				</Box>
			</Box>

			{process.env.NODE_ENV === "development" && (
				<Alert severity="info" sx={{ mb: 3 }}>
					Development Mode: Error data is stored in memory and will be lost on
					restart.
				</Alert>
			)}

			<Tabs
				value={tabValue}
				onChange={(_, value) => setTabValue(value)}
				sx={{ mb: 3 }}
			>
				<Tab label="Übersicht" />
				<Tab label="Fehler-Logs" />
			</Tabs>

			{tabValue === 0 && metrics && (
				<Grid container spacing={3}>
					{/* Error Count */}
					<Grid item xs={12} md={3}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Gesamte Fehler
								</Typography>
								<Typography variant="h3" color="error.main">
									{metrics.errorCount}
								</Typography>
							</CardContent>
						</Card>
					</Grid>

					{/* Error Categories */}
					<Grid item xs={12} md={9}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Fehler nach Kategorie
								</Typography>
								<Box display="flex" gap={1} flexWrap="wrap">
									{Object.entries(metrics.errorsByCategory).map(
										([category, count]) => (
											<Chip
												key={category}
												icon={getCategoryIcon(category)}
												label={`${category}: ${count}`}
												color={getCategoryColor(category)}
												variant="outlined"
											/>
										),
									)}
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* Top Errors */}
					<Grid item xs={12}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Häufigste Fehler
								</Typography>
								<TableContainer>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell>Error Code</TableCell>
												<TableCell>Message</TableCell>
												<TableCell>Count</TableCell>
												<TableCell>Last Occurrence</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{metrics.topErrors.map((error) => (
												<TableRow key={error.code}>
													<TableCell>
														<Chip label={error.code} size="small" />
													</TableCell>
													<TableCell>{error.message}</TableCell>
													<TableCell>{error.count}</TableCell>
													<TableCell>
														{new Date(error.lastOccurrence).toLocaleString(
															"de",
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}

			{tabValue === 1 && (
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Aktuelle Fehler-Logs
						</Typography>
						<TableContainer>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Zeit</TableCell>
										<TableCell>Code</TableCell>
										<TableCell>Kategorie</TableCell>
										<TableCell>Message</TableCell>
										<TableCell>Request ID</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Aktionen</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{errorLogs.map((log) => (
										<TableRow key={log.id}>
											<TableCell>
												{new Date(log.timestamp).toLocaleString("de")}
											</TableCell>
											<TableCell>
												<Chip label={log.errorCode} size="small" />
											</TableCell>
											<TableCell>
												<Chip
													icon={getCategoryIcon(log.category)}
													label={log.category}
													size="small"
													color={getCategoryColor(log.category)}
												/>
											</TableCell>
											<TableCell
												sx={{
													maxWidth: 300,
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{log.message}
											</TableCell>
											<TableCell>
												<Typography
													variant="caption"
													sx={{ fontFamily: "monospace" }}
												>
													{log.requestId}
												</Typography>
											</TableCell>
											<TableCell>
												<Chip
													label={log.resolved ? "Resolved" : "Open"}
													color={log.resolved ? "success" : "default"}
													size="small"
												/>
											</TableCell>
											<TableCell>
												{!log.resolved && (
													<IconButton
														size="small"
														onClick={() => resolveError(log.id)}
														title="Mark as resolved"
													>
														<ResolveIcon />
													</IconButton>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</CardContent>
				</Card>
			)}
		</Container>
	);
}
