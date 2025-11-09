import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from './auth';

// Mock database helpers
vi.mock('../database', () => ({
  dbHelpers: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    createWishlist: vi.fn(),
  },
}));

// Mock auth functions
vi.mock('../auth', async () => {
  const actual = await vi.importActual('../auth');
  return {
    ...actual,
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    generateToken: vi.fn(),
  };
});

import { dbHelpers } from '../database';
import { hashPassword, comparePassword, generateToken } from '../auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockReturnValue(undefined);
      vi.mocked(hashPassword).mockResolvedValue('hashed-password');
      vi.mocked(dbHelpers.createUser).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        created_at: new Date().toISOString(),
      });
      vi.mocked(dbHelpers.createWishlist).mockResolvedValue({
        id: 1,
        user_id: 1,
        share_token: 'test-token',
        title: 'My Christmas Wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.mocked(generateToken).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(dbHelpers.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(dbHelpers.createUser).toHaveBeenCalled();
      expect(dbHelpers.createWishlist).toHaveBeenCalled();
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should return 400 if user already exists', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should return 500 on server error', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        created_at: new Date().toISOString(),
      });
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(generateToken).toHaveBeenCalled();
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 401 if user does not exist', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockReturnValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        created_at: new Date().toISOString(),
      });
      vi.mocked(comparePassword).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 500 on server error', async () => {
      vi.mocked(dbHelpers.getUserByEmail).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
