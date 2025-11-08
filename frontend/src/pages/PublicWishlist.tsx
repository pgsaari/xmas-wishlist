import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { wishlistApi, PublicWishlist } from '../api/wishlists';
import { ClaimModal } from '../components/ClaimModal';

export const PublicWishlist: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [wishlist, setWishlist] = useState<PublicWishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingItemId, setClaimingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (shareToken) {
      loadWishlist();
    }
  }, [shareToken]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getPublicWishlist(shareToken!);
      setWishlist(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (buyerName: string, buyerEmail: string) => {
    if (!claimingItemId || !shareToken) return;

    try {
      await wishlistApi.claimItem(shareToken, claimingItemId, {
        buyer_name: buyerName,
        buyer_email: buyerEmail,
      });
      setClaimingItemId(null);
      await loadWishlist();
      alert('Item claimed successfully! The wishlist owner will not see this claim to keep it a surprise.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to claim item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-red-600">🎄 {wishlist?.title}</h1>
        <p className="text-center text-gray-600 mb-8">Christmas Wishlist</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist?.items
            .sort((a, b) => b.rank - a.rank)
            .map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                  item.is_claimed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold flex-1">{item.name}</h3>
                  {item.is_claimed && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded ml-2">
                      Already Claimed
                    </span>
                  )}
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Priority: {'⭐'.repeat(Math.max(1, item.rank))}
                  </span>
                  <button
                    onClick={() => setClaimingItemId(item.id)}
                    disabled={item.is_claimed}
                    className={`px-4 py-2 rounded-md font-semibold ${
                      item.is_claimed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {item.is_claimed ? 'Already Claimed' : "I'll Buy This"}
                  </button>
                </div>
              </div>
            ))}
        </div>

        {wishlist?.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">This wishlist is empty.</p>
          </div>
        )}

        {claimingItemId && (
          <ClaimModal
            itemName={wishlist?.items.find((i) => i.id === claimingItemId)?.name || ''}
            onClaim={handleClaim}
            onClose={() => setClaimingItemId(null)}
          />
        )}
      </div>
    </div>
  );
};

