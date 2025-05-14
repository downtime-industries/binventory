import { Link } from 'react-router-dom';

interface TagBadgeProps {
  tag: string;
}

const TagBadge = ({ tag }: TagBadgeProps) => {
  return (
    <Link
      to={`/tags/${tag}`}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:opacity-90 transition-opacity"
      onClick={(e) => e.stopPropagation()} // Stop event propagation to parent
    >
      {tag}
    </Link>
  );
};

export default TagBadge;
