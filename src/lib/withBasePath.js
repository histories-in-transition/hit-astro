export function withBasePath(pathname) {
  const base = import.meta.env.BASE_URL;
  if (!pathname.startsWith("/")) return pathname;
  return `${base}${pathname}`;
}
