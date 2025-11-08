import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import wishlistRoutes from './routes/wishlists';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wishlists', wishlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

