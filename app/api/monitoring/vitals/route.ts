/**
 * Receives Web Vitals metrics from the client and forwards them to monitoring sinks.
 * Metrics are accepted only as JSON POST requests to keep the surface minimal.
 */

import type { NextRequest } from "next/server";
import { isTelemetryConsentGranted } from "@/lib/monitoring/privacy";
import { createApiLogger } from "@/lib/utils/api-logger";
import {
	createErrorResponse,
	createSuccessResponse,
	ErrorCodes,
} from "@/lib/utils/api-response";
import {
	createRequestContextFromNextRequest,
	getOrCreateRequestId,
} from "@/lib/utils/request-id";

interface IncomingWebVitalPayload {
	name?: unknown;
	value?: unknown;
	id?: unknown;
	label?: unknown;
	path?: unknown;
	href?: unknown;
	navigationType?: unknown;
}

function sanitizePayload(payload: IncomingWebVitalPayload) {
	const metricName =
		typeof payload.name === "string" ? payload.name : undefined;
	const metricValue =
		typeof payload.value === "number" ? payload.value : undefined;

	if (
		!metricName ||
		typeof metricValue !== "number" ||
		!Number.isFinite(metricValue)
	) {
		return undefined;
	}

	return {
		name: metricName,
		value: metricValue,
		id: typeof payload.id === "string" ? payload.id : undefined,
		label: typeof payload.label === "string" ? payload.label : undefined,
		path: typeof payload.path === "string" ? payload.path : undefined,
		href: typeof payload.href === "string" ? payload.href : undefined,
		navigationType:
			typeof payload.navigationType === "string"
				? payload.navigationType
				: undefined,
	} as const;
}

export async function POST(request: NextRequest) {
	const _requestId = getOrCreateRequestId(request);
	const context = createRequestContextFromNextRequest(request, _requestId);
	const logger = createApiLogger(context);

	if (!request.headers.get("content-type")?.includes("application/json")) {
		logger.warn("Rejected web vitals payload without JSON content type");
		logger.trackRequestCompletion(415);
		return createErrorResponse(
			"Unsupported Media Type. Expected application/json payload.",
			ErrorCodes.INVALID_INPUT,
			_requestId,
			415,
		);
	}

	let rawPayload: IncomingWebVitalPayload;

	try {
		rawPayload = (await request.json()) as IncomingWebVitalPayload;
	} catch (error) {
		logger.warn("Failed to parse web vitals payload", { error });
		logger.trackRequestCompletion(400);
		return createErrorResponse(
			"Invalid JSON payload.",
			ErrorCodes.INVALID_INPUT,
			_requestId,
			400,
		);
	}

	const metric = sanitizePayload(rawPayload);

	if (!metric) {
		logger.warn("Rejected web vitals payload due to missing name/value");
		logger.trackRequestCompletion(400);
		return createErrorResponse(
			"Metric name and value are required.",
			ErrorCodes.INVALID_INPUT,
			_requestId,
			400,
		);
	}

	const telemetryAllowed = isTelemetryConsentGranted();
	const sanitizedMetric = {
		...metric,
		href: telemetryAllowed ? metric.href : undefined,
	} as const;

	const eventData = {
		...sanitizedMetric,
		consentGranted: telemetryAllowed,
		source: "web-vitals",
	} as const;

	logger.info("Accepted web vitals metric", {
		name: metric.name,
		value: metric.value,
		path: metric.path,
		label: metric.label,
	});

	logger.trackBusinessEvent("web_vitals_metric", {
		metric: metric.name,
		value: metric.value,
		path: metric.path,
		label: metric.label,
		navigationType: metric.navigationType,
	});

	logger.trackRequestCompletion(202);

	return createSuccessResponse(
		{ accepted: true, event: eventData },
		_requestId,
		202,
	);
}

export function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			Allow: "OPTIONS, POST",
		},
	});
}
