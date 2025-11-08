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
      <div className="bg-white rounded-lg shadow-md p-6">
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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold flex-1">{item.name}</h3>
      </div>
      {item.description && <p className="text-gray-600 mb-3">{item.description}</p>}
      {item.price && (
        <p className="text-lg font-bold text-green-600 mb-2">${item.price.toFixed(2)}</p>
      )}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline mb-4 block"
        >
          View Item →
        </a>
      )}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          Priority: {'⭐'.repeat(Math.max(1, item.rank))}
        </span>
        {isEditable && (
          <div className="space-x-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

