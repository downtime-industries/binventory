import { useQuery } from 'react-query';
import { binsAPI } from '../api/api';

// Hook for fetching all bins
export const useBins = (params = {}) => {
  return useQuery(['bins', params], () => binsAPI.getBins(params));
};

// Hook for fetching a single bin by name
export const useBin = (bin: string, params = {}) => {
  return useQuery(['bin', bin, params], () => binsAPI.getBin(bin, params), {
    enabled: !!bin,
  });
};
