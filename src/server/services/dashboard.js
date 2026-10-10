const { EventEmitter } = require('events');

const dashboardChangeEmitter = new EventEmitter();

function notifyDashboardChange(type, extra = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...type,
    ...extra
  };
  dashboardChangeEmitter.emit('change', payload);
}

module.exports = { dashboardChangeEmitter, notifyDashboardChange };