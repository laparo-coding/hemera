import { getBuildInfo } from "@/lib/buildInfo";

// This component renders a tiny build/version indicator.
// It's intentionally minimal and hidden from assistive tech by default.
export default function BuildInfo() {
	// We compute on render; values are static for a given build
	const info = getBuildInfo();
	const label = [
		`v${info.version}`,
		info.shortSha ? `(${info.shortSha})` : undefined,
		info.environment ? `· ${info.environment}` : undefined,
	]
		.filter(Boolean)
		.join(" ");

	const tooltipParts = [
		// Always include a Build entry so tooling/tests see an explicit build marker
		`Build: ${info.buildTime ?? "unbekannt"}`,
	];

	if (info.commitSha) {
		tooltipParts.push(`Commit: ${info.commitSha}`);
	}

	const tooltip = tooltipParts.join(" | ");

	return (
		<div
			aria-hidden
			data-testid="build-info"
			title={tooltip || "Build-Informationen"}
			style={{
				position: "fixed",
				right: 8,
				bottom: 6,
				opacity: 0.75,
				fontSize: 11,
				padding: "2px 6px",
				borderRadius: 4,
				background: "rgba(0,0,0,0.04)",
				zIndex: 2147483647, // ensure visible above other fixed elements
				pointerEvents: "none", // never block user interactions
			}}
		>
			{label}
		</div>
	);
}
