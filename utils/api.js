const request = require('request').defaults({
    timeout: 30000
})
const config = require('../config');

function validateUrl(value, callback) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}

var proxies = [];

var readline = require('linebyline'),
    rl = readline('../proxies.txt');
rl.on('line', function(line, lineCount, byteCount) {
  // do something with the line of text
  proxies.push(formatProxy(line));
})
.on('error', function(e) {});

function formatProxy(str) {
  // TODO: format is ip:port:user:pass
  let data = str.split(':');

  if (data.length === 2) {
    return 'http://' + data[0] + ':' + data[1];
  } else if (data.length === 4) {
    return 'http://' + data[2] + ':' + data[3] + '@' + data[0] + ':' + data[1];
  } else {
    console.log('Unable to parse proxy');
    return null;
  }
}

function getProxy() {
  if (!config.proxies) return null;
  return proxies[Math.floor(Math.random()*proxies.length)]
}

var getStockData = function(url, callback) {
    // pickup stock and status
    var status
    var totalStock = 0

    var proxy = getProxy();

    request({
        url: url + '.json',
        method: 'get',
        proxy: proxy,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {

        if (tryParseJSON(body)) {
            var jsonBodyProduct = JSON.parse(body)
            var data = []
            for (var i = 0; i < jsonBodyProduct.product.variants.length; i++) {
                totalStock += jsonBodyProduct.product.variants[i].inventory_quantity
                const baseUrl = url.split('/products')[0] // remove the product path from url

                const variantData = {
                    id: jsonBodyProduct.product.variants[i].id,
                    title: jsonBodyProduct.product.variants[i].option1
                };

                // data.push('<' + baseUrl + '/cart/' + jsonBodyProduct.product.variants[i].id + ':1' + '|' + jsonBodyProduct.product.variants[i].option1 +'>')
                data.push(variantData);
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

            var image = "https://i.imgur.com/FpYrCaS.png";

            if (jsonBodyProduct.product.image != null) {
              image = jsonBodyProduct.product.image.src
            }

            var data = {
                title: jsonBodyProduct.product.title,
                stock: finalStock,
                status: status,
                links: data,
                img: image,
                price: '$' + jsonBodyProduct.product.variants[0].price
            }

            return callback(data, null)

        } else {
            // console.log('error', 'No valid JSON was returned.')
            //return process.exit()
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
    getStockData: getStockData
};
