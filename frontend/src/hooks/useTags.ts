import { useQuery } from 'react-query';
import { tagsAPI } from '../api/api';

// Hook for fetching all tags
export const useTags = () => {
  return useQuery('tags', tagsAPI.getTags);
};

// Hook for fetching a single tag by name
export const useTag = (tag: string) => {
  return useQuery(['tag', tag], () => tagsAPI.getTag(tag), {
    enabled: !!tag,
  });
};
