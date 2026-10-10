const express = require('express');
const router = express.Router();

// SSE endpoint: real-time updates for admin dashboard (public, client uses token for actual data fetches)
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const dashboardChangeEmitter = req.app.get('dashboardChangeEmitter');

  const handler = (payload) => {
    if (res.writable) {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) {
        // client disconnected
      }
    }
  };

  if (dashboardChangeEmitter) {
    dashboardChangeEmitter.on('change', handler);
  }

  req.on('close', () => {
    if (dashboardChangeEmitter) {
      dashboardChangeEmitter.removeListener('change', handler);
    }
  });

  req.on('error', () => {
    if (dashboardChangeEmitter) {
      dashboardChangeEmitter.removeListener('change', handler);
    }
  });
});

module.exports = router;