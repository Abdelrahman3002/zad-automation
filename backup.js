// Backup script for SQLite database
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'zad_requests.db');
const backupDir = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Generate backup filename with timestamp
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

console.log('Starting database backup...');

// Open database
const db = new sqlite3.Database(dbPath);

// Backup using SQLite VACUUM INTO
db.serialize(() => {
    db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
        if (err) {
            console.error('Backup error:', err);
            db.close();
            process.exit(1);
        }

        console.log(`Backup created successfully: ${backupPath}`);

        db.close(() => {
            // Clean up old backups (keep last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            fs.readdir(backupDir, (err, files) => {
                if (err) return;

                files.forEach(file => {
                    const filePath = path.join(backupDir, file);
                    fs.stat(filePath, (err, stats) => {
                        if (err) return;

                        if (stats.mtime < sevenDaysAgo) {
                            fs.unlink(filePath, (err) => {
                                if (err) console.error(`Error deleting old backup: ${file}`);
                            });
                        }
                    });
                });
            });
        });
    });
});
