var objToQuery = require('../utils/objToQuery.js');

module.exports = function(req, res) {
  res.redirect('https://slack.com/oauth/authorize' + objToQuery({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    scope: 'admin channels:read chat:write:bot',
    redirect_uri: 'http://' + req.headers.host + '/callback'
  }));
};