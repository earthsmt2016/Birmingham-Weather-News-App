const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`API paths must start with "/": ${path}`);
  }

  return `${apiBaseUrl}${path}`;
}
