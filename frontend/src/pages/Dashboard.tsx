import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wishlistApi, Wishlist, CreateItemRequest, Item } from '../api/wishlists';
import { ItemModal } from '../components/ItemModal';
import { SortableItemCard } from '../components/SortableItemCard';
import { ShareModal } from '../components/ShareModal';
import { InstallPWA } from '../components/InstallPWA';
import { DarkModeToggle } from '../components/DarkModeToggle';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadWishlist();
  }, []);

  // Update items when wishlist changes (but not during reordering)
  useEffect(() => {
    if (wishlist && !isReordering) {
      // Sort by rank descending
      const sortedItems = [...wishlist.items].sort((a, b) => b.rank - a.rank);
      setItems(sortedItems);
    }
  }, [wishlist, isReordering]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getMyWishlist();
      setWishlist(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Save original order for rollback
    const originalItems = [...items];

    // Set reordering flag to prevent useEffect from overwriting our changes
    setIsReordering(true);

    // Update local state immediately for responsive UI
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Update ranks based on new positions (higher index = lower rank)
    // Since items are sorted by rank descending, we assign ranks in reverse
    try {
      // Calculate new ranks: items at the beginning get higher ranks
      const rankUpdates = newItems.map((item, index) => ({
        itemId: item.id,
        newRank: newItems.length - index,
      }));

      console.log('Updating ranks:', rankUpdates);

      // Update items sequentially to avoid any potential race conditions
      const updatedItems: Item[] = [];
      for (const { itemId, newRank } of rankUpdates) {
        try {
          console.log(`Updating item ${itemId} to rank ${newRank}...`);
          const updated = await wishlistApi.updateItem(itemId, { rank: newRank });
          console.log(`✓ Updated item ${itemId} to rank ${newRank}:`, updated);
          updatedItems.push(updated);
        } catch (err: any) {
          console.error(`✗ Failed to update item ${itemId}:`, err);
          throw err;
        }
      }
      console.log('All rank updates completed successfully');
      console.log('Updated items from API:', updatedItems);

      // Verify that ranks were actually updated
      const rankCheck = updatedItems.map((item) => ({
        id: item.id,
        rank: item.rank,
        expectedRank: rankUpdates.find((r) => r.itemId === item.id)?.newRank,
      }));
      console.log('Rank verification:', rankCheck);

      // Update the wishlist state with items in the new order (with updated ranks)
      if (wishlist) {
        // Map newItems to include the updated data from API
        const reorderedItems = newItems.map((item) => {
          const updated = updatedItems.find((u) => u.id === item.id);
          // Use the updated item if available, otherwise use the item with updated rank
          return updated || { ...item, rank: rankUpdates.find((r) => r.itemId === item.id)?.newRank || item.rank };
        });

        const updatedWishlist = {
          ...wishlist,
          items: reorderedItems,
        };
        
        console.log('Setting updated wishlist with items:', reorderedItems.map((i) => ({ id: i.id, rank: i.rank })));
        
        // Update both states to ensure consistency
        setWishlist(updatedWishlist);
        setItems(reorderedItems);
        
        // Clear the reordering flag - the states are now consistent
        // The useEffect won't overwrite because items already match the wishlist order
        setIsReordering(false);
      } else {
        setIsReordering(false);
      }
    } catch (err: any) {
      console.error('Error reordering items:', err);
      setError(err.response?.data?.error || 'Failed to reorder items');
      // Revert to original order on error
      setItems(originalItems);
      setIsReordering(false);
    }
  };

  const handleAddItem = async (item: CreateItemRequest) => {
    try {
      setIsLoadingMetadata(!!item.link);
      await wishlistApi.addItem(item);
      await loadWishlist();
      setShowItemModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUpdateItem = async (item: CreateItemRequest) => {
    if (!editingItem) return;
    try {
      // Show loading if link is provided and it's different from the current link
      const linkChanged = item.link !== undefined && item.link !== editingItem.link && !!item.link;
      setIsLoadingMetadata(linkChanged);
      await wishlistApi.updateItem(editingItem.id, item);
      await loadWishlist();
      setEditingItem(null);
      setShowItemModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const handleModalClose = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setIsLoadingMetadata(false);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    try {
      await wishlistApi.deleteItem(itemId);
      await loadWishlist();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleShare = async () => {
    try {
      const { shareUrl: url } = await wishlistApi.getShareLink();
      setShareUrl(url);
      setShowShareModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get share link');
    }
  };

  const handleUpdateTitle = async (title: string) => {
    try {
      await wishlistApi.updateWishlist(title);
      await loadWishlist();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update title');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎄</span>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Christmas Wishlist</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">👤</span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{user?.name}</span>
              </div>
              <DarkModeToggle />
              <InstallPWA />
              <button
                onClick={handleShare}
                className="btn btn-secondary btn-sm"
                title="Share your wishlist with others"
              >
                🔗 Share
              </button>
              <button
                onClick={logout}
                className="btn btn-outline btn-sm"
                title="Sign out of your account"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6 animate-slide-down">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Wishlist Title */}
        {wishlist && (
          <div className="mb-8 animate-fade-in">
            <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 block mb-2">Wishlist Title</label>
            <input
              type="text"
              value={wishlist.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="text-4xl font-bold bg-transparent border-b-2 border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-primary-600 dark:focus:border-primary-400 focus:ring-0 w-full pb-2 transition-colors text-neutral-900 dark:text-neutral-50"
            />
          </div>
        )}

        {/* Add Item Button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={handleAddClick}
            className="btn btn-primary btn-lg"
          >
            ➕ Add Item
          </button>
          {wishlist && wishlist.items.length > 0 && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">{wishlist.items.length}</span> item{wishlist.items.length !== 1 ? 's' : ''} in your wishlist
            </div>
          )}
        </div>

        {/* Items Grid */}
        {wishlist && items.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <SortableItemCard
                    key={item.id}
                    item={item}
                    isEditable={true}
                    onEdit={() => handleEditClick(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-16 card card-lg shadow-sm border-2 border-dashed border-neutral-300 dark:border-neutral-600">
            <span className="text-6xl block mb-4">🎁</span>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Your wishlist is empty</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Start adding items to create your Christmas wishlist</p>
            <button
              onClick={handleAddClick}
              className="btn btn-primary btn-lg inline-block"
            >
              ➕ Add First Item
            </button>
          </div>
        )}
      </div>

      {/* Item Modal */}
      <ItemModal
        isOpen={showItemModal}
        onClose={handleModalClose}
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        initialItem={editingItem ? {
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          link: editingItem.link,
          rank: editingItem.rank,
        } : undefined}
        isLoadingMetadata={isLoadingMetadata}
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

