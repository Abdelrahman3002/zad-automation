const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('../config');

const db = new sqlite3.Database(config.dbPath);

const createTables = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      service TEXT NOT NULL,
      company TEXT NOT NULL,
      phone TEXT NOT NULL,
      type TEXT,
      notes TEXT,
      specs TEXT,
      submittedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      updatedAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      email TEXT,
      phone TEXT,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });

  seedDefaultUsers();
};

const seedDefaultUsers = () => {
  const saltRounds = config.bcryptSaltRounds;
  const now = new Date().toISOString();

  bcrypt.hash('admin123', saltRounds, (err, hashedPassword) => {
    if (err) return console.error('Error hashing admin password:', err);
    db.run(
      `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'admin', ?, NULL)`,
      ['admin', hashedPassword, now]
    );
  });

  bcrypt.hash('viewer123', saltRounds, (err, hashedPassword) => {
    if (err) return console.error('Error hashing viewer password:', err);
    db.run(
      `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'viewer', ?, NULL)`,
      ['viewer', hashedPassword, now]
    );
  });
};

module.exports = { db, createTables };