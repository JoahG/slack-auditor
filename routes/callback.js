var request = require('request');
var SlackConfig = require('../utils/SlackConfig.js');
var objToQuery = require('../utils/objToQuery.js');
var genID = require('../utils/genID.js');

module.exports = function(req, res) {
  request({
    method: 'GET',
    uri: 'https://slack.com/api/oauth.access' + objToQuery({
      client_id: process.env.client_id,
      client_secret: process.env.client_secret,
      code: req.query.code,
      redirect_uri: 'http://' + req.headers.host + '/callback',
    })
  }, function(err, resp, body) {
    var id = genID(20);
    var data = JSON.parse(body);

    var config = SlackConfig.findOne({
      team_name: data.team_name
    }, function(err, config) {
      if (config == null) {
        var newConfig = new SlackConfig({
          id: id,
          code: req.query.code,
          state: req.query.state,
          access_token: data.access_token,
          scope: data.scope,
          team_name: data.team_name,
          team_id: data.team_id,
          user_id: data.user_id,
          polling: false,
          channel_id: ''
        });

        newConfig.save(function() {
          res.redirect('/config/' + id);
        });
      } else {
        res.redirect('/config/' + config.id);
      }
    });
  });
}