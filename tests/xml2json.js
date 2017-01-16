const parser = require('xml2json')
const request = require('request')
const fs = require('fs')
var iconv = require('iconv-lite');
var parseString = require('xml2js').parseString

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
    //console.log(bodyWithCorrectEncoding);

    parseString(bodyWithCorrectEncoding, function(err, result) {
        console.dir(result);
        console.log(result.urlset.url)
        // console.log(result)
    });

    /*
    fs.writeFile('test.json', json, (err) => {
        if (err) throw err;
        console.log('It\'s saved!');
    });
    */


});
