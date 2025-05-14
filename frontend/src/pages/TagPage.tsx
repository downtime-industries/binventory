import { useParams, Link } from 'react-router-dom';
import { useTag } from '../hooks/useTags';
import ItemList from '../components/items/ItemList';
import LocationPill from '../components/common/LocationPill';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

const TagPage = () => {
  const { tag = '' } = useParams<{ tag: string }>();
  const { data, isLoading, error } = useTag(tag);
  
  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center text-sm font-medium">
          <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 dark:text-white">Tag: {tag}</span>
        </nav>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
          {tag}
        </h1>
        
        {isLoading ? (
          <div className="animate-pulse mt-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ) : error ? (
          <div className="mt-4 text-red-600 dark:text-red-400">
            Failed to load tag details
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
                Locations
              </h3>
              <p className="text-3xl font-bold">
                {(data.areas?.length || 0) + (data.containers?.length || 0) + (data.bins?.length || 0)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Locations Section */}
      {!isLoading && !error && data && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Locations</h2>
          
          {data.areas?.length === 0 && data.containers?.length === 0 && data.bins?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No locations associated with this tag.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {data.areas?.map((area, i) => (
                <LocationPill key={`area-${i}`} type="area" name={area} />
              ))}
              
              {data.containers?.map((container, i) => (
                <LocationPill key={`container-${i}`} type="container" name={container} />
              ))}
              
              {data.bins?.map((bin, i) => (
                <LocationPill key={`bin-${i}`} type="bin" name={bin} />
              ))}
            </div>
          )}
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

export default TagPage;
