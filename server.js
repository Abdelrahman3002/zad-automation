require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const config = require('./src/server/config');
const { db, createTables } = require('./src/server/config/database');
const { dashboardChangeEmitter } = require('./src/server/services/dashboard');
const authRoutes = require('./src/server/routes/auth');
const requestRoutes = require('./src/server/routes/requests');
const statsRoutes = require('./src/server/routes/stats');
const eventsRoutes = require('./src/server/routes/events');

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  skip: (req) => req.originalUrl === '/api/events'
});
app.use(limiter);

app.set('dashboardChangeEmitter', dashboardChangeEmitter);

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

createTables();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/events', eventsRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Zad Automation Server running on http://localhost:${PORT}`);
  console.log(`Customer site: http://localhost:${PORT}/zad_automation_website.html`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
});

module.exports = app;