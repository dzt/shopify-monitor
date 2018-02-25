const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  url: String,
  seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller'
  },
  lastModification: String
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
