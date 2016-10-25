var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/slackAuditorTestingDatabase')

var SlackConfig = mongoose.model('SlackConfig', {
  id: String,
  code: String,
  state: String,
  access_token: String,
  scope: String,
  team_name: String,
  team_id: String,
  user_id: String,
  polling: Boolean,
  channel_id: String
});

module.exports = SlackConfig;