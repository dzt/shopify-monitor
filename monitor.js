var api = require('./api')
const _ = require('underscore')
const cheerio = require('cheerio')
const jsdiff = require('diff')
var configuration
try {
    configuration = require('./config.json');
} catch (e) {
    return huf.log(null, 'error', 'Missing, config.json file please create your config file before using hufbot.')
}

const request = require('request').defaults({
    timeout: 30000
})

var og

var added = []
var removed = []
var matches = []

if (configuration.notifyWhenNewItemsFound) {
    api.log('info', 'Looking for new items...')
}

if (configuration.notifyWhenOnKeywordMatch) {
    api.log('info', 'Looking for items matching your keywords...')
}

function getInitialData() {
    api.log('info', 'Getting initial data...')
    api.log('info', `Interval set for every ${configuration.interval}ms`)
    api.getItems((response, err) => {
        if (err || response == null) {
            if (configuration.autoRetryOnCrash == true) {
                api.log('error', 'Site Crashed, retrying...')
                return getInitialData()
            } else {
                api.log('error', err)
                return process.exit()
            }
        }
        og = response.productDetails
        return seek()
    })
}

getInitialData()

function seek() {

    var a = configuration.keywords
    var ending = [a.slice(0, -1).join(', '), a.slice(-1)[0]].join(a.length < 2 ? '' : ' and ');

    api.log('info', `Now seeking for items with the keywords ${ending}`)

    var newbatch

    var interval = setInterval(function() {
        api.getItems((response, err) => {
            if (err || response == null) {
                if (config.autoRetryOnCrash == true) {
                    api.log('error', 'Site Crashed, retrying...')
                    return seek()
                } else {
                    api.log('error', err)
                    return process.exit()
                }
            }

            newbatch = response.productDetails

            // this feature works 100%
            if (configuration.notifyWhenOnKeywordMatch) {
                var x
                for (x = 0; x < configuration.keywords.length; x++) {
                    // looks if keywords matches any of the results
                    var products = response.productDetails.map(function(result, i) {
                        var parsedResult = JSON.parse(result)
                        var productToCompare = parsedResult.name.toLowerCase()
                        if (productToCompare.indexOf(configuration.keywords[x].toLowerCase()) > -1) {

                            var possibleMatch = _.where(matches, parsedResult)
                            if (possibleMatch.length === 0) {
                              api.log('success', `Match Found: "${parsedResult.name}"`)
                              matches.push(parsedResult);
                            }

                        }
                    })
                }
            }

            // this needs to be enhanced
            if (configuration.notifyWhenNewItemsFound) {

                var diff = jsdiff.diffArrays(og, newbatch);
                var added = []
                var removed = []

                diff.forEach(function(part) {
                    if (part.added) {
                        console.log('added')
                        added.push(part.value)
                    } else if (part.removed) {
                        console.log('removed')
                        removed.push(part.value)
                    }
                });

                var parsedResults = []
                for (var i = 0; i < newbatch.length; i++) {
                    parsedResults.push(JSON.parse(newbatch[i]))
                }

                if (added.length > 0) {
                    var data = {
                        added: added.length,
                        products: added
                    }
                    api.log('success', `Newly Added Items (${data.added})`)
                        // do something with the data objects...
                        // print all the newly added items, example you can use the Twitter API to tweet the newly added item
                    for (var i = 0; i < products.length; i++) {
                        api.log('info', `New Item in stock: "${data.products[i].name}" - ${data.products[i].price} (${data.products[i].link})`)
                    }
                }

                if (removed.length > 0) {
                    var data = {
                        removed: removed.length,
                        products: removed
                    }
                    api.log('error', `Items removed (${data.removed})`)
                        // do something with the data objects...
                }

                if (removed.length == [] && removed.length == []) {
                    api.log('warning', 'No removed or newly added items found yet...')
                } else {
                    og = newbatch
                }
            }

        })
    }, configuration.interval);
}
