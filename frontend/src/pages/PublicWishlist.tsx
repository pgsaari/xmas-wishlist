import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { wishlistApi, PublicWishlist as PublicWishlistType } from '../api/wishlists';
import { ClaimModal } from '../components/ClaimModal';

export const PublicWishlist: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [wishlist, setWishlist] = useState<PublicWishlistType | null>(null);
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="card card-lg shadow-lg text-center max-w-md">
          <span className="text-6xl block mb-4">❌</span>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Wishlist Not Found</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <a href="/" className="btn btn-primary">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-5xl mb-4">🎄</div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">{wishlist?.title}</h1>
          <p className="text-neutral-600 text-lg">Christmas Wishlist</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {wishlist && wishlist.items.length > 0 ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card card-compact text-center">
                <p className="text-3xl font-bold text-primary-600">{wishlist.items.length}</p>
                <p className="text-sm text-neutral-600">Items</p>
              </div>
              <div className="card card-compact text-center">
                <p className="text-3xl font-bold text-secondary-600">
                  {wishlist.items.filter(i => i.is_claimed).length}
                </p>
                <p className="text-sm text-neutral-600">Claimed</p>
              </div>
              <div className="card card-compact text-center">
                <p className="text-3xl font-bold text-accent-600">
                  {wishlist.items.filter(i => !i.is_claimed).length}
                </p>
                <p className="text-sm text-neutral-600">Available</p>
              </div>
              <div className="card card-compact text-center">
                <p className="text-3xl font-bold text-neutral-600">
                  ${wishlist.items.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(0)}
                </p>
                <p className="text-sm text-neutral-600">Total Value</p>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.items
                .sort((a, b) => b.rank - a.rank)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`card card-normal group transition-all duration-300 ${
                      item.is_claimed ? 'opacity-60 bg-neutral-50' : 'hover:shadow-lg'
                    } animate-fade-in`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-neutral-900 flex-1 leading-tight">{item.name}</h3>
                      {item.is_claimed && (
                        <span className="badge badge-secondary ml-2">Already Claimed</span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    )}

                    {item.price && (
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-secondary-600">${item.price.toFixed(2)}</span>
                        <span className="text-xs text-neutral-500">estimated</span>
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
                        <span className="text-base">{'⭐'.repeat(Math.max(1, Math.min(5, item.rank)))}</span>
                      </div>

                      <button
                        onClick={() => setClaimingItemId(item.id)}
                        disabled={item.is_claimed}
                        className={`btn btn-sm ${
                          item.is_claimed
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'btn-secondary hover:scale-105'
                        }`}
                      >
                        {item.is_claimed ? '✓ Claimed' : '🛍️ Claim'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 card card-lg shadow-sm border-2 border-dashed border-neutral-300">
            <span className="text-6xl block mb-4">📭</span>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">This wishlist is empty</h3>
            <p className="text-neutral-600">Come back later to see what they'd like!</p>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimingItemId && (
        <ClaimModal
          itemName={wishlist?.items.find((i) => i.id === claimingItemId)?.name || ''}
          onClaim={handleClaim}
          onClose={() => setClaimingItemId(null)}
        />
      )}
    </div>
  );
};

