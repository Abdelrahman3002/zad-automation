const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { db } = require('../config/database');
const { sendNewRequestNotification } = require('../services/email');
const { notifyDashboardChange } = require('../services/dashboard');

router.post('/', (req, res) => {
  const { service, company, phone, type, notes, specs } = req.body;
  if (!service || !company || !phone) {
    return res.status(400).json({ error: 'service, company, and phone are required' });
  }

  const id = crypto.randomBytes(10).toString('hex');
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

      notifyDashboardChange({ event: 'request-created', id });
      sendNewRequestNotification({ id, service, company, phone, type, notes, specs, submittedAt, status: 'new' });

      res.status(201).json({
        id, service, company, phone, type, notes, specs, submittedAt, status: 'new'
      });
    }
  );
});

router.get('/my', authenticateToken, (req, res) => {
  const { phone } = req.user;

  if (!phone) {
    return res.status(400).json({ error: 'لا يمكن جلبطلب بدون رقم هاتف' });
  }

  db.all('SELECT * FROM requests WHERE phone = ? ORDER BY submittedAt DESC', [phone], (err, rows) => {
    if (err) {
      console.error('Error fetching own requests:', err);
      return res.status(500).json({ error: 'Failed to fetch your requests' });
    }
    res.json(rows);
  });
});

router.get('/', authenticateToken, authorizeRole(['admin', 'viewer']), (req, res) => {
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

router.get('/:id', authenticateToken, authorizeRole(['admin', 'viewer']), (req, res) => {
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

router.put('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
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

      notifyDashboardChange({ event: 'request-updated', id: req.params.id, status });

      res.json({ success: true, id: req.params.id, status });
    }
  );
});

router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  db.run('DELETE FROM requests WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete request' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    notifyDashboardChange({ event: 'request-deleted', id: req.params.id });
    res.json({ success: true, id: req.params.id });
  });
});

module.exports = router;