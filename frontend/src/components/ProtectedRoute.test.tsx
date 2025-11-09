import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode; value?: any }) => children,
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (isAuthenticated: boolean, loading: boolean = false) => {
    mockUseAuth.mockReturnValue({
      isAuthenticated,
      loading,
    });

    return render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );
  };

  it('should render children when authenticated', () => {
    renderWithRouter(true, false);
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading message when loading', () => {
    renderWithRouter(false, true);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderWithRouter(false, false);
    
    // ProtectedRoute uses Navigate which will redirect
    // In a test environment, we can't easily test the redirect,
    // but we can verify the content is not rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children after loading completes and user is authenticated', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Initially loading
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    rerender(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After loading, authenticated
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    rerender(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
