export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  share_token: string;
  title: string;
  created_at: string;
  updated_at: string;
}

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

export interface Claim {
  id: number;
  item_id: number;
  buyer_name: string;
  buyer_email: string;
  claimed_at: string;
}

export interface ItemWithClaim extends Item {
  claim?: Claim;
}

export interface WishlistWithItems extends Wishlist {
  items: ItemWithClaim[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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

export interface UpdateWishlistRequest {
  title?: string;
}

// Metadata Service Types
export interface ProductMetadata {
  name: string | null;
  price: number | null;
  image_url: string | null;
  retailer: string;
  success: boolean;
  error?: string;
}

