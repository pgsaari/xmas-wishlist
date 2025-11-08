import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wishlistApi, Wishlist, CreateItemRequest } from '../api/wishlists';
import { ItemForm } from '../components/ItemForm';
import { ItemCard } from '../components/ItemCard';
import { ShareModal } from '../components/ShareModal';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
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
      setShowItemForm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (itemId: number, item: CreateItemRequest) => {
    try {
      await wishlistApi.updateItem(itemId, item);
      await loadWishlist();
      setEditingItem(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    }
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">🎄 Christmas Wishlist</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hello, {user?.name}</span>
              <button
                onClick={handleShare}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Share Wishlist
              </button>
              <button
                onClick={logout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {wishlist && (
          <div className="mb-6">
            <input
              type="text"
              value={wishlist.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:border-b-2 focus:border-red-500 w-full"
            />
          </div>
        )}

        <button
          onClick={() => setShowItemForm(true)}
          className="mb-6 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-semibold"
        >
          + Add Item
        </button>

        {showItemForm && (
          <div className="mb-6">
            <ItemForm
              onSubmit={handleAddItem}
              onCancel={() => setShowItemForm(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist?.items
            .sort((a, b) => b.rank - a.rank)
            .map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isEditable={true}
                onEdit={() => setEditingItem(item.id)}
                onDelete={() => handleDeleteItem(item.id)}
                isEditing={editingItem === item.id}
                onSave={(updatedItem) => handleUpdateItem(item.id, updatedItem)}
                onCancel={() => setEditingItem(null)}
              />
            ))}
        </div>

        {wishlist?.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Your wishlist is empty. Add some items to get started!</p>
          </div>
        )}

        {showShareModal && (
          <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />
        )}
      </div>
    </div>
  );
};

