import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XMarkIcon as XIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { useItem, useDeleteItem } from '../../hooks/useItems';
import LocationPill from '../common/LocationPill';
import TagBadge from '../common/TagBadge';
import ItemForm from './ItemForm';

const ItemDetailModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemId, setItemId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: item, isLoading, isError, error } = useItem(itemId || 0);
  const deleteMutation = useDeleteItem();

  // Parse the item ID from the URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('item');
    
    if (id && !isNaN(parseInt(id))) {
      setItemId(parseInt(id));
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setItemId(null);
    }
    
    setIsEditing(false);
  }, [location.search]);

  // Handle closing the modal
  const handleClose = () => {
    setIsOpen(false);
    setIsEditing(false);
    
    // Remove the item query parameter and navigate back
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('item');
    
    const newSearch = searchParams.toString();
    const pathWithoutSearch = location.pathname;
    
    if (newSearch) {
      navigate(`${pathWithoutSearch}?${newSearch}`);
    } else {
      navigate(pathWithoutSearch);
    }
  };

  // Handle deleting the item
  const handleDelete = async () => {
    if (!itemId) return;
    
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMutation.mutateAsync(itemId);
        handleClose();
      } catch (err) {
        console.error('Failed to delete item:', err);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 my-16 transition-colors">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              </div>
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-500">
              <p>Error loading item</p>
              <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
              <button
                onClick={handleClose}
                className="mt-4 btn btn-primary"
              >
                Close
              </button>
            </div>
          ) : isEditing ? (
            <div>
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-medium">Edit Item</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {item && (
                <ItemForm
                  initialData={item}
                  onSubmit={() => {
                    setIsEditing(false);
                  }}
                  onCancel={() => {
                    setIsEditing(false);
                  }}
                />
              )}
            </div>
          ) : item ? (
            <>
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-medium">{item.name}</h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Location Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.area && (
                    <LocationPill 
                      type="area"
                      name={item.area}
                    />
                  )}
                  
                  {item.container && (
                    <LocationPill 
                      type="container"
                      name={item.container}
                      area={item.area}
                    />
                  )}
                  
                  {item.bin && (
                    <LocationPill 
                      type="bin"
                      name={item.bin}
                      container={item.container}
                      area={item.area}
                    />
                  )}
                </div>
                
                {/* Item Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </h4>
                    <p className="mt-1">{item.description || 'No description'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Quantity
                      </h4>
                      <p className="mt-1">{item.quantity}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Cost
                      </h4>
                      <p className="mt-1">
                        {item.cost ? `$${item.cost.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {item.url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        URL
                      </h4>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-blue-600 dark:text-blue-400 hover:underline block truncate"
                      >
                        {item.url}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Tags Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tags
                    </h4>
                    <button
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Add Tag"
                    >
                      <PlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.map((tag, index) => (
                        <TagBadge key={index} tag={tag.tag} />
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No tags
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center btn btn-secondary"
                >
                  <PencilIcon className="h-5 w-5 mr-1" />
                  Edit
                </button>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center btn btn-danger"
                >
                  <TrashIcon className="h-5 w-5 mr-1" />
                  Delete
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};

export default ItemDetailModal;
