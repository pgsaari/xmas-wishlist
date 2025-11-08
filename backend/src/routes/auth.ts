import express, { Request, Response } from 'express';
import { dbHelpers } from '../database';
import { hashPassword, comparePassword, generateToken } from '../auth';
import { CreateUserRequest, LoginRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name }: CreateUserRequest = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = dbHelpers.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await dbHelpers.createUser({
      email,
      password_hash: passwordHash,
      name,
      created_at: new Date().toISOString(),
    });

    // Create default wishlist
    const shareToken = uuidv4();
    await dbHelpers.createWishlist({
      user_id: newUser.id,
      share_token: shareToken,
      title: 'My Christmas Wishlist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Generate token
    const token = generateToken(newUser.id, email);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = dbHelpers.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

