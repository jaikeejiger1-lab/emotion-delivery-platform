/**
 * useDebounce.js — Custom Debounce Hook
 * Delay updating a state value until after a specified delay period has elapsed
 * since the last time it was updated. Prevents API flooding on search inputs.
 */
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Return a cleanup function that will be called every time useEffect is re-called.
    // If value changes (user types a key), the previous timeout is cleared and reset.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
