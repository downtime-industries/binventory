import { useQuery } from 'react-query';
import { containersAPI } from '../api/api';

// Hook for fetching all containers
export const useContainers = (params = {}) => {
  return useQuery(['containers', params], () => containersAPI.getContainers(params));
};

// Hook for fetching a single container by name
export const useContainer = (container: string, params = {}) => {
  return useQuery(['container', container, params], () => containersAPI.getContainer(container, params), {
    enabled: !!container,
  });
};
