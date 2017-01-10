const cheerio = require('cheerio')
const request = require('request')

module.exports = function(callback) {

    const base_url = 'https://shop-usa.palaceskateboards.com/'

    request(base_url, function(err, resp, html, rrr, body) {

        if (err) {
            return callback(null, 'No response from Palace USA, failed to load data.');
        } else {
            var $ = cheerio.load(html);
        }

        var response = {
            productDetails: []
        }

        var matches = [];

        $('.product-grid-item').each(function(i, element) {

            var priceValue = $(this).children('.product-info').children('.price').text().replace(/\s{2,}/g, '')
            var price
            if (priceValue === 'SOLD OUT') {
                var status = 'Sold Out';
                price = 'Unavailable'
            } else {
                var status = 'Available'
                price = priceValue
            }

            var product = {
                name: $(this).attr('data-alpha'),
                price: priceValue,
                status: status,
                link: 'https://shop-usa.palaceskateboards.com' + $(this).children('a').attr('href'),
                image: 'http:' + $(this).children('a').children('img').attr('data-src'),
                brand: 'Palace USA'
            }

            response.productDetails.push(JSON.stringify(product));

        });

        return callback(response, null);

    });
}
