require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests, please try again later.' });
app.use(limiter);

// Serve static files from the current directory
app.use(express.static(__dirname));

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'zad_requests.db');
const db = new sqlite3.Database(dbPath);

// ===== AUTHENTICATION SETUP =====

// Create users table and ensure it exists
db.serialize(() => {
    // Create requests table
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

    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        createdAt TEXT NOT NULL,
        lastLogin TEXT
    )`);

    // Insert default admin user if not exists (password: admin123 hashed)
    const saltRounds = 10;
    bcrypt.hash('admin123', saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }
        db.run(
            `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'admin', ?, NULL)`,
            ['admin', hashedPassword, new Date().toISOString()],
            (err) => {
                if (err) console.error('Error inserting admin user:', err);
            }
        );
    });

    // Insert default viewer user if not exists (password: viewer123 hashed)
    bcrypt.hash('viewer123', saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing viewer password:', err);
            return;
        }
        db.run(
            `INSERT OR IGNORE INTO users (username, password, role, createdAt, lastLogin) VALUES (?, ?, 'viewer', ?, NULL)`,
            ['viewer', hashedPassword, new Date().toISOString()],
            (err) => {
                if (err) console.error('Error inserting viewer user:', err);
            }
        );
    });
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'zad_automation_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}

// Role Authorization Middleware
function authorizeRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

// ===== EMAIL TRANSPORT SETUP =====

let emailTransporter = null;

try {
    const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
            user: process.env.EMAIL_USER || 'test@example.com',
            pass: process.env.EMAIL_PASS || 'test-password'
        }
    };

    emailTransporter = nodemailer.createTransporter(emailConfig);

    // Verify connection
    emailTransporter.verify((error) => {
        if (error) {
            console.warn('Email transporter not configured properly:', error.message);
        } else {
            console.log('Email server is ready to send notifications');
        }
    });
} catch (error) {
    console.warn('Email transporter setup failed:', error.message);
}

// Send notification email for new request
async function sendNewRequestNotification(request) {
    if (!emailTransporter) {
        console.warn('Email transporter not available, skipping notification');
        return;
    }

    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL || 'no-reply@zad-automation.com',
            to: process.env.ADMIN_EMAIL || 'admin@zad-automation.com',
            subject: `🔔 جديد: طلب دعم - ${request.id}`,
            text: `Received new support request:\n\nRequest ID: ${request.id}\nService: ${request.service}\nCompany: ${request.company}\nPhone: ${request.phone}\nType: ${request.type || 'غير محدد'}\nStatus: new\nSubmitted: ${request.submittedAt}\n\nView in admin dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000/admin.html'}`,
            html: `
                <h2>🔔 جديد: طلب دعم</h2>
                <p><strong>رقم الطلب:</strong> ${request.id}</p>
                <p><strong>الخدمة:</strong> ${request.service}</p>
                <p><strong>الشركة:</strong> ${request.company}</p>
                <p><strong>الهاتف:</strong> ${request.phone}</p>
                <p><strong>نوع العطل:</strong> ${request.type || 'غير محدد'}</p>
                <p><strong>الحالة:</strong> جديدة</p>
                <p><strong>تاريخ الاستلام:</strong> ${request.submittedAt}</p>
                <hr />
                <p>للوصول إلى لوحة التحكم، يرجى زيارة: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000/admin.html'}">${process.env.FRONTEND_URL || 'http://localhost:3000/admin.html'}</a></p>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`New request notification sent for request ${request.id}`);
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
}

// ===== API ROUTES =====

// API: User Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }

        if (!user) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                return res.status(500).json({ error: 'حدث خطأ في التحقق من كلمة المرور' });
            }

            if (!match) {
                return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            }

            // Update last login and generate JWT token
            db.run(
                `UPDATE users SET lastLogin = ? WHERE id = ?`,
                [new Date().toISOString(), user.id],
                (err) => {
                    if (err) {
                        console.error('Update lastLogin error:', err);
                    }

                    // Generate JWT token
                    jwt.sign(
                        { id: user.id, username: user.username, role: user.role },
                        process.env.JWT_SECRET || 'zad_automation_secret_key',
                        { expiresIn: '24h' },
                        (err, token) => {
                            if (err) {
                                return res.status(500).json({ error: 'حدث خطأ في إنشاء التوكن' });
                            }

                            res.json({
                                token,
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    role: user.role
                                }
                            });
                        }
                    );
                }
            );
        });
    });
});

// API: Get current user info (protected)
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Protected: All API routes below require authentication
app.use(authenticateToken);

// API: Submit a new request (customer side) - no auth required for customers
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

            // Send email notification for new request
            sendNewRequestNotification({ id, service, company, phone, type, notes, specs, submittedAt, status: 'new' });

            res.status(201).json({
                id, service, company, phone, type, notes, specs, submittedAt, status: 'new'
            });
        }
    );
});

// API: Get all requests (admin side) - with role check
app.get('/api/requests', authorizeRole(['admin', 'viewer']), (req, res) => {
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
app.get('/api/requests/:id', authorizeRole(['admin', 'viewer']), (req, res) => {
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
app.put('/api/requests/:id', authorizeRole(['admin']), (req, res) => {
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

// API: Delete request (admin only)
app.delete('/api/requests/:id', authorizeRole(['admin']), (req, res) => {
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
app.get('/api/stats', authorizeRole(['admin', 'viewer']), (req, res) => {
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