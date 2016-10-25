var SlackConfig = require('../utils/SlackConfig.js');

module.exports = function(req, res) {
  SlackConfig.findOne({ id: req.body.config_id }, function(err, config) {
    config.channel_id = req.body.channel_id;
    if (req.body.polling) { config.polling = true; } else { config.polling = false; }

    config.save(function() {
      res.redirect('/config/' + req.body.config_id + '?saved=true');
    });
  });
};