const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  slack
});

const Config = mongoose.model('Config', configSchema);
module.exports = Config;
