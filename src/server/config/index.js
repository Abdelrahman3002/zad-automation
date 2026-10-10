require('dotenv').config();

const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'zad_automation_secret_key',
  jwtExpiresIn: '24h',
  bcryptSaltRounds: 10,
  dbPath: path.join(__dirname, '..', '..', '..', 'data', 'zad_requests.db'),
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.EMAIL_PASS || 'test-password'
    },
    sender: process.env.SENDER_EMAIL || 'no-reply@zad-automation.com',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@zad-automation.com'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};