/**
 * Auth Providers API route
 * Returns available authentication providers for the application
 */

import type { NextRequest } from "next/server";
import { createApiLogger } from "@/lib/utils/api-logger";
import { createSuccessResponse } from "@/lib/utils/api-response";
import {
  createRequestContext,
  getOrCreateRequestId,
} from "@/lib/utils/request-id";

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, "GET", "/api/auth/providers");
  const logger = createApiLogger(context);

  try {
    logger.info("Fetching authentication providers");

    // Define the available auth providers as expected by the contract
    const providers = ["google", "github", "microsoft", "apple", "credentials"];

    logger.info("Successfully fetched authentication providers", {
      providerCount: providers.length,
    });

    return createSuccessResponse(
      {
        providers,
        count: providers.length,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to fetch authentication providers", error as Error);
    throw error;
  }
}
