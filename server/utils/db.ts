// Detect environment: Development or Cloudflare
const isCloudflare = process.env.CF_PAGES || process.env.CLOUDFLARE_WORKER;

// Import via Node.js Module API - works in ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Database interface - will be implemented differently based on environment
let dbImpl = {
  async query(sql: string, params: any[] = []) {
    throw new Error('Database not initialized');
  },
  async exec(sql: string) {
    throw new Error('Database not initialized');
  }
};

// Database instance
let db;

// Initialize database based on environment
function initializeDatabase() {
  // Import development dependencies if not in Cloudflare
  if (!isCloudflare) {
    try {
      // Use require for better-sqlite3 and fs
      const betterSqlite3 = require('better-sqlite3');
      const fs = require('fs');
      const path = require('path');
      
      // Set up local SQLite
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const dbPath = path.join(dataDir, 'grow.sqlite');
      const localDb = betterSqlite3(dbPath);
      
      // Initialize tables
      initLocalDb(localDb);
      
      // Set up the database interface for local development
      dbImpl = {
        async query(sql: string, params: any[] = []) {
          const stmt = localDb.prepare(sql);
          if (sql.trim().toLowerCase().startsWith('select')) {
            return stmt.all(...params);
          } else {
            return stmt.run(...params);
          }
        },
        async exec(sql: string) {
          return localDb.exec(sql);
        }
      };
      
      db = localDb;
      console.log('Local SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing local database:', error);
    }
  } else {
    // Cloudflare environment - using D1
    console.log('Running in Cloudflare environment, using D1 database');
  }
}

// Initialize database on module load
initializeDatabase();

// Initialize SQLite database for local development
function initLocalDb(db: any) {
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

// User operations - abstracting away the database implementation
export const userOperations = {
  findById: {
    get: async (id: string) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
      } else {
        // D1 implementation
        const result = await dbImpl.query('SELECT * FROM users WHERE id = ?', [id]);
        return result.length > 0 ? result[0] : null;
      }
    }
  },
  
  findByEmail: {
    get: async (email: string) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
      } else {
        // D1 implementation
        const result = await dbImpl.query('SELECT * FROM users WHERE email = ?', [email]);
        return result.length > 0 ? result[0] : null;
      }
    }
  },
  
  createUser: {
    run: async (id: string, email: string, name: string | null) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)');
        return stmt.run(id, email, name);
      } else {
        // D1 implementation
        return await dbImpl.query(
          'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)',
          [id, email, name]
        );
      }
    }
  },
  
  updateUser: {
    run: async (name: string, id: string) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('UPDATE users SET name = ? WHERE id = ?');
        return stmt.run(name, id);
      } else {
        // D1 implementation
        return await dbImpl.query(
          'UPDATE users SET name = ? WHERE id = ?',
          [name, id]
        );
      }
    }
  }
};

// Document operations
export const documentOperations = {
  getByUserId: {
    get: async (userId: string) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('SELECT * FROM mission_documents WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
        return stmt.get(userId);
      } else {
        // D1 implementation
        const result = await dbImpl.query(
          'SELECT * FROM mission_documents WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        return result.length > 0 ? result[0] : null;
      }
    }
  },
  
  create: {
    run: async (userId: string, content: string) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('INSERT INTO mission_documents (user_id, content) VALUES (?, ?)');
        return stmt.run(userId, content);
      } else {
        // D1 implementation
        return await dbImpl.query(
          'INSERT INTO mission_documents (user_id, content) VALUES (?, ?)',
          [userId, content]
        );
      }
    }
  },
  
  update: {
    run: async (content: string, id: number) => {
      if (!isCloudflare) {
        // Local SQLite implementation
        const stmt = db.prepare('UPDATE mission_documents SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(content, id);
      } else {
        // D1 implementation
        return await dbImpl.query(
          'UPDATE mission_documents SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [content, id]
        );
      }
    }
  },
  
  // This allows creating a new document if none exists, or updating the latest one
  upsert: async (userId: string, content: string) => {
    const existingDoc = await documentOperations.getByUserId.get(userId);
    
    if (existingDoc) {
      await documentOperations.update.run(content, existingDoc.id);
      return { ...existingDoc, content, updated_at: new Date().toISOString() };
    } else {
      const result = await documentOperations.create.run(userId, content);
      return { 
        id: !isCloudflare ? result.lastInsertRowid : result.meta?.last_row_id, 
        user_id: userId, 
        content, 
        updated_at: new Date().toISOString() 
      };
    }
  }
};

// Create and export D1 database binding setup function for Cloudflare
export function setD1Database(d1Database: any) {
  if (isCloudflare) {
    dbImpl = {
      async query(sql: string, params: any[] = []) {
        const result = await d1Database.prepare(sql).bind(...params).all();
        return result.results;
      },
      async exec(sql: string) {
        return await d1Database.exec(sql);
      }
    };
  }
}

export default isCloudflare ? null : db;