// Seed admin users script
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'data', 'zad_requests.db');

// Initialize database
const db = new sqlite3.Database(dbPath);

async function seedAdminUsers() {
    try {
        console.log('Seeding admin users...');
        
        // Create users table if not exists
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                createdAt TEXT NOT NULL,
                lastLogin TEXT
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Hash password
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash('admin123', 10, (err, hash) => {
                if (err) reject(err);
                else resolve(hash);
            });
        });
        
        // Insert admin user if not exists
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'admin', ?, NULL)`,
                ['admin', hashedPassword, new Date().toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });
        
        // Insert viewer user if not exists
        const viewerPassword = await new Promise((resolve, reject) => {
            bcrypt.hash('viewer123', 10, (err, hash) => {
                if (err) reject(err);
                else resolve(hash);
            });
        });
        
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'viewer', ?, NULL)`,
                ['viewer', viewerPassword, new Date().toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });
        
        console.log('Admin users seeded successfully!');
        console.log('Default admin credentials:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  Role: admin');
        console.log('');
        console.log('Default viewer credentials:');
        console.log('  Username: viewer');
        console.log('  Password: viewer123');
        console.log('  Role: viewer');
        
    } catch (error) {
        console.error('Error seeding admin users:', error);
        process.exit(1);
    }
}

// Run seeding
seedAdminUsers().then(() => {
    db.close();
    console.log('Database connection closed.');
}).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});