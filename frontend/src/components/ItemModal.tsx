import React, { useEffect } from 'react';
import { CreateItemRequest } from '../api/wishlists';
import { ItemForm } from './ItemForm';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: CreateItemRequest) => void;
  initialItem?: CreateItemRequest;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialItem,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (item: CreateItemRequest) => {
    onSubmit(item);
    // Don't close here - let the parent component close after successful submission
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="card card-lg shadow-2xl max-w-2xl w-full animate-slide-up border-2 border-neutral-200 max-h-[90vh] overflow-y-auto">
        <ItemForm
          initialItem={initialItem}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

