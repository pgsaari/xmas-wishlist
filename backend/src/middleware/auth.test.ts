import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from './auth';
import { verifyToken } from '../auth';

// Mock auth functions
vi.mock('../auth', async () => {
  const actual = await vi.importActual('../auth');
  return {
    ...actual,
    verifyToken: vi.fn(),
  };
});

describe('authenticate middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('should call next() when valid token is provided', () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 1,
      email: 'test@example.com',
    });

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.userId).toBe(1);
    expect(mockRequest.userEmail).toBe('test@example.com');
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no authorization header is provided', () => {
    mockRequest.headers = {};

    authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(verifyToken).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(verifyToken).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(verifyToken).toHaveBeenCalledWith('invalid-token');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should extract token correctly from Bearer header', () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 1,
      email: 'test@example.com',
    });

    mockRequest.headers = {
      authorization: 'Bearer token-with-spaces',
    };

    authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(verifyToken).toHaveBeenCalledWith('token-with-spaces');
    expect(mockNext).toHaveBeenCalled();
  });
});
