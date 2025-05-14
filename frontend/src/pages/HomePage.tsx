import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import ItemList from '../components/items/ItemList';
import ItemForm from '../components/items/ItemForm';
import { Dialog } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const areaFilter = searchParams.get('area') || '';
  const containerFilter = searchParams.get('container') || '';
  const binFilter = searchParams.get('bin') || '';
  const tagFilter = searchParams.get('tag') || '';
  
  // Fetch items based on filters
  const { data, isLoading, error } = useItems({
    search: searchQuery,
    area: areaFilter,
    container: containerFilter,
    bin: binFilter,
    tag: tagFilter,
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
  });
  
  // Handle adding a new item
  const handleAddItem = () => {
    setIsAddModalOpen(true);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle filter application
  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(location.search);
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    navigate(`/?${params.toString()}`);
    setCurrentPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    navigate('/');
    setCurrentPage(1);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        
        <button
          onClick={handleAddItem}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Item
        </button>
      </div>
      
      {/* Filters section */}
      {(searchQuery || areaFilter || containerFilter || binFilter || tagFilter) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Active Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear All
            </button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {searchQuery && (
              <div className="pill bg-gray-200 dark:bg-gray-700">
                Search: {searchQuery}
                <button
                  onClick={() => applyFilter('search', '')}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  &times;
                </button>
              </div>
            )}
            
            {areaFilter && (
              <div className="pill bg-blue-100 dark:bg-blue-900">
                Area: {areaFilter}
                <button
                  onClick={() => applyFilter('area', '')}
                  className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  &times;
                </button>
              </div>
            )}
            
            {containerFilter && (
              <div className="pill bg-green-100 dark:bg-green-900">
                Container: {containerFilter}
                <button
                  onClick={() => applyFilter('container', '')}
                  className="ml-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  &times;
                </button>
              </div>
            )}
            
            {binFilter && (
              <div className="pill bg-yellow-100 dark:bg-yellow-900">
                Bin: {binFilter}
                <button
                  onClick={() => applyFilter('bin', '')}
                  className="ml-2 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                >
                  &times;
                </button>
              </div>
            )}
            
            {tagFilter && (
              <div className="pill bg-purple-100 dark:bg-purple-900">
                Tag: {tagFilter}
                <button
                  onClick={() => applyFilter('tag', '')}
                  className="ml-2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Items list */}
      <ItemList
        items={data?.items || []}
        isLoading={isLoading}
        error={error}
        totalItems={data?.total || 0}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
      
      {/* Add item modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 my-16 transition-colors">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium">
                Add New Item
              </Dialog.Title>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-2xl text-gray-500 dark:text-gray-400">&times;</span>
              </button>
            </div>
            
            <ItemForm
              onSubmit={() => {
                setIsAddModalOpen(false);
              }}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default HomePage;
