import express, { Response } from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CreateItemRequest, UpdateItemRequest, UpdateWishlistRequest, ClaimItemRequest } from '../types';

const router = express.Router();

// Get user's wishlist
router.get('/my-wishlist', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get wishlist
    const wishlist = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Get items without claim info (owner should not know which items are claimed)
    const items = db
      .prepare('SELECT * FROM items WHERE wishlist_id = ? ORDER BY rank DESC, created_at ASC')
      .all(wishlist.id) as any[];

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
router.put('/my-wishlist', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title }: UpdateWishlistRequest = req.body;

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (title) {
      db.prepare('UPDATE wishlists SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        title,
        wishlist.id
      );
    }

    const updated = db.prepare('SELECT * FROM wishlists WHERE id = ?').get(wishlist.id);
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
    const wishlist = db.prepare('SELECT share_token FROM wishlists WHERE user_id = ?').get(userId) as any;
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

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE share_token = ?').get(shareToken) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Get items with claim status (but not buyer details - those are hidden from owner)
    // Public viewers can see if an item is claimed to avoid duplicate claims
    const items = db
      .prepare(`
        SELECT 
          i.*,
          CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as is_claimed
        FROM items i
        LEFT JOIN claims c ON i.id = c.item_id
        WHERE i.wishlist_id = ?
        ORDER BY i.rank DESC, i.created_at ASC
      `)
      .all(wishlist.id) as any[];

    res.json({
      id: wishlist.id,
      title: wishlist.title,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        link: item.link,
        rank: item.rank,
        is_claimed: item.is_claimed === 1,
      })),
    });
  } catch (error) {
    console.error('Get shared wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to wishlist
router.post('/my-wishlist/items', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const itemData: CreateItemRequest = req.body;

    if (!itemData.name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const result = db
      .prepare(
        'INSERT INTO items (wishlist_id, name, description, price, link, rank) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        wishlist.id,
        itemData.name,
        itemData.description || null,
        itemData.price || null,
        itemData.link || null,
        itemData.rank || 0
      );

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update item
router.put('/my-wishlist/items/:itemId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;
    const itemData: UpdateItemRequest = req.body;

    // Verify item belongs to user's wishlist
    const wishlist = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ? AND wishlist_id = ?').get(itemId, wishlist.id) as any;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Note: We allow editing even if claimed - owner shouldn't know about claims
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (itemData.name !== undefined) {
      updates.push('name = ?');
      values.push(itemData.name);
    }
    if (itemData.description !== undefined) {
      updates.push('description = ?');
      values.push(itemData.description || null);
    }
    if (itemData.price !== undefined) {
      updates.push('price = ?');
      values.push(itemData.price || null);
    }
    if (itemData.link !== undefined) {
      updates.push('link = ?');
      values.push(itemData.link || null);
    }
    if (itemData.rank !== undefined) {
      updates.push('rank = ?');
      values.push(itemData.rank);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(itemId);
    db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    res.json(updated);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete item
router.delete('/my-wishlist/items/:itemId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ? AND wishlist_id = ?').get(itemId, wishlist.id) as any;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim item (public endpoint - no auth required)
router.post('/shared/:shareToken/items/:itemId/claim', (req, res: Response) => {
  try {
    const { shareToken, itemId } = req.params;
    const { buyer_name, buyer_email }: ClaimItemRequest = req.body;

    if (!buyer_name || !buyer_email) {
      return res.status(400).json({ error: 'Buyer name and email are required' });
    }

    // Verify wishlist exists
    const wishlist = db.prepare('SELECT * FROM wishlists WHERE share_token = ?').get(shareToken) as any;
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Verify item belongs to wishlist
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND wishlist_id = ?').get(itemId, wishlist.id) as any;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item is already claimed
    const existingClaim = db.prepare('SELECT * FROM claims WHERE item_id = ?').get(itemId) as any;
    if (existingClaim) {
      return res.status(400).json({ error: 'Item is already claimed' });
    }

    // Create claim
    db.prepare('INSERT INTO claims (item_id, buyer_name, buyer_email) VALUES (?, ?, ?)').run(
      itemId,
      buyer_name,
      buyer_email
    );

    res.status(201).json({ message: 'Item claimed successfully' });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

