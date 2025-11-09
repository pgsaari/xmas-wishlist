import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClaimModal } from './ClaimModal';

describe('ClaimModal', () => {
  const mockOnClaim = vi.fn();
  const mockOnClose = vi.fn();
  const itemName = 'Test Item';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with item name', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    expect(screen.getByText('Claim Item')).toBeInTheDocument();
    expect(screen.getByText(/Secure this gift for Test Item/)).toBeInTheDocument();
  });

  it('should show form fields', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Email/i)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClaim).not.toHaveBeenCalled();
  });

  it('should not submit form with empty fields', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const submitButton = screen.getByText('✓ Claim Item');
    fireEvent.click(submitButton);
    
    // Form validation should prevent submission
    expect(mockOnClaim).not.toHaveBeenCalled();
  });

  it('should call onClaim with correct data when form is submitted', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const submitButton = screen.getByText('✓ Claim Item');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitButton);
    
    expect(mockOnClaim).toHaveBeenCalledWith('John Doe', 'john@example.com');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should update input values when typing', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    
    expect(nameInput.value).toBe('Jane Smith');
    expect(emailInput.value).toBe('jane@example.com');
  });

  it('should submit form on Enter key press', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.submit(emailInput.closest('form')!);
    
    expect(mockOnClaim).toHaveBeenCalledWith('John Doe', 'john@example.com');
  });

  it('should display info alert about surprise protection', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Reserved and Secret/i)).toBeInTheDocument();
    expect(screen.getByText(/wishlist owner won't see your claim/i)).toBeInTheDocument();
  });

  it('should validate email format', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    
    // HTML5 validation should prevent invalid emails
    expect(emailInput.type).toBe('email');
  });

  it('should require both name and email fields', () => {
    render(<ClaimModal itemName={itemName} onClaim={mockOnClaim} onClose={mockOnClose} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    
    expect(nameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
  });
});
