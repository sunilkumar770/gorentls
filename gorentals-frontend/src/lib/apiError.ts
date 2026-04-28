/**
 * Centralized API error handler to parse and normalize errors
 * from Axios or other network failures.
 */
export function handleApiError(err: unknown): string {
  if (typeof err === 'string') return err;
  
  if (err && typeof err === 'object') {
    const e = err as any;
    
    // Check for Axios response errors
    if (e.response?.data) {
      const data = e.response.data;
      
      // Handle various backend error shapes
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    
    // Fallback to standard Error message
    if (e.message) return e.message;
  }
  
  return 'An unexpected error occurred';
}
