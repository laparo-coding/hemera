/**
 * Rollbar React Provider following official Next.js documentation
 * https://docs.rollbar.com/docs/nextjs
 */

"use client";

import { Provider as RollbarProvider } from "@rollbar/react";
import type React from "react";
import { clientConfig } from "./rollbar-official";

interface RollbarProviderWrapperProps {
	children: React.ReactNode;
}

export function RollbarProviderWrapper({
	children,
}: RollbarProviderWrapperProps) {
	if (
		process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === "1" ||
		process.env.E2E_TEST === "true"
	) {
		return <>{children}</>; // Disable rollbar during E2E
	}
	return <RollbarProvider config={clientConfig}>{children}</RollbarProvider>;
}
