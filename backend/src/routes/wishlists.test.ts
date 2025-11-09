import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistsRouter from './wishlists';
import { authenticate } from '../middleware/auth';

// Mock database helpers
vi.mock('../database', () => ({
  dbHelpers: {
    getWishlistByUserId: vi.fn(),
    getWishlistByShareToken: vi.fn(),
    getWishlistById: vi.fn(),
    getItemsByWishlistId: vi.fn(),
    getItemById: vi.fn(),
    getClaimByItemId: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    updateWishlist: vi.fn(),
    deleteItem: vi.fn(),
    createClaim: vi.fn(),
  },
}));

// Mock auth middleware
vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.userId = 1;
    req.userEmail = 'test@example.com';
    next();
  }),
}));

// Mock metadata service
vi.mock('../services/metadataService', () => ({
  MetadataService: {
    fetchMetadata: vi.fn(),
  },
}));

import { dbHelpers } from '../database';
import { MetadataService } from '../services/metadataService';

const app = express();
app.use(express.json());
app.use('/api/wishlists', wishlistsRouter);

describe('Wishlists Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/wishlists/my-wishlist', () => {
    it('should get user wishlist', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItems = [
        {
          id: 1,
          wishlist_id: 1,
          name: 'Item 1',
          rank: 5,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.getItemsByWishlistId).mockReturnValue(mockItems);

      const response = await request(app)
        .get('/api/wishlists/my-wishlist')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
      expect(dbHelpers.getWishlistByUserId).toHaveBeenCalledWith(1);
    });

    it('should return 404 if wishlist not found', async () => {
      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(undefined);

      const response = await request(app)
        .get('/api/wishlists/my-wishlist')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Wishlist not found');
    });
  });

  describe('PUT /api/wishlists/my-wishlist', () => {
    it('should update wishlist title', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'Updated Title',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.updateWishlist).mockResolvedValue(mockWishlist);
      vi.mocked(dbHelpers.getWishlistById).mockReturnValue(mockWishlist);

      const response = await request(app)
        .put('/api/wishlists/my-wishlist')
        .set('Authorization', 'Bearer token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(dbHelpers.updateWishlist).toHaveBeenCalledWith(1, { title: 'Updated Title' });
    });

    it('should return 404 if wishlist not found', async () => {
      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(undefined);

      const response = await request(app)
        .put('/api/wishlists/my-wishlist')
        .set('Authorization', 'Bearer token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Wishlist not found');
    });
  });

  describe('GET /api/wishlists/my-wishlist/share-link', () => {
    it('should get share link', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(mockWishlist);
      process.env.FRONTEND_URL = 'http://localhost:3000';

      const response = await request(app)
        .get('/api/wishlists/my-wishlist/share-link')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareUrl');
      expect(response.body.shareUrl).toBe('http://localhost:3000/shared/test-token');
      expect(response.body.shareToken).toBe('test-token');
    });
  });

  describe('GET /api/wishlists/shared/:shareToken', () => {
    it('should get public wishlist by share token', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItems = [
        {
          id: 1,
          wishlist_id: 1,
          name: 'Item 1',
          rank: 5,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(dbHelpers.getWishlistByShareToken).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.getItemsByWishlistId).mockReturnValue(mockItems);
      vi.mocked(dbHelpers.getClaimByItemId).mockReturnValue(undefined);

      const response = await request(app)
        .get('/api/wishlists/shared/test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items[0]).toHaveProperty('is_claimed');
      expect(response.body.items[0].is_claimed).toBe(false);
    });

    it('should return 404 if wishlist not found', async () => {
      vi.mocked(dbHelpers.getWishlistByShareToken).mockReturnValue(undefined);

      const response = await request(app)
        .get('/api/wishlists/shared/invalid-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Wishlist not found');
    });

    it('should show is_claimed as true when item is claimed', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItems = [
        {
          id: 1,
          wishlist_id: 1,
          name: 'Item 1',
          rank: 5,
          created_at: new Date().toISOString(),
        },
      ];

      const mockClaim = {
        id: 1,
        item_id: 1,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
        claimed_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByShareToken).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.getItemsByWishlistId).mockReturnValue(mockItems);
      vi.mocked(dbHelpers.getClaimByItemId).mockReturnValue(mockClaim);

      const response = await request(app)
        .get('/api/wishlists/shared/test-token');

      expect(response.status).toBe(200);
      expect(response.body.items[0].is_claimed).toBe(true);
    });
  });

  describe('POST /api/wishlists/my-wishlist/items', () => {
    it('should add item to wishlist', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'New Item',
        rank: 3,
        created_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(mockWishlist);
      vi.mocked(MetadataService.fetchMetadata).mockResolvedValue({
        name: null,
        price: null,
        image_url: null,
        retailer: 'Unknown',
        success: false,
        error: 'No metadata',
      });
      vi.mocked(dbHelpers.createItem).mockResolvedValue(mockItem);

      const response = await request(app)
        .post('/api/wishlists/my-wishlist/items')
        .set('Authorization', 'Bearer token')
        .send({
          name: 'New Item',
          rank: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Item');
      expect(dbHelpers.createItem).toHaveBeenCalled();
    });

    it('should return 400 if item name is missing', async () => {
      const response = await request(app)
        .post('/api/wishlists/my-wishlist/items')
        .set('Authorization', 'Bearer token')
        .send({
          rank: 3,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item name is required');
    });

    it('should fetch metadata when link is provided', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Fetched Item',
        rank: 3,
        created_at: new Date().toISOString(),
        fetched_name: 'Fetched Item',
        fetched_price: 99.99,
        image_url: 'https://example.com/image.jpg',
        retailer: 'Amazon',
        last_fetched_at: new Date().toISOString(),
        snapshot_date: new Date().toISOString().split('T')[0],
      };

      vi.mocked(dbHelpers.getWishlistByUserId).mockReturnValue(mockWishlist);
      vi.mocked(MetadataService.fetchMetadata).mockResolvedValue({
        success: true,
        name: 'Fetched Item',
        price: 99.99,
        image_url: 'https://example.com/image.jpg',
        retailer: 'Amazon',
      });
      vi.mocked(dbHelpers.createItem).mockResolvedValue(mockItem);

      const response = await request(app)
        .post('/api/wishlists/my-wishlist/items')
        .set('Authorization', 'Bearer token')
        .send({
          name: 'New Item',
          link: 'https://example.com/item',
        });

      expect(response.status).toBe(201);
      expect(MetadataService.fetchMetadata).toHaveBeenCalledWith('https://example.com/item');
    });
  });

  describe('POST /api/wishlists/shared/:shareToken/items/:itemId/claim', () => {
    it('should claim an item', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Item 1',
        rank: 5,
        created_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByShareToken).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.getItemById).mockReturnValue(mockItem);
      vi.mocked(dbHelpers.getClaimByItemId).mockReturnValue(undefined);
      vi.mocked(dbHelpers.createClaim).mockResolvedValue({
        id: 1,
        item_id: 1,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
        claimed_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/wishlists/shared/test-token/items/1/claim')
        .send({
          buyer_name: 'John Doe',
          buyer_email: 'john@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Item claimed successfully');
      expect(dbHelpers.createClaim).toHaveBeenCalled();
    });

    it('should return 400 if buyer name or email is missing', async () => {
      const response = await request(app)
        .post('/api/wishlists/shared/test-token/items/1/claim')
        .send({
          buyer_name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Buyer name and email are required');
    });

    it('should return 400 if item is already claimed', async () => {
      const mockWishlist = {
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItem = {
        id: 1,
        wishlist_id: 1,
        name: 'Item 1',
        rank: 5,
        created_at: new Date().toISOString(),
      };

      const mockClaim = {
        id: 1,
        item_id: 1,
        buyer_name: 'John Doe',
        buyer_email: 'john@example.com',
        claimed_at: new Date().toISOString(),
      };

      vi.mocked(dbHelpers.getWishlistByShareToken).mockReturnValue(mockWishlist);
      vi.mocked(dbHelpers.getItemById).mockReturnValue(mockItem);
      vi.mocked(dbHelpers.getClaimByItemId).mockReturnValue(mockClaim);

      const response = await request(app)
        .post('/api/wishlists/shared/test-token/items/1/claim')
        .send({
          buyer_name: 'Jane Doe',
          buyer_email: 'jane@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item is already claimed');
    });
  });
});
