/**
 * Deployment Monitoring API
 * Stellt Health-Check-Endpunkt und Deployment-Status bereit
 */

import { type NextRequest, NextResponse } from "next/server";
import { deploymentMonitor } from "@/lib/monitoring/deployment-monitor";
import { ApiLogger } from "@/lib/utils/api-logger";
import { createRequestContextFromNextRequest } from "@/lib/utils/request-id";

export async function GET(request: NextRequest) {
	const context = createRequestContextFromNextRequest(request);
	const logger = new ApiLogger(context);

	try {
		logger.info("Deployment health check initiated");

		// Health-Checks durchführen
		const healthStatus = await deploymentMonitor.performHealthChecks();
		const deploymentStatus = deploymentMonitor.getDeploymentStatus();

		// Response erstellen
		const response = {
			timestamp: new Date().toISOString(),
			requestId: context.id,
			deployment: deploymentStatus,
			services: healthStatus,
			summary: {
				overallStatus: deploymentStatus.status,
				totalChecks: Object.keys(healthStatus).length,
				passedChecks: Object.values(healthStatus).filter(
					(check) => check.status === "pass",
				).length,
				failedChecks: Object.values(healthStatus).filter(
					(check) => check.status === "fail",
				).length,
				warningChecks: Object.values(healthStatus).filter(
					(check) => check.status === "warn",
				).length,
			},
		};

		logger.info("Health check completed", {
			status: deploymentStatus.status,
			summary: response.summary,
		});

		// HTTP-Status basierend auf Health-Status
		const httpStatus =
			deploymentStatus.status === "healthy"
				? 200
				: deploymentStatus.status === "degraded"
					? 206
					: 503;

		return NextResponse.json(response, {
			status: httpStatus,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"X-Request-ID": context.id,
				"X-Deployment-Status": deploymentStatus.status,
			},
		});
	} catch (error) {
		logger.error(
			"Health check failed",
			error instanceof Error ? error : new Error("Unknown error"),
		);

		return NextResponse.json(
			{
				timestamp: new Date().toISOString(),
				requestId: context.id,
				error: "Health check failed",
				details: error instanceof Error ? error.message : "Unknown error",
				deployment: {
					status: "unhealthy",
					version: process.env.npm_package_version || "1.0.0",
					region: process.env.VERCEL_REGION || "local",
				},
			},
			{
				status: 503,
				headers: {
					"X-Request-ID": context.id,
					"X-Deployment-Status": "unhealthy",
				},
			},
		);
	}
}

export async function POST(request: NextRequest) {
	const context = createRequestContextFromNextRequest(request);
	const logger = new ApiLogger(context);

	try {
		const body = await request.json();
		const { action } = body;

		logger.info("Deployment action requested", { action });

		switch (action) {
			case "start_monitoring": {
				const intervalMinutes = body.intervalMinutes || 5;
				deploymentMonitor.startContinuousMonitoring(intervalMinutes);

				return NextResponse.json({
					message: "Continuous monitoring started",
					interval: `${intervalMinutes} minutes`,
					requestId: context.id,
				});
			}

			case "force_check": {
				const healthStatus = await deploymentMonitor.performHealthChecks();
				const deploymentStatus = deploymentMonitor.getDeploymentStatus();

				return NextResponse.json({
					message: "Health check forced",
					deployment: deploymentStatus,
					services: healthStatus,
					requestId: context.id,
				});
			}

			default:
				logger.warn("Invalid deployment action", { action });
				return NextResponse.json(
					{ error: "Invalid action", requestId: context.id },
					{ status: 400 },
				);
		}
	} catch (error) {
		logger.error(
			"Deployment action failed",
			error instanceof Error ? error : new Error("Unknown error"),
		);

		return NextResponse.json(
			{
				error: "Deployment action failed",
				details: error instanceof Error ? error.message : "Unknown error",
				requestId: context.id,
			},
			{ status: 500 },
		);
	}
}
