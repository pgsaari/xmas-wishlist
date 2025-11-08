import Database from 'better-sqlite3';
import path from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const dbPath = path.join(__dirname, '..', 'wishlist.db');
const db = new Database(dbPath);

<<<<<<< Updated upstream
// Enable foreign keys
db.pragma('foreign_keys = ON');
=======
// Determine the database path
// __dirname will be either 'src' (when running with tsx) or 'dist' (when running compiled)
// We want db.json in the backend directory, which is one level up from src/dist
const dbPath = path.join(__dirname, '..', 'db.json');

// Ensure the directory exists
const ensureDbDir = async () => {
  const dbDir = path.dirname(dbPath);
  if (!existsSync(dbDir)) {
    await mkdir(dbDir, { recursive: true });
  }
};
>>>>>>> Stashed changes

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

<<<<<<< Updated upstream
  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT 'My Christmas Wishlist',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
=======
// Initialize database - load data
const initDb = async () => {
  // Ensure the database directory exists
  await ensureDbDir();
  await db.read();
  // Ensure default structure exists
  if (!db.data) {
    db.data = {
      users: [],
      wishlists: [],
      items: [],
      claims: [],
    };
    await db.write();
  }
};
>>>>>>> Stashed changes

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wishlist_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    link TEXT,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(item_id)
  );
`);

export default db;

