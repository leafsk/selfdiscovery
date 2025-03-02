import Database from 'better-sqlite3';
import { join } from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create/connect to the database
const dbPath = join(dataDir, 'grow.sqlite');
const db = new Database(dbPath);

// Initialize tables if they don't exist
function initDb() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create mission_documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mission_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
}

// Initialize the database
initDb();

// User operations
export const userOperations = {
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  createUser: db.prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)'),
  updateUser: db.prepare('UPDATE users SET name = ? WHERE id = ?')
};

// Document operations
export const documentOperations = {
  getByUserId: db.prepare('SELECT * FROM mission_documents WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'),
  create: db.prepare('INSERT INTO mission_documents (user_id, content) VALUES (?, ?)'),
  update: db.prepare(`
    UPDATE mission_documents 
    SET content = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `),
  // This allows creating a new document if none exists, or updating the latest one
  upsert: db.transaction((userId: string, content: string) => {
    const existingDoc = documentOperations.getByUserId.get(userId);
    
    if (existingDoc) {
      documentOperations.update.run(content, existingDoc.id);
      return { ...existingDoc, content, updated_at: new Date().toISOString() };
    } else {
      const result = documentOperations.create.run(userId, content);
      return { 
        id: result.lastInsertRowid, 
        user_id: userId, 
        content, 
        updated_at: new Date().toISOString() 
      };
    }
  })
};

export default db;