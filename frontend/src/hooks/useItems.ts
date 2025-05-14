import { useQuery, useMutation, useQueryClient } from 'react-query';
import { itemsAPI } from '../api/api';

// Hook for fetching items with filtering and pagination
export const useItems = (params = {}) => {
  return useQuery(['items', params], () => itemsAPI.getItems(params), {
    keepPreviousData: true,
  });
};

// Hook for fetching a single item by ID
export const useItem = (id: number) => {
  return useQuery(['item', id], () => itemsAPI.getItem(id), {
    enabled: !!id,
  });
};

// Hook for creating a new item
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(itemsAPI.createItem, {
    onSuccess: () => {
      queryClient.invalidateQueries('items');
    },
  });
};

// Hook for updating an item
export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: number; data: any }) => itemsAPI.updateItem(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('items');
        queryClient.invalidateQueries(['item', variables.id]);
      },
    }
  );
};

// Hook for deleting an item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(itemsAPI.deleteItem, {
    onSuccess: () => {
      queryClient.invalidateQueries('items');
    },
  });
};
