declare module "web-vitals" {
	export interface Metric {
		name: "CLS" | "FCP" | "LCP" | "INP" | "TTFB" | "FID";
		value: number;
		id: string;
		delta: number;
		entries: PerformanceEntry[];
		navigationType: "navigate" | "reload" | "back-forward" | "prerender";
	}

	export function onCLS(cb: (metric: Metric) => void): void;
	export function onFCP(cb: (metric: Metric) => void): void;
	export function onLCP(cb: (metric: Metric) => void): void;
	export function onINP(cb: (metric: Metric) => void): void;
	export function onTTFB(cb: (metric: Metric) => void): void;
}
