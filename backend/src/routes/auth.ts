import express, { Request, Response } from 'express';
import db from '../database';
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
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(
      email,
      passwordHash,
      name
    );

    // Create default wishlist
    const shareToken = uuidv4();
    db.prepare('INSERT INTO wishlists (user_id, share_token) VALUES (?, ?)').run(result.lastInsertRowid, shareToken);

    // Generate token
    const token = generateToken(result.lastInsertRowid as number, email);

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
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

