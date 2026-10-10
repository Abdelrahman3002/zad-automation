const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { db } = require('../config/database');

router.get('/', authenticateToken, authorizeRole(['admin', 'viewer']), (req, res) => {
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

module.exports = router;