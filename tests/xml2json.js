const request = require('request')
const iconv = require('iconv-lite')
const parseUrl = require("parse-url")
const parseString = require('xml2js').parseString

request({
    url: 'https://kithnyc.com/sitemap_products_1.xml',
    method: 'get',
    encoding: null,
    gzip: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
    }
}, function(err, res, body) {

    if (err || body === undefined) {
        return console.log('nothing was returned')
    }

    var bodyWithCorrectEncoding = iconv.decode(body, 'iso-8859-1');

    parseString(bodyWithCorrectEncoding, function(err, result) {
        if (err) {
            return console.log('Invalid XML Output')
        }
        var response = {
            productDetails: []
        }
        var products = result.urlset.url
        for (var i = 0; i < products.length; i++) {

            if (products[i]['image:image'] === undefined) {
                var name = undefined
                var image = undefined
            } else {
                var name = products[i]['image:image'][0]['image:title'][0]
                var image = products[i]['image:image'][0]['image:loc'][0]
            }

            var parsedDroduct = {
                name: name,
                price: 'Unvailable',
                status: 'Unavailable',
                link: products[i].loc[0],
                image: image,
                brand: parseUrl(products[i].loc[0]).resource,
                id: 'Unvailable'
            }

            if (name === undefined) {
                response.productDetails.push(JSON.stringify(parsedDroduct))
            }
        }
        return callback(response, null)
    });


});
