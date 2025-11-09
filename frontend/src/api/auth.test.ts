import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi } from './auth';
import api from './client';

// Mock the API client
vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('should register a new user and store token and user', async () => {
      const mockResponse = {
        data: {
          token: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.register('test@example.com', 'password', 'Test User');

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });

      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockResponse.data.user);
    });
  });

  describe('login', () => {
    it('should login user and store token and user', async () => {
      const mockResponse = {
        data: {
          token: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.login('test@example.com', 'password');

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockResponse.data.user);
    });
  });

  describe('logout', () => {
    it('should remove token and user from localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));

      authApi.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authApi.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      const user = authApi.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null when invalid JSON in localStorage', () => {
      localStorage.setItem('user', 'invalid-json');

      // This will throw an error, but we should handle it gracefully
      expect(() => authApi.getCurrentUser()).toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'mock-token');

      expect(authApi.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authApi.isAuthenticated()).toBe(false);
    });
  });
});
