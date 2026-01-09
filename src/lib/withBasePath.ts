export function withBasePath(pathname?: string | URL): string | undefined {
	if (!pathname) return undefined;

	const base = import.meta.env.BASE_URL;

	const path = pathname instanceof URL ? pathname.pathname : pathname;

	if (!path.startsWith("/")) return path;

	return `${base}${path}`;
}
