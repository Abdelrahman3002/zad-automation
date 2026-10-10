const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const config = require('../config');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db, createTables } = require('../config/database');
const { sendResetEmail } = require('../services/email');

router.post('/login', (req, res) => {
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

      db.run(
        `UPDATE users SET lastLogin = ? WHERE id = ?`,
        [new Date().toISOString(), user.id],
        (err) => {
          if (err) {
            console.error('Update lastLogin error:', err);
          }

          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
          );

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
    });
  });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

router.post('/signup', (req, res) => {
  const { username, password, email, phone } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'اسم المستخدم والبريد الإلكتروني مطلوبان' });
  }

  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }

    bcrypt.hash(password, config.bcryptSaltRounds, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'حدث خطأ في تشفير كلمة المرور' });
      }

      const createdAt = new Date().toISOString();

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

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }

    if (!user) {
      return res.json({ message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
      [user.id, resetToken, expiresAt, createdAt],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'حدث خطأ في إنشاء الرمز' });
        }

        sendResetEmail(user, resetToken).catch(console.error);

        res.json({ message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين' });
      }
    );
  });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'رمز التعيين وكلمة المرور الجديدة مطلوبتان' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'يجب أن تكون كلمة المرور الجديدة على الأقل 6 حروف' });
  }

  db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?', [token, new Date().toISOString()], (err, resetToken) => {
    if (err) {
      return res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }

    if (!resetToken) {
      return res.status(400).json({ error: 'رمز التعيين غير صالح أو منتهي الصلاحية' });
    }

    db.get('SELECT * FROM users WHERE id = ?', [resetToken.user_id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'حدث خطأ في الخادم' });
      }

      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      bcrypt.hash(newPassword, config.bcryptSaltRounds, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'حدث خطأ في تشفير كلمة المرور' });
        }

        db.run(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'حدث خطأ في حفظ كلمة المرور' });
            }

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

module.exports = router;