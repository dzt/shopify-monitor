const cheerio = require('cheerio')
const colors = require('colors')
const _ = require('underscore')
const request = require('request')
const parallel = require('run-parallel')
const async = require('async')
const lib = require('./lib')

var api = {};
const base_url = 'https://antisocial.myshopify.com/'

api.getItems = function(sites, callback) {

    // TODO: Check if site is not an option and throw error until xml feature add

    const tasks = []
    sites.map(function(site, i) {
        if (lib.list.indexOf(site) === -1) {
            api.log('error', `Could not find brand matching "${site}"`)
            return process.exit()
        } else {
            tasks.push(function(cb) {
                lib[site]((response, err) => {
                    if (err) {
                        api.log('error', `Error occured while fetching data from "${site}"`)
                        return process.exit()
                    }
                    cb(null, response)
                })
            })
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
        } else {
          api.log('error', 'Error occured while trying to gather all of your data.')
          return process.exit()
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

module.exports = api
