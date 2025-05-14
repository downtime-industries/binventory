import { useParams, Link } from 'react-router-dom';
import { useContainer } from '../hooks/useContainers';
import ItemList from '../components/items/ItemList';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

const ContainerPage = () => {
  const { container = '', area } = useParams<{ container: string; area?: string }>();
  const { data, isLoading, error } = useContainer(container, { area });
  
  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center flex-wrap text-sm font-medium">
          <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
          
          {data?.area && data.area !== "Unknown" && (
            <>
              <Link 
                to={`/areas/${data.area}`} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {data.area}
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
            </>
          )}
          
          <span className="text-gray-900 dark:text-white">Container: {container}</span>
        </nav>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          {container}
        </h1>
        
        {isLoading ? (
          <div className="animate-pulse mt-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="mt-4 text-red-600 dark:text-red-400">
            Failed to load container details
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
                Bins
              </h3>
              <p className="text-3xl font-bold">{data.bins?.length || 0}</p>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Area info if available */}
      {!isLoading && !error && data && data.area && data.area !== "Unknown" && (
        <div className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Located in
            </h3>
            <Link 
              to={`/areas/${data.area}`}
              className="mt-1 text-blue-700 dark:text-blue-300 hover:underline flex items-center"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Area: {data.area}
            </Link>
          </div>
        </div>
      )}
      
      {/* Bins Section */}
      {!isLoading && !error && data && data.bins && data.bins.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bins</h2>
            
            {data.bins.length > 6 && (
              <Link
                to={`/containers/${container}/bins`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All ({data.bins.length})
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {data.bins.slice(0, 6).map((bin, index) => {
              const binUrl = data.area && data.area !== "Unknown" 
                ? `/areas/${data.area}/containers/${container}/bins/${bin}`
                : `/containers/${container}/bins/${bin}`;
                
              return (
                <Link
                  key={index}
                  to={binUrl}
                  className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-900 rounded-lg px-4 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  {bin}
                </Link>
              );
            })}
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

export default ContainerPage;
