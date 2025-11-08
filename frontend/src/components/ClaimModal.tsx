import React, { useState } from 'react';

interface ClaimModalProps {
  itemName: string;
  onClaim: (buyerName: string, buyerEmail: string) => void;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ itemName, onClaim, onClose }) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerName && buyerEmail) {
      onClaim(buyerName, buyerEmail);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card card-lg shadow-2xl max-w-md w-full animate-slide-up border-2 border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🎁</span>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Claim Item</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Secure this gift for {itemName}</p>
          </div>
        </div>

        <div className="alert alert-info mb-6">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-semibold text-sm mb-1">Reserved and Secret</p>
            <p className="text-xs">
              The wishlist owner won't see your claim—keeping the surprise alive!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">Your Name *</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
              placeholder="John Doe"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">Your Email *</label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="input"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Used to confirm your claim</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-secondary"
            >
              ✓ Claim Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

