import { Link } from 'react-router-dom';

interface LocationPillProps {
  type: 'area' | 'container' | 'bin';
  name: string;
  area?: string;
  container?: string;
}

const LocationPill = ({ type, name, area, container }: LocationPillProps) => {
  // Determine the correct link URL based on the type and available info
  const getUrl = () => {
    switch (type) {
      case 'area':
        return `/areas/${name}`;
      case 'container':
        return area 
          ? `/areas/${area}/containers/${name}`
          : `/containers/${name}`;
      case 'bin':
        if (area && container) {
          return `/areas/${area}/containers/${container}/bins/${name}`;
        } else if (container) {
          return `/containers/${container}/bins/${name}`;
        } else {
          return `/bins/${name}`;
        }
      default:
        return '#';
    }
  };

  // Determine the appropriate color for the pill based on type
  const getPillClass = () => {
    switch (type) {
      case 'area':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'container':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bin':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Link
      to={getUrl()}
      className={`pill ${getPillClass()} hover:opacity-90 transition-opacity`}
      onClick={(e) => e.stopPropagation()} // Stop event propagation to parent
    >
      <span className="capitalize">{type}:</span> {name}
    </Link>
  );
};

export default LocationPill;
