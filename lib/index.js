/*jshint esversion: 6 */
const cheerio = require('cheerio')
const request = require('request').defaults({
    timeout: 30000
})
const api = require('.././api.js')
const iconv = require('iconv-lite')
const parseUrl = require("parse-url")
const parseString = require('xml2js').parseString

function validateUrl(value, callback) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}

var getStockData = function(url, callback) {
    // pickup stock and status
    var status
    var totalStock = 0

    request({
        url: url + '.json',
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {

        if (tryParseJSON(body)) {
            var jsonBodyProduct = JSON.parse(body)
            var data = []
            for (var i = 0; i < jsonBodyProduct.product.variants.length; i++) {
                totalStock += jsonBodyProduct.product.variants[i].inventory_quantity
            }

            if (totalStock > 0) {
                status = 'Available'
            } else {
                status = 'Sold Out'
            }

            if (isNaN(totalStock)) {
                var finalStock = 'Unavailable'
            } else {
                var finalStock = totalStock
            }

            if (jsonBodyProduct === undefined || jsonBodyProduct === null) {
              return console.log(`${url} - Site closed or crashed please remove from config.json to continue!`)
            }

            for (var i = 0; i < jsonBodyProduct.product.variants.length; i++) {
                var atclink = `<http://${parseUrl(url).resource}/cart/${jsonBodyProduct.product.variants[i].id}:1|${jsonBodyProduct.product.variants[i].option1}>`
                if (finalStock === 'Unavailable') {
                    var str = `${atclink} / <shopify://http://${parseUrl(url).resource}/cart/${jsonBodyProduct.product.variants[i].id}:1|ATC>`
                } else {
                    var str = `${atclink} / Stock: ${jsonBodyProduct.product.variants[i].inventory_quantity} / <shopify://http://${parseUrl(url).resource}/cart/${jsonBodyProduct.product.variants[i].id}:1|ATC>`
                }
                data.push(str)
            }

            var data = {
                stock: finalStock,
                status: status,
                links: data,
                price: '$' + jsonBodyProduct.product.variants[0].price
            }

            return callback(data, null)

        } else {
            return callback({
              stock: 'Unavailable',
              status: 'Unavailable',
              links: 'Unavailable',
              price: 'Unavailable'
            }, null)
        }
    })
}

var shopify = function(url, callback) {

    request({
        url: 'http://' + url + '/products.json',
        method: 'get',
        time: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {

        /*
        if (res.elapsedTime) {
          console.log(`Request time in ms (${url})`, res.elapsedTime);
        }
        */

        if (err || body === undefined) {
            return callback(null, 'No response data was sent back.');
        }

        if (tryParseJSON(body)) {
            var products = JSON.parse(body).products
        } else {
            return callback(null, `No valid JSON was returned, but monitor will continue with other site(s) and try to gather data again. (${url})`)
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

var shopifyXML = function(url, callback) {
    request({
        url: url,
        method: 'get',
        encoding: null,
        gzip: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
        }
    }, function(err, res, body) {

        if (err || body === undefined) {
            return callback('nothing was returned', null)
        }

        var bodyWithCorrectEncoding = iconv.decode(body, 'iso-8859-1');

        parseString(bodyWithCorrectEncoding, function(err, result) {
            if (err) {
                return console.log(`Invalid XML Output, but monitor will continue with other site(s) and try to gather data again. (${url})`)
            }
            var response = {
                productDetails: []
            }

            if (result === null) {
                console.log(`${url} crashed.`)
                return callback(response, null)
                // process.exit()
            }

            var products = result.urlset.url

            for (var i = 0; i < products.length; i++) {

                if (products[i]['image:image'] === undefined) {
                    var name = 'Unavailable'
                    var image = 'Unavailable'
                } else {
                    if (products[i]['image:image'][0]['image:title'] === undefined) {
                        console.log(`${url} is not compatible.`)
                        process.exit()
                    }
                    var name = products[i]['image:image'][0]['image:title'][0]
                    var image = products[i]['image:image'][0]['image:loc'][0]
                }

                // TODO: pickup price and status via here possibly?

                var parsedDroduct = {
                    name: name,
                    price: 'Unavailable',
                    status: 'Unavailable',
                    link: products[i].loc[0],
                    image: image,
                    brand: parseUrl(products[i].loc[0]).resource,
                    id: 'Unavailable'
                }

                if (name === 'Unavailable') {
                    // response.productDetails.push(JSON.stringify(parsedDroduct))
                } else {
                    response.productDetails.push(JSON.stringify(parsedDroduct))
                }
            }
            return callback(response, null)
        });
    });
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
    getStockData: getStockData,
    validateUrl: validateUrl,
    shopify: shopify,
    shopifyXML: shopifyXML,
    list: [
        'assc',
        'palace'
    ],
    assc: require('./sites/assc'),
    palace: require('./sites/palace')
};
