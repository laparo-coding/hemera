// Utility to expose build/version information at runtime (server-side)
// Tries environment variables first (for Vercel/GitHub), then falls back to package.json.

// Importing JSON works with TypeScript's resolveJsonModule and Next.js bundling
import pkgJson from "../package.json";

export type BuildInfo = {
	version: string;
	commitSha?: string;
	shortSha?: string;
	environment: string;
	buildTime?: string;
};

function getCommitSha(): string | undefined {
	// Prefer explicit public env first (useful for non-Vercel hosts)
	const explicit = process.env.NEXT_PUBLIC_GIT_SHA || process.env.GIT_SHA;
	if (explicit && explicit.trim().length > 0) return explicit.trim();

	// Vercel provides this during build/runtime
	const vercel = process.env.VERCEL_GIT_COMMIT_SHA;
	if (vercel && vercel.trim().length > 0) return vercel.trim();

	// GitHub Actions / general CI
	const gha = process.env.GITHUB_SHA;
	if (gha && gha.trim().length > 0) return gha.trim();

	return undefined;
}

export function getBuildInfo(): BuildInfo {
	const pkg = (pkgJson as { version?: string }) || {};
	const version = pkg.version || process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
	const commitSha = getCommitSha();
	const shortSha = commitSha ? commitSha.substring(0, 7) : undefined;
	const environment =
		process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
	const buildTime = process.env.BUILD_TIME;

	return {
		version,
		commitSha,
		shortSha,
		environment,
		buildTime,
	};
}
