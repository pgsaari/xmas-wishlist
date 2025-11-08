import React, { useState } from 'react';

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ shareUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card card-lg shadow-2xl max-w-md w-full animate-slide-up border-2 border-neutral-200">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🔗</span>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Share Your Wishlist</h2>
            <p className="text-neutral-600 text-sm">Spread the joy</p>
          </div>
        </div>

        <p className="text-neutral-700 mb-6 leading-relaxed">
          Share this link with family and friends. They can view your wishlist and claim the gifts they want to buy for you.
        </p>

        <div className="bg-primary-50 rounded-lg p-4 mb-6 border-2 border-primary-200">
          <p className="text-xs font-semibold text-neutral-700 mb-2">Wishlist Link</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm font-mono text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleCopy}
              className={`btn btn-sm font-semibold transition-all ${
                copied
                  ? 'btn-secondary'
                  : 'btn-primary'
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {copied && (
          <div className="alert alert-success mb-6 animate-slide-up">
            <span>✓</span>
            <p className="font-semibold">Link copied to clipboard!</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn btn-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

