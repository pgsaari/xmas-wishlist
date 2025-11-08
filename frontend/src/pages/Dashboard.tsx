import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wishlistApi, Wishlist, CreateItemRequest, Item } from '../api/wishlists';
import { ItemModal } from '../components/ItemModal';
import { ItemCard } from '../components/ItemCard';
import { ShareModal } from '../components/ShareModal';
import { InstallPWA } from '../components/InstallPWA';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    loadWishlist();
  }, []);

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

  const handleAddItem = async (item: CreateItemRequest) => {
    try {
      await wishlistApi.addItem(item);
      await loadWishlist();
      setShowItemModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (item: CreateItemRequest) => {
    if (!editingItem) return;
    try {
      await wishlistApi.updateItem(editingItem.id, item);
      await loadWishlist();
      setEditingItem(null);
      setShowItemModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎄</span>
              <h1 className="text-xl font-bold text-neutral-900">Christmas Wishlist</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
                <span className="text-sm text-neutral-600">👤</span>
                <span className="text-sm font-medium text-neutral-700">{user?.name}</span>
              </div>
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
            <label className="text-sm font-semibold text-neutral-600 block mb-2">Wishlist Title</label>
            <input
              type="text"
              value={wishlist.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="text-4xl font-bold bg-transparent border-b-2 border-neutral-300 focus:outline-none focus:border-primary-600 focus:ring-0 w-full pb-2 transition-colors text-neutral-900"
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
            <div className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-900">{wishlist.items.length}</span> item{wishlist.items.length !== 1 ? 's' : ''} in your wishlist
            </div>
          )}
        </div>

        {/* Items Grid */}
        {wishlist && wishlist.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items
              .sort((a, b) => b.rank - a.rank)
              .map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isEditable={true}
                  onEdit={() => handleEditClick(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-16 card card-lg shadow-sm border-2 border-dashed border-neutral-300">
            <span className="text-6xl block mb-4">🎁</span>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Your wishlist is empty</h3>
            <p className="text-neutral-600 mb-6">Start adding items to create your Christmas wishlist</p>
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
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

