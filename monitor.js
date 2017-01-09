var assc = require('./api')
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

var pt_1 = [
  '{name: "Item 1" status: "Sold Out"}',
  '{name: "Item 2" status: "Available"}',
  '{name: "Item 3" status: "Sold Out"}'
]

var pt_2 = [
  '{name: "Item 1" status: "Sold Out"}',
  '{name: "Item 2" status: "Sold Out"}',
  '{name: "Item 3" status: "Sold Out"}'
]

var diffTest = jsdiff.diffArrays(pt_1, pt_2)

diffTest.forEach(function(part) {
    if (part.added) {
        console.log('added')
        console.log(part.value)
    } else if (part.removed) {
        console.log('removed')
        console.log(part.value)
    }
});

var added = []
var removed = []

if (configuration.notifyWhenNewItemsFound) {
    assc.log('info', 'Looking for new items...')
}

if (configuration.notifyWhenOnKeywordMatch) {
    assc.log('info', 'Looking for items matching your keywords...')
}

function getInitialData() {
    assc.log('info', 'Getting initial data...')
    assc.log('info', `Interval set for every ${configuration.interval}ms`)
    assc.getItems((response, err) => {
        if (err || response == null) {
            if (configuration.autoRetryOnCrash == true) {
                assc.log('error', 'Site Crashed, retrying...')
                return getInitialData()
            } else {
                assc.log('error', err)
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

    assc.log('info', `Now seeking for items with the keywords ${ending}`)

    var newbatch

    var interval = setInterval(function() {
        assc.getItems((response, err) => {
            if (err || response == null) {
                if (config.autoRetryOnCrash == true) {
                    assc.log('error', 'Site Crashed, retrying...')
                    return seek()
                } else {
                    assc.log('error', err)
                    return process.exit()
                }
            }

            newbatch = response.productDetails

            var matches = []

            // this feature works 100%
            if (configuration.notifyWhenOnKeywordMatch) {
                var x
                for (x = 0; x < configuration.keywords.length; x++) {
                    // looks if keywords matches any of the results
                    var products = response.productDetails.map(function(result, i) {
                        var parsedResult = JSON.parse(result)
                        var productToCompare = parsedResult.name.toLowerCase()
                        if (productToCompare.indexOf(configuration.keywords[x].toLowerCase()) > -1) {
                            assc.log('success', `Match Found: "${parsedResult.name}"`)
                            matches.push(parsedResult);
                        }
                    })
                }
            }

            // this needs to be enhanced
            if (configuration.notifyWhenNewItemsFound) {

                if (og == newbatch) {
                    console.log('same')
                }

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

                if (added.length > 0) {
                    var data = {
                        added: added.length,
                        products: added
                    }
                    assc.log('success', `Newly Added Items (${data.added})`)
                        // do something with the data objects...
                        // print all the newly added items, example you can use the Twitter API to tweet the newly added item
                    for (var i = 0; i < products.length; i++) {
                        assc.log('info', `New Item in stock: "${data.products[i].name}" - ${data.products[i].price} (${data.products[i].link})`)
                    }
                }

                if (removed.length > 0) {
                    var data = {
                        removed: removed.length,
                        products: removed
                    }
                    assc.log('error', `Items removed (${data.removed})`)
                        // do something with the data objects...
                }

                if (removed.length == [] && removed.length == []) {
                    assc.log('warning', 'No removed or newly added items found yet...')
                } else {
                    og = newbatch
                }
            }

        })
    }, configuration.interval);
}
