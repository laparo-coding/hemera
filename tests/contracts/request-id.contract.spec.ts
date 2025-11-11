import { describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET as healthGet } from "@/app/api/health/route";

describe("Contract: Request-ID propagation and response headers", () => {
	it("returns a canonical X-Request-ID header that is NOT the inbound x-request-id", async () => {
		const inboundId = "incoming-req-12345";
		const url = "http://localhost/api/health";
		const req = new NextRequest(url, {
			method: "GET",
			headers: {
				"x-request-id": inboundId,
			},
		});

		const res = await healthGet(req);
		const canonicalId = res.headers.get("X-Request-ID");
		expect(canonicalId).toBeTruthy();
		expect(canonicalId).not.toEqual(inboundId);

		const body = await res.json();
		expect(body?.meta?.requestId).toEqual(canonicalId);
	});
});
