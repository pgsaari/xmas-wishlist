import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemForm } from './ItemForm';
import type { CreateItemRequest } from '../api/wishlists';

describe('ItemForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render add item form by default', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('🎁 Add New Item')).toBeInTheDocument();
    expect(screen.getByText('Add something you want')).toBeInTheDocument();
  });

  it('should render edit item form when initialItem is provided', () => {
    const initialItem: CreateItemRequest = {
      name: 'Test Item',
      description: 'Test description',
      price: 99.99,
      link: 'https://example.com/item',
      rank: 5,
    };

    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} initialItem={initialItem} />);
    
    expect(screen.getByText('✏️ Edit Item')).toBeInTheDocument();
    expect(screen.getByText('Update your wish')).toBeInTheDocument();
  });

  it('should populate form fields with initialItem values', () => {
    const initialItem: CreateItemRequest = {
      name: 'Test Item',
      description: 'Test description',
      price: 99.99,
      link: 'https://example.com/item',
      rank: 5,
    };

    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} initialItem={initialItem} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones') as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText('Tell people why you want this item...') as HTMLTextAreaElement;
    const priceInput = screen.getAllByDisplayValue('99.99')[0] as HTMLInputElement;
    const linkInput = screen.getByPlaceholderText('https://amazon.com/...') as HTMLInputElement;
    
    expect(nameInput.value).toBe('Test Item');
    expect(descriptionInput.value).toBe('Test description');
    expect(priceInput.value).toBe('99.99');
    expect(linkInput.value).toBe('https://example.com/item');
  });

  it('should update form fields when user types', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones') as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText('Tell people why you want this item...') as HTMLTextAreaElement;
    
    fireEvent.change(nameInput, { target: { value: 'New Item' } });
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });
    
    expect(nameInput.value).toBe('New Item');
    expect(descriptionInput.value).toBe('New description');
  });

  it('should call onSubmit with correct data when form is submitted', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones');
    const priceInput = screen.getByPlaceholderText('99.99');
    const linkInput = screen.getByPlaceholderText('https://amazon.com/...');
    const submitButton = screen.getByText('➕ Add Item');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(priceInput, { target: { value: '49.99' } });
    fireEvent.change(linkInput, { target: { value: 'https://example.com' } });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Item',
      description: undefined,
      price: 49.99,
      link: 'https://example.com',
      rank: 3,
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should update rank when star is clicked', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Default rank is 3
    const stars = screen.getAllByTitle(/Priority level/i);
    const fifthStar = stars[4]; // Index 4 is priority level 5
    
    fireEvent.click(fifthStar);
    
    // Fill in required name field
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones');
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    
    const submitButton = screen.getByText('➕ Add Item');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ rank: 5 })
    );
  });

  it('should display priority level text when rank is selected', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const stars = screen.getAllByTitle(/Priority level/i);
    
    // Click first star (Low)
    fireEvent.click(stars[0]);
    expect(screen.getByText('Low')).toBeInTheDocument();
    
    // Click third star (Medium)
    fireEvent.click(stars[2]);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    
    // Click fifth star (Very High)
    fireEvent.click(stars[4]);
    expect(screen.getByText('Very High')).toBeInTheDocument();
  });

  it('should require item name', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones') as HTMLInputElement;
    expect(nameInput.required).toBe(true);
  });

  it('should handle empty optional fields', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones');
    const submitButton = screen.getByText('➕ Add Item');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Item',
      description: undefined,
      price: undefined,
      link: undefined,
      rank: 3,
    });
  });

  it('should disable form when isLoadingMetadata is true', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoadingMetadata={true} />);
    
    const linkInput = screen.getByPlaceholderText('https://amazon.com/...') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Adding.../i });
    const cancelButton = screen.getByText('Cancel');
    
    expect(linkInput.disabled).toBe(true);
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should show loading indicator when isLoadingMetadata is true and link exists', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoadingMetadata={true} />);
    
    const linkInput = screen.getByPlaceholderText('https://amazon.com/...');
    fireEvent.change(linkInput, { target: { value: 'https://example.com' } });
    
    // Check that loading indicator appears (there may be multiple instances)
    expect(screen.getAllByText('Fetching metadata...').length).toBeGreaterThan(0);
  });

  it('should update form when initialItem changes', () => {
    const { rerender } = render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones') as HTMLInputElement;
    expect(nameInput.value).toBe('');
    
    const newInitialItem: CreateItemRequest = {
      name: 'Updated Item',
      rank: 4,
    };
    
    rerender(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} initialItem={newInitialItem} />);
    
    expect(nameInput.value).toBe('Updated Item');
  });

  it('should parse price as float', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones');
    const priceInput = screen.getByPlaceholderText('99.99');
    const submitButton = screen.getByText('➕ Add Item');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(priceInput, { target: { value: '123.45' } });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ price: 123.45 })
    );
  });

  it('should handle invalid price input gracefully', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Sony WH-1000XM5 Headphones');
    const priceInput = screen.getByPlaceholderText('99.99');
    const submitButton = screen.getByText('➕ Add Item');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(priceInput, { target: { value: 'invalid' } });
    fireEvent.click(submitButton);
    
    // Should submit with undefined price for invalid input
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ price: undefined })
    );
  });
});
