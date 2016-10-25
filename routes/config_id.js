var request = require('request');
var SlackConfig = require('../utils/SlackConfig.js');
var objToQuery = require('../utils/objToQuery.js');

module.exports = function(req, res) {
  SlackConfig.findOne({ id: req.params.id }, function(err, config) {
    if (config == null) return res.redirect('/');

    request({
      method: 'GET',
      uri: 'https://slack.com/api/channels.list' + objToQuery({
        token: config.access_token
      })
    }, function(err, resp, body) {
      var data = JSON.parse(body);
      res.render('config', {
        team_name: config.team_name,
        config_id: config.id,
        polling: config.polling,
        channel_id: config.channel_id,
        channels: data.channels,
        helpers: {
          isSelected: function(t) {
            return t == config.channel_id ? 'selected' : '';
          },
          isChecked: function() {
            return config.polling ? 'checked' : '';
          }
        }
      });
    });
  });
}