"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
	AppBar,
	Box,
	Button,
	Container,
	Toolbar,
	Typography,
} from "@mui/material";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";

/**
 * Public navigation component for non-protected pages
 * Shows login/signup buttons for unauthenticated users
 * Shows user menu for authenticated users
 */
export function PublicNavigation({
	hideMyCourses = false,
}: {
	hideMyCourses?: boolean;
}) {
	// Check if Clerk is configured AND not disabled for E2E
	const isClerkConfigured = Boolean(
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
	);
	const isE2E =
		process.env.E2E_TEST === "true" ||
		process.env.NEXT_PUBLIC_DISABLE_CLERK === "1";
	const useClerk = isClerkConfigured && !isE2E;

	// In E2E mode, pick up mocked role from localStorage (set by tests/auth-helper)
	const [e2eRole, setE2eRole] = useState<"user" | "admin" | "unknown">("user");
	useLayoutEffect(() => {
		if (!isE2E) return;
		const readRole = () => {
			try {
				const raw = window.localStorage.getItem("clerk-session");
				if (raw) {
					const parsed = JSON.parse(raw);
					const role = (parsed?.user?.role as string) || "user";
					setE2eRole(
						role === "admin" ? "admin" : role === "user" ? "user" : "unknown",
					);
					return;
				}
			} catch {
				// ignore
			}
			setE2eRole("user");
		};
		// initial read pre-paint
		readRole();
		// subscribe to storage events so role changes reflect without reload
		const onStorage = (e: StorageEvent) => {
			if (e.key === "clerk-session") readRole();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [isE2E]);
	return (
		<AppBar
			position="fixed"
			color="default"
			elevation={1}
			sx={{ zIndex: 1100 }}
		>
			<Container maxWidth="lg">
				<Toolbar sx={{ py: 1 }}>
					{/* Logo/Brand */}
					<Link href="/" style={{ textDecoration: "none" }}>
						<Typography
							variant="h5"
							component="div"
							sx={{
								fontWeight: "bold",
								color: "primary.main",
								cursor: "pointer",
							}}
						>
							Hemera Academy
						</Typography>
					</Link>

					{/* Spacer */}
					<Box sx={{ flexGrow: 1 }} />

					{/* Navigation Links */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						{/* Primary nav links (always available) */}
						<Button
							variant="text"
							color="inherit"
							component={Link}
							href="/dashboard"
							data-testid="nav-dashboard"
							sx={{ textTransform: "none" }}
						>
							Dashboard
						</Button>
						{!hideMyCourses && (
							<Button
								variant="text"
								color="inherit"
								component={Link}
								href="/courses"
								data-testid="nav-courses"
								sx={{ textTransform: "none" }}
							>
								Kurse
							</Button>
						)}
						{/* Admin link visible in E2E mode when mocked as admin */}
						{isE2E && e2eRole === "admin" && (
							<Button
								variant="text"
								color="inherit"
								component={Link}
								href="/admin"
								data-testid="nav-admin"
								sx={{ textTransform: "none" }}
							>
								Admin
							</Button>
						)}
						{/* Authentication Buttons */}
						{useClerk ? (
							<>
								<SignedOut>
									<Button
										variant="outlined"
										color="primary"
										component={Link}
										href="/sign-in"
										data-testid="nav-login-button"
										sx={{
											textTransform: "none",
											px: 3,
										}}
									>
										Anmelden
									</Button>
									<Button
										variant="contained"
										color="primary"
										component={Link}
										href="/sign-up"
										data-testid="nav-signup-button"
										sx={{
											textTransform: "none",
											px: 3,
										}}
									>
										Registrieren
									</Button>
								</SignedOut>

								{/* User Menu for Authenticated Users */}
								<SignedIn>
									{!hideMyCourses && (
										<Button
											variant="text"
											color="inherit"
											component={Link}
											href="/dashboard"
											sx={{
												textTransform: "none",
												mr: 1,
											}}
										>
											Meine Kurse
										</Button>
									)}
									<UserButton
										afterSignOutUrl="/"
										appearance={{
											elements: {
												avatarBox: {
													width: "32px",
													height: "32px",
												},
											},
										}}
										showName={false}
										data-testid="user-profile-button"
									/>
								</SignedIn>
							</>
						) : (
							/* Fallback buttons when Clerk is not configured or E2E */
							<>
								<Button
									variant="outlined"
									color="primary"
									component={Link}
									href="/sign-in"
									data-testid="nav-login-button"
									sx={{
										textTransform: "none",
										px: 3,
									}}
								>
									Anmelden
								</Button>
								<Button
									variant="contained"
									color="primary"
									component={Link}
									href="/sign-up"
									data-testid="nav-signup-button"
									sx={{
										textTransform: "none",
										px: 3,
									}}
								>
									Registrieren
								</Button>
							</>
						)}

						{/* Role indicator for tests in E2E mode */}
						{isE2E && (
							<span style={{ display: "none" }} data-testid="user-role">
								{e2eRole === "unknown" ? "user" : e2eRole}
							</span>
						)}
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
}
