import { useParams, Link } from 'react-router-dom';
import { useBin } from '../hooks/useBins';
import ItemList from '../components/items/ItemList';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

const BinPage = () => {
  const { bin = '', area, container } = useParams<{ bin: string; area?: string; container?: string }>();
  const { data, isLoading, error } = useBin(bin, { area, container });
  
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
          
          {data?.container && data.container !== "Unknown" && (
            <>
              <Link 
                to={data.area && data.area !== "Unknown" 
                  ? `/areas/${data.area}/containers/${data.container}`
                  : `/containers/${data.container}`
                } 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {data.container}
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
            </>
          )}
          
          <span className="text-gray-900 dark:text-white">Bin: {bin}</span>
        </nav>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
          {bin}
        </h1>
        
        {isLoading ? (
          <div className="animate-pulse mt-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="mt-4 text-red-600 dark:text-red-400">
            Failed to load bin details
          </div>
        ) : data ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        ) : null}
      </div>
      
      {/* Location Info */}
      {!isLoading && !error && data && ((data.area && data.area !== "Unknown") || (data.container && data.container !== "Unknown")) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="space-y-2">
              {data.area && data.area !== "Unknown" && (
                <Link 
                  to={`/areas/${data.area}`}
                  className="flex items-center text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Area: {data.area}
                </Link>
              )}
              
              {data.container && data.container !== "Unknown" && (
                <Link 
                  to={data.area && data.area !== "Unknown"
                    ? `/areas/${data.area}/containers/${data.container}`
                    : `/containers/${data.container}`
                  }
                  className="flex items-center text-green-700 dark:text-green-300 hover:underline"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Container: {data.container}
                </Link>
              )}
            </div>
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

export default BinPage;
