import express, { Response } from 'express';
import { dbHelpers } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CreateItemRequest, UpdateItemRequest, UpdateWishlistRequest, ClaimItemRequest } from '../types';

const router = express.Router();

// Get user's wishlist
router.get('/my-wishlist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get wishlist
    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Get items without claim info (owner should not know which items are claimed)
    const items = dbHelpers.getItemsByWishlistId(wishlist.id);
    
    // Sort by rank descending, then by created_at ascending
    items.sort((a, b) => {
      if (b.rank !== a.rank) {
        return b.rank - a.rank;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    res.json({
      ...wishlist,
      items: items.map((item) => ({
        id: item.id,
        wishlist_id: item.wishlist_id,
        name: item.name,
        description: item.description,
        price: item.price,
        link: item.link,
        rank: item.rank,
        created_at: item.created_at,
      })),
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update wishlist
router.put('/my-wishlist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title }: UpdateWishlistRequest = req.body;

    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (title) {
      await dbHelpers.updateWishlist(wishlist.id, { title });
    }

    const updated = dbHelpers.getWishlistById(wishlist.id);
    res.json(updated);
  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get share link
router.get('/my-wishlist/share-link', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Construct share URL for frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/shared/${wishlist.share_token}`;
    res.json({ shareUrl, shareToken: wishlist.share_token });
  } catch (error) {
    console.error('Get share link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public wishlist by share token
router.get('/shared/:shareToken', (req, res: Response) => {
  try {
    const { shareToken } = req.params;

    const wishlist = dbHelpers.getWishlistByShareToken(shareToken);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Get items with claim status (but not buyer details - those are hidden from owner)
    // Public viewers can see if an item is claimed to avoid duplicate claims
    const items = dbHelpers.getItemsByWishlistId(wishlist.id);
    
    // Sort by rank descending, then by created_at ascending
    items.sort((a, b) => {
      if (b.rank !== a.rank) {
        return b.rank - a.rank;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Check which items are claimed
    const itemsWithClaims = items.map((item) => {
      const claim = dbHelpers.getClaimByItemId(item.id);
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        link: item.link,
        rank: item.rank,
        is_claimed: !!claim,
      };
    });

    res.json({
      id: wishlist.id,
      title: wishlist.title,
      items: itemsWithClaims,
    });
  } catch (error) {
    console.error('Get shared wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to wishlist
router.post('/my-wishlist/items', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const itemData: CreateItemRequest = req.body;

    if (!itemData.name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const newItem = await dbHelpers.createItem({
      wishlist_id: wishlist.id,
      name: itemData.name,
      description: itemData.description || undefined,
      price: itemData.price || undefined,
      link: itemData.link || undefined,
      rank: itemData.rank || 0,
      created_at: new Date().toISOString(),
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update item
router.put('/my-wishlist/items/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;
    const itemData: UpdateItemRequest = req.body;

    // Verify item belongs to user's wishlist
    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const item = dbHelpers.getItemById(parseInt(itemId));
    if (!item || item.wishlist_id !== wishlist.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Note: We allow editing even if claimed - owner shouldn't know about claims
    // Build update object
    const updates: any = {};
    if (itemData.name !== undefined) updates.name = itemData.name;
    if (itemData.description !== undefined) updates.description = itemData.description || undefined;
    if (itemData.price !== undefined) updates.price = itemData.price || undefined;
    if (itemData.link !== undefined) updates.link = itemData.link || undefined;
    if (itemData.rank !== undefined) updates.rank = itemData.rank;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await dbHelpers.updateItem(parseInt(itemId), updates);
    const updated = dbHelpers.getItemById(parseInt(itemId));
    res.json(updated);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete item
router.delete('/my-wishlist/items/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const wishlist = dbHelpers.getWishlistByUserId(userId);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const item = dbHelpers.getItemById(parseInt(itemId));
    if (!item || item.wishlist_id !== wishlist.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await dbHelpers.deleteItem(parseInt(itemId));
    res.status(204).send();
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim item (public endpoint - no auth required)
router.post('/shared/:shareToken/items/:itemId/claim', async (req, res: Response) => {
  try {
    const { shareToken, itemId } = req.params;
    const { buyer_name, buyer_email }: ClaimItemRequest = req.body;

    if (!buyer_name || !buyer_email) {
      return res.status(400).json({ error: 'Buyer name and email are required' });
    }

    // Verify wishlist exists
    const wishlist = dbHelpers.getWishlistByShareToken(shareToken);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Verify item belongs to wishlist
    const item = dbHelpers.getItemById(parseInt(itemId));
    if (!item || item.wishlist_id !== wishlist.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item is already claimed
    const existingClaim = dbHelpers.getClaimByItemId(parseInt(itemId));
    if (existingClaim) {
      return res.status(400).json({ error: 'Item is already claimed' });
    }

    // Create claim
    await dbHelpers.createClaim({
      item_id: parseInt(itemId),
      buyer_name,
      buyer_email,
      claimed_at: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Item claimed successfully' });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
