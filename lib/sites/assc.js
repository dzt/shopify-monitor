const cheerio = require('cheerio')
const request = require('request')

module.exports = function(callback) {

    const base_url = 'https://antisocial.myshopify.com/'

    request(base_url, function(err, resp, html, rrr, body) {

        if (err) {
            return callback(null, 'No response from AntiSocialSocialClub, failed to load data.');
        } else {
            var $ = cheerio.load(html);
        }

        var response = {
            productDetails: []
        }

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
                image: 'http:' + $(`img[alt="${name}"]`).attr('src'),
                brand: 'AntiSocialSocialClub'
            }

            response.productDetails.push(JSON.stringify(product));

        });

        return callback(response, null);

    });
}
