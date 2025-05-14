import { useQuery } from 'react-query';
import { areasAPI } from '../api/api';

// Hook for fetching all areas
export const useAreas = () => {
  return useQuery('areas', areasAPI.getAreas);
};

// Hook for fetching a single area by name
export const useArea = (area: string) => {
  return useQuery(['area', area], () => areasAPI.getArea(area), {
    enabled: !!area,
  });
};
