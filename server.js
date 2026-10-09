require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'zad_requests.db');
const db = new sqlite3.Database(dbPath);

// Initialize requests table
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
});

// Generate unique request ID
function generateId() {
    const prefix = 'REQ-';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return prefix + timestamp + random;
}

// API: Submit a new request (customer side)
app.post('/api/requests', (req, res) => {
    const { service, company, phone, type, notes, specs } = req.body;
    if (!service || !company || !phone) {
        return res.status(400).json({ error: 'service, company, and phone are required' });
    }

    const id = generateId();
    const submittedAt = new Date().toISOString();

    db.run(
        `INSERT INTO requests (id, service, company, phone, type, notes, specs, submittedAt, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, service, company, phone, type || '', notes || '', specs || '', submittedAt, 'new'],
        function (err) {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Failed to create request' });
            }
            res.status(201).json({
                id, service, company, phone, type, notes, specs, submittedAt, status: 'new'
            });
        }
    );
});

// API: Get all requests (admin side)
app.get('/api/requests', (req, res) => {
    const { status, search } = req.query;
    let query = 'SELECT * FROM requests';
    const params = [];

    const conditions = [];
    if (status && status !== 'all') {
        conditions.push('status = ?');
        params.push(status);
    }
    if (search) {
        conditions.push('(id LIKE ? OR company LIKE ? OR phone LIKE ? OR service LIKE ? OR type LIKE ? OR notes LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like, like, like, like);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY submittedAt DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Select error:', err);
            return res.status(500).json({ error: 'Failed to fetch requests' });
        }
        res.json(rows);
    });
});

// API: Get single request
app.get('/api/requests/:id', (req, res) => {
    db.get('SELECT * FROM requests WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch request' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(row);
    });
});

// API: Update request status
app.put('/api/requests/:id', (req, res) => {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'status is required' });
    }

    db.run(
        'UPDATE requests SET status = ?, updatedAt = ? WHERE id = ?',
        [status, new Date().toISOString(), req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update request' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }
            res.json({ success: true, id: req.params.id, status });
        }
    );
});

// API: Delete request
app.delete('/api/requests/:id', (req, res) => {
    db.run('DELETE FROM requests WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete request' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json({ success: true, id: req.params.id });
    });
});

// API: Get stats
app.get('/api/stats', (req, res) => {
    db.all(
        `SELECT status, COUNT(*) as count FROM requests GROUP BY status`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch stats' });
            }
            const stats = { total: 0, new: 0, confirmed: 0, progress: 0, done: 0, closed: 0 };
            rows.forEach(r => {
                stats[r.status] = r.count;
                stats.total += r.count;
            });
            res.json(stats);
        }
    );
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Zad Automation Server running on http://localhost:${PORT}`);
    console.log(`Customer site: http://localhost:${PORT}/zad_automation_website.html`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
});