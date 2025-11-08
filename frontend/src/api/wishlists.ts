import api from './client';

export interface Item {
  id: number;
  wishlist_id: number;
  name: string;
  description?: string;
  price?: number;
  link?: string;
  rank: number;
  created_at: string;

  // Existing fields - sync with DB
  retailer?: string;
  snapshot_date?: string;

  // New metadata fields
  image_url?: string;
  fetched_name?: string;
  fetched_price?: number;
  last_fetched_at?: string;
  fetch_error?: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  share_token: string;
  title: string;
  created_at: string;
  updated_at: string;
  items: Item[];
}

export interface PublicWishlist {
  id: number;
  title: string;
  items: (Omit<Item, 'wishlist_id' | 'created_at'> & { is_claimed?: boolean })[];
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  price?: number;
  link?: string;
  rank?: number;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  price?: number;
  link?: string;
  rank?: number;
}

export interface ClaimItemRequest {
  buyer_name: string;
  buyer_email: string;
}

export const wishlistApi = {
  getMyWishlist: async (): Promise<Wishlist> => {
    const response = await api.get<Wishlist>('/wishlists/my-wishlist');
    return response.data;
  },

  updateWishlist: async (title: string): Promise<Wishlist> => {
    const response = await api.put<Wishlist>('/wishlists/my-wishlist', { title });
    return response.data;
  },

  getShareLink: async (): Promise<{ shareUrl: string; shareToken: string }> => {
    const response = await api.get<{ shareUrl: string; shareToken: string }>('/wishlists/my-wishlist/share-link');
    return response.data;
  },

  getPublicWishlist: async (shareToken: string): Promise<PublicWishlist> => {
    const response = await api.get<PublicWishlist>(`/wishlists/shared/${shareToken}`);
    return response.data;
  },

  addItem: async (item: CreateItemRequest): Promise<Item> => {
    const response = await api.post<Item>('/wishlists/my-wishlist/items', item);
    return response.data;
  },

  updateItem: async (itemId: number, item: UpdateItemRequest): Promise<Item> => {
    const response = await api.put<Item>(`/wishlists/my-wishlist/items/${itemId}`, item);
    return response.data;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await api.delete(`/wishlists/my-wishlist/items/${itemId}`);
  },

  claimItem: async (shareToken: string, itemId: number, claim: ClaimItemRequest): Promise<void> => {
    await api.post(`/wishlists/shared/${shareToken}/items/${itemId}/claim`, claim);
  },

  refreshItemMetadata: async (itemId: number): Promise<Item> => {
    const response = await api.post<Item>(`/wishlists/my-wishlist/items/${itemId}/refresh`);
    return response.data;
  },
};

// Helper functions (work with both Item and public item types)
export function getDisplayName(item: { name: string; fetched_name?: string }): string {
  return item.fetched_name || item.name;
}

export function getDisplayPrice(item: { price?: number; fetched_price?: number }): number | undefined {
  return item.fetched_price ?? item.price;
}

export function hasMetadataError(item: { fetch_error?: string }): boolean {
  return !!item.fetch_error;
}

export function needsRefresh(item: Item): boolean {
  if (!item.link || !item.last_fetched_at) return false;

  const lastFetch = new Date(item.last_fetched_at);
  const now = new Date();
  const hoursSince = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

  return hoursSince >= 24;
}

