import React, { useEffect } from 'react';
import { CreateItemRequest } from '../api/wishlists';
import { ItemForm } from './ItemForm';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: CreateItemRequest) => void;
  initialItem?: CreateItemRequest;
  isLoadingMetadata?: boolean;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialItem,
  isLoadingMetadata = false,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoadingMetadata) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isLoadingMetadata]);

  if (!isOpen) return null;

  const handleSubmit = (item: CreateItemRequest) => {
    onSubmit(item);
    // Don't close here - let the parent component close after successful submission
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoadingMetadata) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="card card-lg shadow-2xl max-w-2xl w-full animate-slide-up border-2 border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto relative">
        {isLoadingMetadata && (
          <div className="absolute inset-0 bg-white dark:bg-neutral-800 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Fetching product metadata...</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">This may take a few seconds</p>
            </div>
          </div>
        )}
        <ItemForm
          initialItem={initialItem}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoadingMetadata={isLoadingMetadata}
        />
      </div>
    </div>
  );
};

