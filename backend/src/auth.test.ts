import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword, generateToken, verifyToken } from './auth';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      const result = await hashPassword('password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toBe('hashed-password');
    });
  });

  describe('comparePassword', () => {
    it('should compare password with hash using bcrypt', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await comparePassword('password123', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await comparePassword('wrong-password', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with userId and email', () => {
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      const result = generateToken(1, 'test@example.com');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'test@example.com' },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe('mock-token');
    });

    it('should use default secret when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      generateToken(1, 'test@example.com');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'test@example.com' },
        'default-secret-change-in-production',
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode JWT token', () => {
      const decoded = { userId: 1, email: 'test@example.com' };
      vi.mocked(jwt.verify).mockReturnValue(decoded as never);

      const result = verifyToken('mock-token');

      expect(jwt.verify).toHaveBeenCalledWith('mock-token', 'test-secret');
      expect(result).toEqual(decoded);
    });

    it('should throw error when token is invalid', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error when token verification fails', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      expect(() => verifyToken('malformed-token')).toThrow('Invalid token');
    });
  });
});
