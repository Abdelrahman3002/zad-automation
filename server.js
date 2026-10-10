require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const { EventEmitter } = require('events');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
    skip: (req) => req.path === '/api/events' // SSE connections must not be rate limited
});
app.use(limiter);

// Dashboard real-time updates via SSE
const dashboardChangeEmitter = new EventEmitter();

function notifyDashboardChange(type, extra = {}) {
    const payload = {
        timestamp: new Date().toISOString(),
        ...type,
        ...extra
    };
    dashboardChangeEmitter.emit('change', payload);
}

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
        email TEXT,
        phone TEXT,
        createdAt TEXT NOT NULL,
        lastLogin TEXT
    )`);

    // Create password reset tokens table
    db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
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

// Generate a unique request ID
function generateId() {
    return crypto.randomBytes(10).toString('hex');
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

// API: User Signup (customer registration)
app.post('/api/auth/signup', (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'اسم المستخدم والبريد الإلكتروني مطلوبان' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }

        if (existingUser) {
            return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }

        // Hash password
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'حدث خطأ في تشفير كلمة المرور' });
            }

            const createdAt = new Date().toISOString();

            // Create new customer user
            db.run(
                `INSERT INTO users (username, password, role, email, phone, createdAt, lastLogin) VALUES (?, ?, 'customer', ?, ?, ?, NULL)`,
                [username, hashedPassword, email, phone, createdAt],
                function (err) {
                    if (err) {
                        console.error('Signup insert error:', err);
                        return res.status(500).json({ error: 'فشل في إنشاء الحساب' });
                    }

                    res.status(201).json({
                        message: 'تم إنشاء الحساب بنجاح',
                        user: {
                            id: this.lastID,
                            username,
                            email,
                            phone,
                            role: 'customer'
                        }
                    });
                }
            );
        });
    });
});

// API: Forgot password - send reset token via email
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({ message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours
        const createdAt = new Date().toISOString();

        // Store token in database
        db.run(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
            [user.id, resetToken, expiresAt, createdAt],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'حدث خطأ في إنشاء الرمز' });
                }

                // Send reset email
                try {
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL || 'no-reply@zad-automation.com',
                        to: user.email,
                        subject: 'إعادة تعيين كلمة المرور - Zad Automation',
                        text: `لقد تم طلب إعادة تعيين كلمة المرور لحسابك.\n\nالرابط صالح لمدة 24 ساعة:\n${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}\n\nإذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.\n\nفريق دعم Zad Automation`,
                        html: `
                            <h2>إعادة تعيين كلمة المرور</h2>
                            <p>تم طلب إعادة تعيين كلمة المرور لحسابك.</p>
                            <p><strong>الرابط صالح لمدة 24 ساعة.</strong></p>
                            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a></p>
                            <p>إذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
                            <p>فريق دعم Zad Automation</p>
                        `
                    };

                    if (emailTransporter) {
                        emailTransporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.error('Error sending reset email:', error);
                                // Don't fail the request if email fails
                            }
                        });
                    }
                } catch (emailError) {
                    console.error('Email setup error:', emailError);
                }

                res.json({ message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' });
            }
        );
    });
});

// API: Reset password with token
app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'رمز التعيين وكلمة المرور الجديدة مطلوبتان' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'يجب أن تكون كلمة المرور الجديدة على الأقل 6 حروف' });
    }

    // Find valid, unused token
    db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?', [token, new Date().toISOString()], (err, resetToken) => {
        if (err) {
            return res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }

        if (!resetToken) {
            return res.status(400).json({ error: 'رمز التعيين غير صالح أو منتهي الصلاحية' });
        }

        // Get user details
        db.get('SELECT * FROM users WHERE id = ?', [resetToken.user_id], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'حدث خطأ في الخادم' });
            }

            if (!user) {
                return res.status(404).json({ error: 'المستخدم غير موجود' });
            }

            // Hash new password
            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ error: 'حدث خطأ في تشفير كلمة المرور' });
                }

                // Update user password
                db.run(
                    `UPDATE users SET password = ? WHERE id = ?`,
                    [hashedPassword, user.id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'حدث خطأ في حفظ كلمة المرور' });
                        }

                        // Mark token as used
                        db.run(
                            `UPDATE password_reset_tokens SET used = 1 WHERE id = ?`,
                            [resetToken.id],
                            (err) => {
                                if (err) {
                                    console.error('Error marking token as used:', err);
                                }

                                res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' });
                            }
                        );
                    }
                );
            });
        });
    });
});

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

            // Notify dashboard clients of new request (real-time update)
            notifyDashboardChange({ event: 'request-created', id });

            // Send email notification for new request
            sendNewRequestNotification({ id, service, company, phone, type, notes, specs, submittedAt, status: 'new' });

            res.status(201).json({
                id, service, company, phone, type, notes, specs, submittedAt, status: 'new'
            });
        }
    );
});

// Protected: All API routes below require authentication
app.use(authenticateToken);

// API: Get customer's own requests (protected)
app.get('/api/requests/my', (req, res) => {
    const { phone } = req.user;

    if (!phone) {
        return res.status(400).json({ error: 'لا يمكن جلب الطلبات بدون رقم هاتف' });
    }

    db.all('SELECT * FROM requests WHERE phone = ? ORDER BY submittedAt DESC', [phone], (err, rows) => {
        if (err) {
            console.error('Error fetching own requests:', err);
            return res.status(500).json({ error: 'Failed to fetch your requests' });
        }
        res.json(rows);
    });
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

            // Notify dashboard clients of request update
            notifyDashboardChange({ event: 'request-updated', id: req.params.id, status });

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

        // Notify dashboard clients of request deletion
        notifyDashboardChange({ event: 'request-deleted', id: req.params.id });

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