/*jshint esversion: 6 */
const cheerio = require('cheerio')
const request = require('request')
const api = require('.././api.js')

function validateUrl(value, callback) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}

var getStockData = function(url, handle, callback) {
    // pickup stock and status
    var status
    var totalStock = 0
    request({
        url: 'http://' + url + '/products/' + handle + '.json',
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {

        if (tryParseJSON(body)) {
            var jsonBodyProduct = JSON.parse(body)

            for (var i = 0; i < jsonBodyProduct.product.variants.length; i++) {
                totalStock += jsonBodyProduct.product.variants[i].inventory_quantity
            }

            if (totalStock > 0) {
                status = 'Available'
            } else {
                status = 'Sold Out'
            }

            var data = {
                stock: totalStock,
                status: status
            }

            console.log(data)

            // return callback(data, null)

        } else {
            console.log('error', 'No valid JSON was returned.')
            return process.exit()
        }
    })
}

var shopify = function(url, callback) {

    request({
        url: 'http://' + url + '/products.json',
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {
        if (err || body === undefined) {
            return callback(null, 'No response data was sent back.');
        }

        if (tryParseJSON(body)) {
            var products = JSON.parse(body).products
        } else {
            console.log('error', 'No valid JSON was returned.')
            return process.exit()
        }

        if (products) {

            var response = {
                productDetails: []
            }

            for (var i = 0; i < products.length; i++) {

                /*
                  getStockData(url, products[i].handle, (res, err) => {
                      if (err) {
                          api.log('error', `Error occured while fetching stock data from ${url}`)
                          return process.exit()
                      }
                      console.log('stock', res)
                      //var stock = response
                  })
                */

                var parsedDroduct = {
                    name: products[i].title,
                    price: '$' + products[i].variants[0].price,
                    status: 'Unavailable',
                    link: 'http://' + url + '/products/' + products[i].handle,
                    image: products[i].images[0].src,
                    brand: products[i].vendor,
                    id: products[i].id
                }

                response.productDetails.push(JSON.stringify(parsedDroduct))
            }

            return callback(response, null)
        }

    })
}

function tryParseJSON(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {}
    return false;
};

module.exports = {
    validateUrl: validateUrl,
    shopify: shopify,
    list: [
        'assc',
        'palace'
    ],
    assc: require('./sites/assc'),
    palace: require('./sites/palace')
};
