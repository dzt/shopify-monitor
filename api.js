const cheerio = require('cheerio')
const colors = require('colors')
const request = require('request')

var api = {};
const base_url = 'https://antisocial.myshopify.com/'

// TODO: make api take use of lib

api.getItems = function(callback) {
    request(base_url, function(err, resp, html, rrr, body) {

        if (err) {
            return callback(null, 'No response from website, failed to load data.');
        } else {
            var $ = cheerio.load(html);
        }

        var response = {
            proudctCount: $('.grid-link.text-center').length,
            productDetails: []
        }

        var matches = [];

        $('.grid-link__title').each(function(i, element) {

            if ($('.badge__text').eq(i).text() == 'Sold Out') {
                var status = 'Sold Out';
            } else {
                var status = 'Available';
            }

            var price = $('.grid-link__meta').eq(i).text().replace(/\s{2,}/g, '')
            var name = $(this).text();
            var product = {
                name: $(this).text(),
                price: '$' + price.split(' ')[1],
                status: status,
                link: 'https://antisocial.myshopify.com' + $('.grid-link.text-center').eq(i).attr('href'),
                image: 'http:' + $(`img[alt="${name}"]`).attr('src')
            }

            response.productDetails.push(JSON.stringify(product));

        });

        return callback(response, null);

    });
}

api.log = function(type, text) {

    var date = new Date()
    var formatted = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")

    switch (type) {
        case "warning":
            console.log(`[${formatted}] ${text}`.yellow)
            break;
        case "error":
            console.log(`[${formatted}] ${text}`.red)
            break;
        case "info":
            console.log(`[${formatted}] ${text}`.cyan)
            break;
        case "success":
            console.log(`[${formatted}] ${text}`.green)
            break;
        default:
            console.log(`[${formatted}] ${text}`.white)
    }
}

module.exports = api
