const request = require('request');
const service = require('./service');
const chalk = require('chalk');
const log = require('./utils/log');

var start = function(data, callback) {
  if (data.startsWith("http") || data.startsWith("https")) {
    service.init(data, data, true);
  } else {
    service.init(data, "https://" + data, true);
  }
  return callback(null, true);
}

module.exports = {
  start: start
};
