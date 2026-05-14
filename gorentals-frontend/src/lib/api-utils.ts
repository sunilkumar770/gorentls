/**
 * Returns a clean API URL by combining the base URL and the endpoint.
 * Handles cases where NEXT_PUBLIC_API_URL might already include '/api'.
 */
export function getApiUrl(endpoint: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If base already ends with /api and endpoint starts with /api, remove one /api
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${base}${cleanEndpoint.substring(4)}`;
  }
  
  return `${base}${cleanEndpoint}`;
}
