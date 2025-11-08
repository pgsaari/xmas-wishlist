import React, { useState, useEffect } from 'react';
import { CreateItemRequest } from '../api/wishlists';

interface ItemFormProps {
  onSubmit: (item: CreateItemRequest) => void;
  onCancel: () => void;
  initialItem?: CreateItemRequest;
}

export const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, onCancel, initialItem }) => {
  const [name, setName] = useState(initialItem?.name || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [price, setPrice] = useState(initialItem?.price?.toString() || '');
  const [link, setLink] = useState(initialItem?.link || '');
  const [rank, setRank] = useState(initialItem?.rank?.toString() || '3');

  // Reset form when initialItem changes (e.g., switching between add/edit)
  useEffect(() => {
    setName(initialItem?.name || '');
    setDescription(initialItem?.description || '');
    setPrice(initialItem?.price?.toString() || '');
    setLink(initialItem?.link || '');
    setRank(initialItem?.rank?.toString() || '3');
  }, [initialItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      price: price ? parseFloat(price) : undefined,
      link: link || undefined,
      rank: parseInt(rank) || 0,
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-neutral-900 mb-1">
        {initialItem ? '✏️ Edit Item' : '🎁 Add New Item'}
      </h3>
      <p className="text-neutral-600 text-sm mb-6">
        {initialItem ? 'Update your wish' : 'Add something you want'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Item Name <span className="text-primary-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Sony WH-1000XM5 Headphones"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people why you want this item..."
            className="input resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Estimated Price</label>
            <div className="flex items-center">
              <span className="text-neutral-600 mr-2">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                className="input flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-3">Priority Level</label>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRank(star.toString())}
                  className={`text-2xl transition-all duration-200 transform leading-none ${
                    star <= parseInt(rank)
                      ? 'scale-110'
                      : 'opacity-40 hover:opacity-60'
                  } hover:scale-125 cursor-pointer`}
                  title={`Priority level ${star}`}
                >
                  ⭐
                </button>
              ))}
              <span className="text-sm font-medium text-neutral-600 ml-1">
                {parseInt(rank) === 1 && 'Low'}
                {parseInt(rank) === 2 && 'Low-Medium'}
                {parseInt(rank) === 3 && 'Medium'}
                {parseInt(rank) === 4 && 'High'}
                {parseInt(rank) === 5 && 'Very High'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">Product Link</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://amazon.com/..."
            className="input"
          />
          <p className="text-xs text-neutral-500 mt-1">Share where people can find this item</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            {initialItem ? '💾 Update Item' : '➕ Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

