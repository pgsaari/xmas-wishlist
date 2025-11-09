import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wishlistApi, getDisplayName, getDisplayPrice, hasMetadataError, needsRefresh } from './wishlists';
import type { Item } from './wishlists';
import api from './client';

// Mock the API client
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  },
}));

describe('wishlistApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyWishlist', () => {
    it('should fetch user wishlist', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockWishlist });

      const result = await wishlistApi.getMyWishlist();

      expect(api.get).toHaveBeenCalledWith('/wishlists/my-wishlist');
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('updateWishlist', () => {
    it('should update wishlist title', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'Updated Title',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
      };

      vi.mocked(api.put).mockResolvedValue({ data: mockWishlist });

      const result = await wishlistApi.updateWishlist('Updated Title');

      expect(api.put).toHaveBeenCalledWith('/wishlists/my-wishlist', { title: 'Updated Title' });
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('getShareLink', () => {
    it('should fetch share link', async () => {
      const mockShareLink = {
        shareUrl: 'http://localhost:3000/shared/token',
        shareToken: 'token',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockShareLink });

      const result = await wishlistApi.getShareLink();

      expect(api.get).toHaveBeenCalledWith('/wishlists/my-wishlist/share-link');
      expect(result).toEqual(mockShareLink);
    });
  });

  describe('getPublicWishlist', () => {
    it('should fetch public wishlist by token', async () => {
      const mockWishlist = {
        id: 1,
        title: 'My Wishlist',
        items: [],
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockWishlist });

      const result = await wishlistApi.getPublicWishlist('token');

      expect(api.get).toHaveBeenCalledWith('/wishlists/shared/token');
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('addItem', () => {
    it('should add item to wishlist', async () => {
      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockItem });

      const result = await wishlistApi.addItem({
        name: 'Test Item',
        rank: 3,
      });

      expect(api.post).toHaveBeenCalledWith('/wishlists/my-wishlist/items', {
        name: 'Test Item',
        rank: 3,
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe('updateItem', () => {
    it('should update item', async () => {
      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Updated Item',
        rank: 5,
        created_at: new Date().toISOString(),
      };

      vi.mocked(api.put).mockResolvedValue({ data: mockItem });

      const result = await wishlistApi.updateItem(1, {
        name: 'Updated Item',
        rank: 5,
      });

      expect(api.put).toHaveBeenCalledWith('/wishlists/my-wishlist/items/1', {
        name: 'Updated Item',
        rank: 5,
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe('deleteItem', () => {
    it('should delete item', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: undefined });

      await wishlistApi.deleteItem(1);

      expect(api.delete).toHaveBeenCalledWith('/wishlists/my-wishlist/items/1');
    });
  });

  describe('claimItem', () => {
    it('should claim item', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: undefined });

      await wishlistApi.claimItem('token', 1, {
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
      });

      expect(api.post).toHaveBeenCalledWith('/wishlists/shared/token/items/1/claim', {
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
      });
    });
  });

  describe('refreshItemMetadata', () => {
    it('should refresh item metadata', async () => {
      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
        last_fetched_at: new Date().toISOString(),
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockItem });

      const result = await wishlistApi.refreshItemMetadata(1);

      expect(api.post).toHaveBeenCalledWith('/wishlists/my-wishlist/items/1/refresh');
      expect(result).toEqual(mockItem);
    });
  });
});

describe('Helper functions', () => {
  describe('getDisplayName', () => {
    it('should return fetched_name when available', () => {
      const item = {
        name: 'Original Name',
        fetched_name: 'Fetched Name',
      };

      expect(getDisplayName(item)).toBe('Fetched Name');
    });

    it('should return name when fetched_name is not available', () => {
      const item = {
        name: 'Original Name',
      };

      expect(getDisplayName(item)).toBe('Original Name');
    });
  });

  describe('getDisplayPrice', () => {
    it('should return fetched_price when available', () => {
      const item = {
        price: 99.99,
        fetched_price: 79.99,
      };

      expect(getDisplayPrice(item)).toBe(79.99);
    });

    it('should return price when fetched_price is not available', () => {
      const item = {
        price: 99.99,
      };

      expect(getDisplayPrice(item)).toBe(99.99);
    });

    it('should return undefined when no price is available', () => {
      const item = {};

      expect(getDisplayPrice(item)).toBeUndefined();
    });

    it('should prefer fetched_price over price even when price is 0', () => {
      const item = {
        price: 0,
        fetched_price: 79.99,
      };

      expect(getDisplayPrice(item)).toBe(79.99);
    });
  });

  describe('hasMetadataError', () => {
    it('should return true when fetch_error exists', () => {
      const item = {
        fetch_error: 'Failed to fetch',
      };

      expect(hasMetadataError(item)).toBe(true);
    });

    it('should return false when fetch_error does not exist', () => {
      const item = {};

      expect(hasMetadataError(item)).toBe(false);
    });

    it('should return false when fetch_error is empty string', () => {
      const item = {
        fetch_error: '',
      };

      expect(hasMetadataError(item)).toBe(false);
    });
  });

  describe('needsRefresh', () => {
    it('should return false when link is not provided', () => {
      const item: Item = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
      };

      expect(needsRefresh(item)).toBe(false);
    });

    it('should return false when last_fetched_at is not provided', () => {
      const item: Item = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
        link: 'https://example.com',
      };

      expect(needsRefresh(item)).toBe(false);
    });

    it('should return false when last fetch was less than 24 hours ago', () => {
      const item: Item = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
        link: 'https://example.com',
        last_fetched_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      };

      expect(needsRefresh(item)).toBe(false);
    });

    it('should return true when last fetch was more than 24 hours ago', () => {
      const item: Item = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
        link: 'https://example.com',
        last_fetched_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      expect(needsRefresh(item)).toBe(true);
    });

    it('should return true when last fetch was exactly 24 hours ago', () => {
      const item: Item = {
        id: 1,
        wishlist_id: 1,
        name: 'Test Item',
        rank: 3,
        created_at: new Date().toISOString(),
        link: 'https://example.com',
        last_fetched_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      };

      expect(needsRefresh(item)).toBe(true);
    });
  });
});
