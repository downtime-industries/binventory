import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200">404</h1>
      <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
        Page not found
      </p>
      <p className="mt-2 text-md text-gray-500 dark:text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 btn btn-primary"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
