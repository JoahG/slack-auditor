require('dotenv').config();

var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var mongoose = require('mongoose');
var request = require('request');
var bodyParser = require("body-parser");
var csv = require('express-csv');

var objToQuery = function(obj) {
  return '?' + Object.keys(obj).map(function(key) {
    return key + '=' + obj[key];
  }).join('&');
};
var genID = function(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/slackAuditorTesting')

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

app.get('/', function(req, res) {
  res.render('home');
});

app.get('/auth', function(req, res) {
  res.redirect('https://slack.com/oauth/authorize' + objToQuery({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    scope: 'admin channels:read chat:write:bot',
    redirect_uri: 'http://' + req.headers.host + '/callback'
  }));
});

app.get('/callback', function(req, res) {
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
});

app.get('/config/:id', function(req, res) {
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
});

app.post('/config', function(req, res) {
  SlackConfig.findOne({ id: req.body.config_id }, function(err, config) {
    config.channel_id = req.body.channel_id;
    if (req.body.polling) { config.polling = true; } else { config.polling = false; }

    config.save(function() {
      res.redirect('/config/' + req.body.config_id + '?saved=true');
    })
  })
});

app.get('/export/:id', function(req, res) {
  SlackConfig.findOne({ id: req.params.id }, function(err, config) {
    var getPages = function(p, logins, next) {
      request({
        method: 'GET',
        uri: 'https://slack.com/api/team.accessLogs' + objToQuery({
          token: config.access_token,
          count: 1000,
          page: p
        })
      }, function(err, resp, body) {
        var data = JSON.parse(body);
        if (data.paging.page < data.paging.pages) {
          getPages(p + 1, logins.concat(data.logins), next);
        } else {
          next(logins.concat(data.logins));
        }
      })
    }

    getPages(1, [], function(logins) {
      res.csv([Object.keys(logins[0])].concat(logins));
    });
  });
});

app.listen(process.env.PORT || 3000)

var lastRun = Math.floor(((new Date()) - 10)/1000);

setInterval(function() {
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
}, 5000)