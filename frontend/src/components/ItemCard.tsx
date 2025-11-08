import React, { useState, useEffect } from 'react';
import { Item, wishlistApi, getDisplayName, getDisplayPrice, hasMetadataError, needsRefresh } from '../api/wishlists';

interface ItemCardProps {
  item: Item;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isEditable,
  onEdit,
  onDelete,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localItem, setLocalItem] = useState(item);

  // Auto-refresh stale data on mount
  useEffect(() => {
    const autoRefresh = async () => {
      if (needsRefresh(localItem) && !isRefreshing) {
        setIsRefreshing(true);
        try {
          const updated = await wishlistApi.refreshItemMetadata(localItem.id);
          setLocalItem(updated);
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    autoRefresh();
  }, [localItem.id]); // Only run once on mount

  // Update local item when prop changes
  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const displayName = getDisplayName(localItem);
  const displayPrice = getDisplayPrice(localItem);
  const hasError = hasMetadataError(localItem);

  return (
    <div className="card card-normal group hover:shadow-lg animate-fade-in">
      {/* Product Image */}
      {localItem.image_url && (
        <div className="mb-4">
          {localItem.link ? (
            <a
              href={localItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <img
                src={localItem.image_url}
                alt={displayName}
                className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </a>
          ) : (
            <img
              src={localItem.image_url}
              alt={displayName}
              className="w-full h-48 object-cover rounded-lg border border-neutral-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-neutral-900 flex-1 leading-tight">{displayName}</h3>

        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="flex-shrink-0 ml-2" title="Refreshing product data...">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Error indicator */}
        {hasError && !isRefreshing && (
          <div
            className="flex-shrink-0 text-yellow-500 ml-2"
            title={localItem.fetch_error}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {localItem.description && (
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{localItem.description}</p>
      )}

      {displayPrice !== undefined && (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-secondary-600">${displayPrice.toFixed(2)}</span>
          <span className="text-xs text-neutral-500">estimated price</span>
        </div>
      )}

      {/* Retailer */}
      {localItem.retailer && (
        <p className="text-sm text-neutral-500 mb-2">from {localItem.retailer}</p>
      )}

      {localItem.link && (
        <a
          href={localItem.link}
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
          <span className="text-base" title={`Priority level ${localItem.rank}`}>
            {'⭐'.repeat(Math.max(1, Math.min(5, localItem.rank)))}
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
