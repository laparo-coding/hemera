"use client";

import { ErrorOutline, Refresh } from "@mui/icons-material";
import { Box, Button, Container, Typography } from "@mui/material";
import { useRollbar } from "@rollbar/react";
import React from "react";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	const rollbar = useRollbar();

	React.useEffect(() => {
		// Log the global error

		// Report critical error to Rollbar
		rollbar.critical(error, {
			level: "critical",
			context: "global-error-boundary",
			fingerprint: `global-error-${error.name}`,
		});
	}, [error, rollbar]);

	return (
		<html lang="de">
			<body>
				<Container maxWidth="md" sx={{ py: 8 }}>
					<Box
						display="flex"
						flexDirection="column"
						alignItems="center"
						textAlign="center"
						gap={3}
					>
						<ErrorOutline sx={{ fontSize: 72, color: "error.main" }} />

						<Typography variant="h4" component="h1" gutterBottom>
							Etwas ist schief gelaufen
						</Typography>

						<Typography variant="body1" color="text.secondary" paragraph>
							Ein unerwarteter Fehler ist aufgetreten. Wir wurden automatisch
							benachrichtigt.
						</Typography>

						{process.env.NODE_ENV === "development" && (
							<Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
								<Typography
									variant="body2"
									component="pre"
									sx={{ fontFamily: "monospace" }}
								>
									{error.message}
								</Typography>
							</Box>
						)}

						<Button
							variant="contained"
							startIcon={<Refresh />}
							onClick={reset}
							size="large"
						>
							Seite neu laden
						</Button>
					</Box>
				</Container>
			</body>
		</html>
	);
}
