#!/usr/bin/env node
/**
 * Vercel Guard
 * - Verifiziert projektweite Einstellungen gegen Team-Policy:
 *   1) Production Branch sollte "main" sein
 *   2) Keine letzten Deployments mit source = "git" (nur CLI‑Deploys erlaubt)
 *
 * Benötigte ENV:
 * - VERCEL_TOKEN        (GitHub Secret)
 * - VERCEL_ORG_ID       (GitHub Secret)
 * - VERCEL_PROJECT_ID   (GitHub Secret)
 */

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !teamId || !projectId) {
	console.error(
		"❌ vercel-guard: Missing required env (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)",
	);
	process.exit(2);
}

const API = "https://api.vercel.com";

async function getJson(url) {
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`HTTP ${res.status} for ${url}: ${body}`);
	}
	return res.json();
}

async function getProject() {
	// v9 projects endpoint
	const url = `${API}/v9/projects/${projectId}?teamId=${encodeURIComponent(teamId)}`;
	return getJson(url);
}

async function getRecentDeployments(limit = 20) {
	// v6 deployments endpoint supports projectId & teamId
	const url = `${API}/v6/deployments?projectId=${encodeURIComponent(projectId)}&teamId=${encodeURIComponent(teamId)}&limit=${limit}`;
	return getJson(url);
}

function pickProductionBranch(project) {
	// Try common shapes seen in Vercel API; be defensive
	const link = project.link || project.gitRepository || {};
	const branch =
		link.productionBranch ||
		project.productionBranch ||
		link.branch ||
		link.defaultBranch;
	return branch || null;
}

(async () => {
	try {
		console.log(
			"🔎 vercel-guard: Checking Vercel project and recent deployments…",
		);

		const project = await getProject();
		const deployments = await getRecentDeployments(25);

		const violations = [];

		// 1) Production branch policy
		const prodBranch = pickProductionBranch(project);
		if (prodBranch && prodBranch !== "main") {
			violations.push(
				`Production branch is "${prodBranch}" but policy requires "main" (project: ${project.name || projectId})`,
			);
		} else if (!prodBranch) {
			console.warn(
				"⚠️  Could not determine production branch from project; skipping branch check.",
			);
		} else {
			console.log(`✅ Production branch OK: ${prodBranch}`);
		}

		// 2) Disallow git-sourced deployments (we want CLI-only via GitHub Actions)
		const list = Array.isArray(deployments.deployments)
			? deployments.deployments
			: deployments;
		const bySource = list.reduce((acc, d) => {
			const s = d.source || "unknown";
			acc[s] = (acc[s] || 0) + 1;
			return acc;
		}, {});

		console.log("📦 Recent deployments by source:", bySource);

		const gitGraceHours = Number(
			process.env.VERCEL_GUARD_GIT_GRACE_HOURS || "24",
		);
		const gitGraceMs = gitGraceHours * 60 * 60 * 1000;
		const now = Date.now();
		const enforceAfterRaw = process.env.VERCEL_GUARD_GIT_ENFORCE_AFTER;
		const enforceAfterTs = enforceAfterRaw ? Date.parse(enforceAfterRaw) : NaN;
		if (enforceAfterRaw && !Number.isFinite(enforceAfterTs)) {
			console.warn(
				`⚠️  vercel-guard: could not parse VERCEL_GUARD_GIT_ENFORCE_AFTER="${enforceAfterRaw}". Falling back to grace window.`,
			);
		}
		const gitDeployments = list.filter(
			(d) => (d.source || "unknown") === "git",
		);
		const recentGitDeployments = gitDeployments.filter((d) => {
			const createdValue =
				typeof d.createdAt === "number"
					? d.createdAt
					: typeof d.createdAt === "string"
						? Date.parse(d.createdAt)
						: typeof d.created === "number"
							? d.created
							: typeof d.created === "string"
								? Date.parse(d.created)
								: NaN;
			if (Number.isFinite(enforceAfterTs)) {
				if (!Number.isFinite(createdValue)) return true;
				return createdValue >= enforceAfterTs;
			}
			if (!Number.isFinite(createdValue)) return true; // If we cannot determine age, treat as recent.
			return now - createdValue <= gitGraceMs;
		});

		if (recentGitDeployments.length > 0) {
			const violationMessage = Number.isFinite(enforceAfterTs)
				? `Found ${recentGitDeployments.length} git-sourced deployment(s) newer than enforcement timestamp ${new Date(enforceAfterTs).toISOString()}. Policy requires CLI-only deployments via GitHub Actions.`
				: `Found ${recentGitDeployments.length} git-sourced deployment(s) within the last ${gitGraceHours}h. Policy requires CLI-only deployments via GitHub Actions.`;
			violations.push(violationMessage);
		} else if (gitDeployments.length > 0) {
			console.log(
				Number.isFinite(enforceAfterTs)
					? `ℹ️ Detected ${gitDeployments.length} git-sourced deployment(s) prior to enforcement timestamp ${new Date(enforceAfterTs).toISOString()}. Marking as informational only.`
					: `ℹ️ Detected ${gitDeployments.length} historical git-sourced deployment(s) outside the ${gitGraceHours}h window. Marking as informational only.`,
			);
		}

		if (violations.length > 0) {
			console.error("\n❌ Vercel guard violations:");
			for (const v of violations) console.error(` - ${v}`);
			process.exit(1);
		} else {
			console.log("\n✅ vercel-guard passed: No policy violations detected.");
			process.exit(0);
		}
	} catch (err) {
		console.error("❌ vercel-guard error:", err.message || err);
		process.exit(2);
	}
})();
