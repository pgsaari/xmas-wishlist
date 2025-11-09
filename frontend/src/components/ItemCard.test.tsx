import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import type { Item } from '../api/wishlists';

// Mock the wishlist API
vi.mock('../api/wishlists', async () => {
  const actual = await vi.importActual('../api/wishlists') as any;
  return {
    ...actual,
    wishlistApi: {
      ...actual.wishlistApi,
      refreshItemMetadata: vi.fn(),
    },
  };
});

import * as wishlistApi from '../api/wishlists';

describe('ItemCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const baseItem: Item = {
    id: 1,
    wishlist_id: 1,
    name: 'Test Item',
    description: 'Test description',
    price: 99.99,
    link: 'https://example.com/item',
    rank: 5,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render item name', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should render item description', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render item price', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('estimated price')).toBeInTheDocument();
  });

  it('should render priority stars', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const priorityText = screen.getByText(/Priority:/i);
    expect(priorityText).toBeInTheDocument();
  });

  it('should render link when provided', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const link = screen.getByText('View Item');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/item');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
    expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should not render edit/delete buttons when not editable', () => {
    render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByText('✏️ Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('🗑️ Delete')).not.toBeInTheDocument();
  });

  it('should render edit/delete buttons when editable', () => {
    render(<ItemCard item={baseItem} isEditable={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('✏️ Edit')).toBeInTheDocument();
    expect(screen.getByText('🗑️ Delete')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<ItemCard item={baseItem} isEditable={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButton = screen.getByText('✏️ Edit');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<ItemCard item={baseItem} isEditable={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByText('🗑️ Delete');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should render image when image_url is provided', () => {
    const itemWithImage: Item = {
      ...baseItem,
      image_url: 'https://example.com/image.jpg',
    };

    render(<ItemCard item={itemWithImage} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const image = screen.getByAltText('Test Item');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should render image as link when both image_url and link are provided', () => {
    const itemWithImage: Item = {
      ...baseItem,
      image_url: 'https://example.com/image.jpg',
    };

    render(<ItemCard item={itemWithImage} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const image = screen.getByAltText('Test Item');
    const link = image.closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com/item');
  });

  it('should hide image on error', () => {
    const itemWithImage: Item = {
      ...baseItem,
      image_url: 'https://example.com/image.jpg',
    };

    render(<ItemCard item={itemWithImage} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const image = screen.getByAltText('Test Item');
    fireEvent.error(image);
    
    expect(image).toHaveStyle({ display: 'none' });
  });

  it('should render retailer when provided', () => {
    const itemWithRetailer: Item = {
      ...baseItem,
      retailer: 'Amazon',
    };

    render(<ItemCard item={itemWithRetailer} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText(/from Amazon/i)).toBeInTheDocument();
  });

  it('should not render price when not provided', () => {
    const itemWithoutPrice: Item = {
      ...baseItem,
      price: undefined,
      fetched_price: undefined,
    };

    render(<ItemCard item={itemWithoutPrice} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByText(/\$\d+\.\d+/)).not.toBeInTheDocument();
  });

  it('should use fetched_name when available', () => {
    const itemWithFetchedName: Item = {
      ...baseItem,
      fetched_name: 'Fetched Item Name',
    };

    render(<ItemCard item={itemWithFetchedName} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Fetched Item Name')).toBeInTheDocument();
  });

  it('should use fetched_price when available', () => {
    const itemWithFetchedPrice: Item = {
      ...baseItem,
      price: 99.99,
      fetched_price: 79.99,
    };

    render(<ItemCard item={itemWithFetchedPrice} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('should show error indicator when fetch_error exists', () => {
    const itemWithError: Item = {
      ...baseItem,
      fetch_error: 'Failed to fetch metadata',
    };

    render(<ItemCard item={itemWithError} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const errorIndicator = screen.getByTitle('Failed to fetch metadata');
    expect(errorIndicator).toBeInTheDocument();
  });

  it('should auto-refresh stale metadata', async () => {
    const staleItem: Item = {
      ...baseItem,
      last_fetched_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      link: 'https://example.com/item',
    };

    const refreshedItem = {
      ...staleItem,
      last_fetched_at: new Date().toISOString(),
    };

    vi.mocked(wishlistApi.wishlistApi.refreshItemMetadata).mockResolvedValue(refreshedItem);

    // Mock needsRefresh to return true for stale items
    const needsRefreshSpy = vi.spyOn(wishlistApi, 'needsRefresh');
    needsRefreshSpy.mockReturnValue(true);

    render(<ItemCard item={staleItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    await waitFor(() => {
      expect(wishlistApi.wishlistApi.refreshItemMetadata).toHaveBeenCalledWith(staleItem.id);
    }, { timeout: 2000 });

    needsRefreshSpy.mockRestore();
  });

  it('should update when item prop changes', () => {
    const { rerender } = render(<ItemCard item={baseItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    
    const updatedItem: Item = {
      ...baseItem,
      name: 'Updated Item',
    };
    
    rerender(<ItemCard item={updatedItem} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Updated Item')).toBeInTheDocument();
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  it('should not show description when not provided', () => {
    const itemWithoutDescription: Item = {
      ...baseItem,
      description: undefined,
    };

    render(<ItemCard item={itemWithoutDescription} isEditable={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });
});
