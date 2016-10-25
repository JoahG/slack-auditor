var request = require('request'),
    SlackConfig = require('../utils/SlackConfig.js');

module.exports = function(req, res) {
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
      });
    };

    getPages(1, [], function(logins) {
      res.csv([Object.keys(logins[0])].concat(logins));
    });
  });
};