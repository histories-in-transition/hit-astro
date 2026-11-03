/**
 * Escapes characters with a special meaning in XML.
 * This is what Eta's `<%= %>` did automatically.
 */
export function esc(value: string | number | null | undefined): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
/** Joins non-empty strings with newlines (empty strings are dropped). */
export function lines(...parts: string[]): string {
	return parts.filter(Boolean).join("\n");
}
