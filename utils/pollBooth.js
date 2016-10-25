var lastRun = Math.floor(((new Date()) - 10)/1000),
    SlackConfig = require('./SlackConfig.js'),
    objToQuery = require('./objToQuery.js'),
    request = require('request');

module.exports = setInterval(function() {
  SlackConfig.find({ polling: true }, function(err, configs) {
    configs.forEach(function(config) {
      var logAccess = function(page) {
        request({
          method: 'GET',
          uri: 'https://slack.com/api/team.accessLogs' + objToQuery({
            token: config.access_token,
            count: 500,
            page: 1
          })
        }, function(err, resp, body) {
          var data = JSON.parse(body);

          for (var i = 0; i < data.logins.length; i++) {
            var login = data.logins[i];

            if (login.date_last >= Math.floor(lastRun)) {
              request({
                method: 'GET',
                uri: 'https://slack.com/api/chat.postMessage' + objToQuery({
                  token: config.access_token,
                  channel: config.channel_id,
                  text: '<@' + login.user_id + '> just logged in from ' + login.ip + '. ```' + (function() {
                    var fields = ['user_agent', 'isp', 'country', 'region'];
                    var ret = '';
                    fields.forEach(function(field) {
                      if (login[field] && login[field].length > 0) {
                        ret += '\n' + field + ': ' + login[field];
                      }
                    });
                    return ret;
                  })() + '```',
                  icon_emoji: ':police_car:'
                })
              });

              if (i + 1 == data.logins.length) {
                logAccess(2);
              }
            } else {
              lastRun = Math.floor(((new Date()) - 10)/1000);
              break;
            }
          }
        });
      };

      logAccess(1);
    });
  });
}, 5000);