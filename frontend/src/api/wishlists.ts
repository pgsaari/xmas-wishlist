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
};

