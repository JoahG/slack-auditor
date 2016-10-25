module.exports = {
  '/': require('./home.js'),
  '/auth': require('./auth.js'),
  '/callback': require('./callback.js'),
  '/config/:id': require('./config_id.js'),
  '/config': require('./config.js'),
  '/export/:id': require('./export_id.js')
};