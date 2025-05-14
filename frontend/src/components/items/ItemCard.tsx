import { MouseEvent } from 'react';
import TagBadge from '../common/TagBadge';
import LocationPill from '../common/LocationPill';

interface Item {
  id: number;
  name: string;
  description: string | null;
  area: string | null;
  container: string | null;
  bin: string | null;
  quantity: number;
  cost: number;
  url: string | null;
  tags: Array<{ tag: string }>;
}

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const ItemCard = ({ item, onClick }: ItemCardProps) => {
  const handleItemClick = (e: MouseEvent) => {
    // Only proceed if the click is directly on the card
    // and not on a child element that should handle its own click
    if (e.target === e.currentTarget || 
        (e.target as HTMLElement).classList.contains('card-clickable-area')) {
      onClick();
    }
  };
  
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleItemClick}
    >
      <div className="flex justify-between items-start card-clickable-area">
        <h2 className="text-lg font-medium card-clickable-area">{item.name}</h2>
        <span className="text-gray-600 dark:text-gray-300 text-sm card-clickable-area">
          Qty: {item.quantity}
        </span>
      </div>
      
      {item.description && (
        <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 card-clickable-area">
          {item.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Location pills with built-in click propagation prevention */}
        {item.area && (
          <LocationPill type="area" name={item.area} />
        )}
        
        {item.container && (
          <LocationPill
            type="container"
            name={item.container}
            area={item.area || undefined}
          />
        )}
        
        {item.bin && (
          <LocationPill
            type="bin"
            name={item.bin}
            area={item.area || undefined}
            container={item.container || undefined}
          />
        )}
      </div>
      
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {/* Tag badges with built-in click propagation prevention */}
          {item.tags.map((tag, index) => (
            <TagBadge key={index} tag={tag.tag} />
          ))}
        </div>
      )}
      
      {item.cost > 0 && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 card-clickable-area">
          Cost: ${item.cost.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default ItemCard;
