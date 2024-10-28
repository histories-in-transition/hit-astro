export function withBasePath(pathname) {
  const base = import.meta.env.VITE_BASE_PATH;
  if (!pathname.startsWith("/")) return pathname;
  else return `${base}${pathname}`;
}
