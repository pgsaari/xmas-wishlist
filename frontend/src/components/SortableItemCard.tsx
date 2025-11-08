import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ItemCard } from './ItemCard';
import { Item } from '../api/wishlists';

interface SortableItemCardProps {
  item: Item;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const SortableItemCard: React.FC<SortableItemCardProps> = ({
  item,
  isEditable,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...(isEditable ? attributes : {})}
    >
      {/* Drop indicator - shows where item will be dropped */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 border-2 border-primary-500 border-dashed rounded-lg z-20 bg-primary-50/50 pointer-events-none" />
      )}
      
      {/* Drag handle - attach listeners here for reliable dragging */}
      {isEditable && (
        <div
          {...(isEditable ? listeners : {})}
          className="absolute top-3 right-3 z-30 bg-white/95 hover:bg-white border border-neutral-300 rounded-lg p-2 cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 pointer-events-auto touch-none"
          title="Drag to reorder"
        >
          <svg
            className="w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      )}
      
      {/* Card with drag styling */}
      <div
        className={
          isDragging
            ? 'ring-2 ring-primary-500 rounded-lg shadow-xl'
            : ''
        }
      >
        <ItemCard
          item={item}
          isEditable={isEditable}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

