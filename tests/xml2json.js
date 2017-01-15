const parser = require('xml2json')
const request = require('request')
const fs = require('fs')

request({
    url: 'https://kithnyc.com/sitemap_products_1.xml',
    method: 'get',
    time: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
    }
}, function(err, res, body) {

    if (err || body === undefined) {
        return console.log('nothing was returned')
    }

    var options = {
        object: true,
        reversible: false,
        coerce: false,
        sanitize: true,
        trim: true,
        arrayNotation: false,
        alternateTextNode: false
    };

    var json = parser.toJson(body, options)

    fs.writeFile('test.json', json, (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
    });


});
