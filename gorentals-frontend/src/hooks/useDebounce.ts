import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` milliseconds of silence.
 *
 * Use case: admin search bars — prevents an API call on every keystroke.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 350);
 * useEffect(() => { fetchUsers(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
