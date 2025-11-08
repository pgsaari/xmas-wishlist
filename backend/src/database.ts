import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

interface DatabaseSchema {
  users: Array<{
    id: number;
    email: string;
    password_hash: string;
    name: string;
    created_at: string;
  }>;
  wishlists: Array<{
    id: number;
    user_id: number;
    share_token: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>;
  items: Array<{
    id: number;
    wishlist_id: number;
    name: string;
    description?: string;
    price?: number;
    link?: string;
    rank: number;
    created_at: string;
  }>;
  claims: Array<{
    id: number;
    item_id: number;
    buyer_name: string;
    buyer_email: string;
    claimed_at: string;
  }>;
}

// Use process.cwd() to get the current working directory (project root)
const dbPath = path.join(process.cwd(), 'backend', 'db.json');

const adapter = new JSONFile<DatabaseSchema>(dbPath);
const db = new Low<DatabaseSchema>(adapter, {
  users: [],
  wishlists: [],
  items: [],
  claims: [],
});

// Initialize database - load data
const initDb = async () => {
  await db.read();
  // Ensure default structure exists
  if (!db.data) {
    db.data = {
      users: [],
      wishlists: [],
      items: [],
      claims: [],
    };
    await db.write();
  }
};

// Initialize on import
initDb().catch((err) => {
  console.error('Database initialization error:', err);
});

// Helper functions for database operations
export const dbHelpers = {
  // Users
  getUserByEmail: (email: string) => {
    return db.data?.users.find((u: DatabaseSchema['users'][0]) => u.email === email);
  },
  getUserById: (id: number) => {
    return db.data?.users.find((u: DatabaseSchema['users'][0]) => u.id === id);
  },
  createUser: async (user: Omit<DatabaseSchema['users'][0], 'id'>) => {
    await initDb();
    const newId = db.data!.users.length > 0 ? Math.max(...db.data!.users.map((u: DatabaseSchema['users'][0]) => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    db.data!.users.push(newUser);
    await db.write();
    return newUser;
  },

  // Wishlists
  getWishlistByUserId: (userId: number) => {
    return db.data?.wishlists.find((w: DatabaseSchema['wishlists'][0]) => w.user_id === userId);
  },
  getWishlistByShareToken: (shareToken: string) => {
    return db.data?.wishlists.find((w: DatabaseSchema['wishlists'][0]) => w.share_token === shareToken);
  },
  getWishlistById: (id: number) => {
    return db.data?.wishlists.find((w: DatabaseSchema['wishlists'][0]) => w.id === id);
  },
  createWishlist: async (wishlist: Omit<DatabaseSchema['wishlists'][0], 'id'>) => {
    await initDb();
    const newId = db.data!.wishlists.length > 0 ? Math.max(...db.data!.wishlists.map((w: DatabaseSchema['wishlists'][0]) => w.id)) + 1 : 1;
    const newWishlist = { ...wishlist, id: newId };
    db.data!.wishlists.push(newWishlist);
    await db.write();
    return newWishlist;
  },
  updateWishlist: async (id: number, updates: Partial<DatabaseSchema['wishlists'][0]>) => {
    await initDb();
    const wishlist = db.data!.wishlists.find((w: DatabaseSchema['wishlists'][0]) => w.id === id);
    if (wishlist) {
      Object.assign(wishlist, updates, { updated_at: new Date().toISOString() });
      await db.write();
    }
    return wishlist;
  },

  // Items
  getItemsByWishlistId: (wishlistId: number) => {
    return db.data?.items.filter((i: DatabaseSchema['items'][0]) => i.wishlist_id === wishlistId) || [];
  },
  getItemById: (id: number) => {
    return db.data?.items.find((i: DatabaseSchema['items'][0]) => i.id === id);
  },
  createItem: async (item: Omit<DatabaseSchema['items'][0], 'id'>) => {
    await initDb();
    const newId = db.data!.items.length > 0 ? Math.max(...db.data!.items.map((i: DatabaseSchema['items'][0]) => i.id)) + 1 : 1;
    const newItem = { ...item, id: newId };
    db.data!.items.push(newItem);
    await db.write();
    return newItem;
  },
  updateItem: async (id: number, updates: Partial<DatabaseSchema['items'][0]>) => {
    await initDb();
    const item = db.data!.items.find((i: DatabaseSchema['items'][0]) => i.id === id);
    if (item) {
      Object.assign(item, updates);
      await db.write();
    }
    return item;
  },
  deleteItem: async (id: number) => {
    await initDb();
    const index = db.data!.items.findIndex((i: DatabaseSchema['items'][0]) => i.id === id);
    if (index !== -1) {
      db.data!.items.splice(index, 1);
      // Also delete associated claims
      db.data!.claims = db.data!.claims.filter((c: DatabaseSchema['claims'][0]) => c.item_id !== id);
      await db.write();
      return true;
    }
    return false;
  },

  // Claims
  getClaimByItemId: (itemId: number) => {
    return db.data?.claims.find((c: DatabaseSchema['claims'][0]) => c.item_id === itemId);
  },
  createClaim: async (claim: Omit<DatabaseSchema['claims'][0], 'id'>) => {
    await initDb();
    const newId = db.data!.claims.length > 0 ? Math.max(...db.data!.claims.map((c: DatabaseSchema['claims'][0]) => c.id)) + 1 : 1;
    const newClaim = { ...claim, id: newId };
    db.data!.claims.push(newClaim);
    await db.write();
    return newClaim;
  },
};

export default db;
