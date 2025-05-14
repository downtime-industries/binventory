import { useQuery } from 'react-query';
import { useState, useEffect } from 'react';
import { itemsAPI } from '../api/api';

// Hook for search autocomplete functionality
export const useSearchAutocomplete = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [query]);
  
  return useQuery(
    ['searchAutocomplete', debouncedQuery],
    () => itemsAPI.searchAutocomplete(debouncedQuery),
    {
      enabled: debouncedQuery.length > 1,
      staleTime: 60000, // 1 minute
    }
  );
};
