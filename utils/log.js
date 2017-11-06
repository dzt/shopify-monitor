const chalk = require('chalk');

module.exports = function log(msg, type) {
  switch (type) {
    case 'warning':
      console.warn(msg);
      break;
    case 'error':
      console.error(msg);
      break;
    case 'info':
      console.info(msg);
      break;
    default:
      console.log(msg);
  }
};
