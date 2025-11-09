import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/auth';

// Mock the auth API
vi.mock('../api/auth', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout, loading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test User')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide default values', () => {
    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should load current user on mount', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authApi.authApi.getCurrentUser).toHaveBeenCalled();
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should handle login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(null);
    vi.mocked(authApi.authApi.login).mockResolvedValue({
      token: 'mock-token',
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(authApi.authApi.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should handle register', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(null);
    vi.mocked(authApi.authApi.register).mockResolvedValue({
      token: 'mock-token',
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    
    await act(async () => {
      registerButton.click();
    });

    await waitFor(() => {
      expect(authApi.authApi.register).toHaveBeenCalledWith('test@example.com', 'password', 'Test User');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });

    expect(authApi.authApi.logout).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should set loading to false after initial load', async () => {
    vi.mocked(authApi.authApi.getCurrentUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
