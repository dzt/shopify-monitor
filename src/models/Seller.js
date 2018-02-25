const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  url: String,
  lastItemAdded: String,
  lastItemCount: Number,
  proxies: [String],
  keywords: [String],
  pollMS: Number
});

const Seller = mongoose.model('Seller', sellerSchema);
module.exports = Seller;
