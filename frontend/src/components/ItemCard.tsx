import React, { useState } from 'react';
import { Item, CreateItemRequest } from '../api/wishlists';
import { ItemForm } from './ItemForm';

interface ItemCardProps {
  item: Item;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onSave: (item: CreateItemRequest) => void;
  onCancel: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isEditable,
  onEdit,
  onDelete,
  isEditing,
  onSave,
  onCancel,
}) => {
  if (isEditing) {
    return (
      <div className="card card-normal animate-slide-up md:col-span-2 lg:col-span-3">
        <ItemForm
          initialItem={{
            name: item.name,
            description: item.description,
            price: item.price,
            link: item.link,
            rank: item.rank,
          }}
          onSubmit={onSave}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="card card-normal group hover:shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-neutral-900 flex-1 leading-tight">{item.name}</h3>
      </div>

      {item.description && (
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{item.description}</p>
      )}

      {item.price && (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-secondary-600">${item.price.toFixed(2)}</span>
          <span className="text-xs text-neutral-500">estimated price</span>
        </div>
      )}

      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 mb-4 hover:underline transition-colors"
        >
          View Item
          <span className="ml-1.5">→</span>
        </a>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-neutral-600">Priority:</span>
          <span className="text-base" title={`Priority level ${item.rank}`}>
            {'⭐'.repeat(Math.max(1, Math.min(5, item.rank)))}
          </span>
        </div>

        {isEditable && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="btn btn-sm btn-outline text-primary-600 border-primary-300 hover:bg-primary-50"
              title="Edit this item"
            >
              ✏️ Edit
            </button>
            <button
              onClick={onDelete}
              className="btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-50"
              title="Delete this item"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

