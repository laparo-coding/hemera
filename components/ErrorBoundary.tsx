"use client";

import { ErrorOutline } from "@mui/icons-material";
import { Box, Button, Container, Typography } from "@mui/material";
import React from "react";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error to your error reporting service
		// Error Boundary caught an error

		this.setState({
			error,
			errorInfo,
		});

		// Report to Rollbar following official Next.js documentation pattern
		if (typeof window !== "undefined") {
			// Client-side: Import Rollbar and report error
			import("rollbar").then((Rollbar) => {
				import("@/lib/monitoring/rollbar-official").then(({ clientConfig }) => {
					const rollbar = new Rollbar.default(clientConfig);
					rollbar.error(error, { componentStack: errorInfo.componentStack });
				});
			});
		}
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			const { fallback: Fallback } = this.props;

			if (Fallback && this.state.error) {
				return (
					<Fallback error={this.state.error} resetError={this.resetError} />
				);
			}

			return (
				<Container maxWidth="md" sx={{ py: 8 }}>
					<Box
						display="flex"
						flexDirection="column"
						alignItems="center"
						textAlign="center"
						gap={3}
					>
						<ErrorOutline sx={{ fontSize: 64, color: "error.main" }} />

						<Typography variant="h4" component="h1" gutterBottom>
							Ein Fehler ist aufgetreten
						</Typography>

						<Typography variant="body1" color="text.secondary" maxWidth="sm">
							Beim Laden der Seite ist ein Problem aufgetreten. Bitte versuche
							es erneut.
						</Typography>

						{process.env.NODE_ENV === "development" && this.state.error && (
							<Box
								sx={{
									mt: 2,
									p: 2,
									bgcolor: "grey.100",
									borderRadius: 1,
									maxWidth: "100%",
									overflow: "auto",
								}}
							>
								<Typography
									variant="caption"
									component="pre"
									sx={{ whiteSpace: "pre-wrap" }}
								>
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</Typography>
							</Box>
						)}

						<Box display="flex" gap={2} mt={2}>
							<Button variant="contained" onClick={this.resetError}>
								Erneut versuchen
							</Button>

							<Button
								variant="outlined"
								onClick={() => {
									window.location.href = "/";
								}}
							>
								Zur Startseite
							</Button>
						</Box>
					</Box>
				</Container>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
