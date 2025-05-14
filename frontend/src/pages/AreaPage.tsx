import { useParams, Link } from 'react-router-dom';
import { useArea } from '../hooks/useAreas';
import ItemList from '../components/items/ItemList';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

const AreaPage = () => {
  const { area = '' } = useParams<{ area: string }>();
  const { data, isLoading, error } = useArea(area);
  
  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center text-sm font-medium">
          <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 dark:text-white">Area: {area}</span>
        </nav>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          {area}
        </h1>
        
        {isLoading ? (
          <div className="animate-pulse mt-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="mt-4 text-red-600 dark:text-red-400">
            Failed to load area details
          </div>
        ) : data ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Items
              </h3>
              <p className="text-3xl font-bold">{data.item_count}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Total Quantity
              </h3>
              <p className="text-3xl font-bold">{data.total_quantity}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Containers
              </h3>
              <p className="text-3xl font-bold">{data.containers?.length || 0}</p>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Containers Section */}
      {!isLoading && !error && data && data.containers && data.containers.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Containers</h2>
            
            {data.containers.length > 6 && (
              <Link
                to={`/areas/${area}/containers`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All ({data.containers.length})
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.containers.slice(0, 6).map((container, index) => (
              <Link
                key={index}
                to={`/areas/${area}/containers/${container.name}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium mb-2">{container.name}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Items: {container.item_count}</p>
                  <p>Quantity: {container.total_quantity}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Items Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Items</h2>
        
        <ItemList
          items={data?.items || []}
          isLoading={isLoading}
          error={error}
          totalItems={data?.items?.length || 0}
          currentPage={1}
          itemsPerPage={100}
          onPageChange={() => {}}
        />
      </div>
    </div>
  );
};

export default AreaPage;
