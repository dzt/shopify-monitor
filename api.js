const cheerio = require('cheerio')
const colors = require('colors')
const _ = require('underscore')
const request = require('request')
const parallel = require('run-parallel')
const async = require('async')
const lib = require('./lib')
const parseUrl = require("parse-url")
const validUrl = require('valid-url')

var api = {};

api.getItems = function(sites, callback) {

    var urlsFound = []
    var tasks = []

    sites.map(function(site, i) {
        if (lib.list.indexOf(site) > -1) {
            tasks.push(function(cb) {
                lib[site]((response, err) => {
                    if (err) {
                        api.log('error', `Error occured while fetching data from "${site}"`)
                        return process.exit()
                    }
                    cb(null, response)
                })
            })
        } else {

            if (validUrl.isUri(site)) {
                var parsedURL = parseUrl(site)
                if (urlsFound.indexOf(parsedURL.resource) > -1) {
                    // api.log('success', `URL found (${parsedURL.resource}), checking if website is eligible for monitoring...`)
                    // console.log(urlsFound)
                    // urlsFound.push(parsedURL.resource)
                } else {
                    //api.log('success', `URL found: (${parsedURL.resource}), checking if website is eligible for monitoring...`)
                    urlsFound.push(parsedURL.resource)
                    /*
                    api.validateUrl('http://' + parsedURL.resource, (response, err) => {
                        if (err) {
                            api.log('error', err)
                            api.log('error', `URL found, isn\'t eligible for monitoring. (${site})`)
                            return process.exit()
                        }
                    })
                    */
                }
                // conditional check if indexOF ending xml or just shopify link without xml
                if (site.endsWith(".xml") || site.endsWith(".xml/")) {
                    tasks.push(function(cb) {
                        lib.shopifyXML(site, (response, err) => {
                            if (err) {
                                api.log('error', `Error occured while fetching data from XML link "${site}"`)
                                api.log('error', err)
                                return process.exit()
                            }
                            cb(null, response)
                        })
                    })
                } else {
                    tasks.push(function(cb) {
                        lib.shopify(parsedURL.resource, (response, err) => {
                            if (err) {
                                api.log('error', `Error occured while fetching data from "${site}"`)
                                api.log('error', err)
                                return process.exit()
                            }
                            cb(null, response)
                        })
                    })
                }
            } else {
                api.log('error', `Could not find brand matching "${site}"`)
                return process.exit()
            }

        }
    })

    async.parallel(tasks, function(err, res) {
        if (!err) {
            var arrays = []
            for (var i = 0; i < res.length; i++) {
                arrays.push.apply(arrays, res[i].productDetails);
            }
            var rRes = {
                productDetails: arrays
            }
            return callback(rRes, null)
        }
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

api.validateUrl = function(url, callback) {
    request({
        url: 'https://' + url + '/products.json',
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        }
    }, function(err, res, body) {
        if (err || body === undefined) {
            return callback(null, `No response data was sent back, try increasing your interval rate to prevent rate limiting (${url})`);
        }
        if (tryParseJSON(body)) {
            var jsonBody = JSON.parse(body)
            if (jsonBody.products) {
                return callback(true, null)
            } else {
                return callback(null, `Invalid Format (${url})`)
            }
        } else {
            return callback(null, `Invalid JSON. (${url})`)
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

module.exports = api
