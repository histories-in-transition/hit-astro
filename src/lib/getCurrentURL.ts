export function insertCurrentURL(selector: string = "#pathname-placeholder"): void {
	if (typeof window === "undefined") return;

	const fullUrl: string = window.location.href;

	const placeholder = document.querySelector<HTMLElement>(selector);
	if (!placeholder) return;

	placeholder.textContent = fullUrl;
}
