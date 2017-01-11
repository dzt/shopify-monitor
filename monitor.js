var api = require('./api')
const _ = require('underscore')
const cheerio = require('cheerio')
const jsdiff = require('diff')

try {
    var configuration = require('./config.json');
} catch (e) {
    api.log('error', 'Missing, config.json file please create your config file before using hufbot.')
    return process.exit()
}

const request = require('request').defaults({
    timeout: 30000
})

var og

var added = []
var removed = []
var matches = []

var a = configuration.keywords
var ending = [a.slice(0, -1).join(', '), a.slice(-1)[0]].join(a.length < 2 ? '' : ' and ');
var b = configuration.sites
var endingSites = [b.slice(0, -1).join(', '), b.slice(-1)[0]].join(b.length < 2 ? '' : ' and ');

if (configuration.notifyWhenNewItemsFound) {
    api.log('info', 'Looking for new items...')
}

if (configuration.notifyWhenOnKeywordMatch) {
    api.log('info', 'Looking for items matching your keywords...')
}

api.log('info', `Currently monitoring ${endingSites}`)

function convertSecondsToMinutesAndSeconds(seconds) {
    var minutes;
    var seconds;
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return [minutes, seconds];
}

if (configuration.slackBot.active) {
    const Bot = require('slackbots')
    var slackBot = new Bot({
        name: 'Shopify Monitor',
        token: configuration.slackBot.token
    })
    api.log('info', 'SlackBot currently enabled.')
    slackBot.on('start', function() {
        slackBot.postMessageToChannel(configuration.slackBot.channel, 'Shopify Monitor currently active ◕‿◕', configuration.slackBot.settings);
    })
    slackBot.on('error', function() {
        api.log('error', 'An error occurred while connecting to Slack, please try again.')
        return process.exit()
    })
    slackBot.on('message', function(data) {
        if (data.text === '!usage') {
            slackBot.postMessageToChannel(configuration.slackBot.channel, "```Shopify Monitor Usage\n!current: Current Settings```", configuration.slackBot.settings);
        }
        if (data.text === '!current') {
            var current = []
            var uptime = convertSecondsToMinutesAndSeconds(process.uptime())
            var uptimeFormatted
            uptimeFormatted = uptime[0] + ' minutes'

            current.push("```Channel Set too: #" + configuration.slackBot.channel + "\n")
            current.push(`Current Keyword(s): ${ending}\n`)
            current.push(`Currently being monitored: ${endingSites}\n`)
            current.push(`Interval Rate: ${configuration.interval}ms\n`)
            current.push(`Server Uptime: ${uptimeFormatted}\n`)
            current.push("```")
            slackBot.postMessageToChannel(configuration.slackBot.channel, current.join(''), configuration.slackBot.settings);
        }
    });
}

function getInitialData() {
    api.log('info', 'Getting initial data...')
    api.log('info', `Interval set for every ${configuration.interval}ms`)
    api.getItems(configuration.sites, (response, err) => {
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

var checkCount = 0

function seek() {

    api.log('info', `Now seeking for items with the keywords ${ending}`)

    var newbatch

    var interval = setInterval(function() {
        api.getItems(configuration.sites, (response, err) => {
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
                                // checks if its already found that match before
                            if (possibleMatch.length === 0) {
                                api.log('success', `Match Found: "${parsedResult.name}"`)
                                slackNotification(parsedResult, '#F48FB1', 'Keyword Match')
                                matches.push(parsedResult);
                            }

                        }
                    })
                }
            }

            // this needs to be enhanced
            if (configuration.notifyWhenNewItemsFound) {

                var diff = jsdiff.diffArrays(og, newbatch);

                var parsedOG = []
                var parsedNew = []
                var removed = []

                var newItems = []
                var restockedItems = []
                var removedItems = []
                var soldoutItems = []

                for (var i = 0; i < og.length; i++) {
                    parsedOG.push(JSON.parse(og[i]))
                }

                for (var i = 0; i < newbatch.length; i++) {
                    parsedNew.push(JSON.parse(newbatch[i]))
                }

                diff.forEach(function(part) {

                    if (part.added) {
                        var item
                        var diffAdded = []

                        for (var i = 0; i < part.value.length; i++) {
                            diffAdded.push(JSON.parse(part.value[i]))
                        }

                        for (var i = 0; i < diffAdded.length; i++) {
                            item = _.where(parsedOG, {
                                name: diffAdded[i].name
                            })
                            if (item.length === 0) {
                                newItems.push(diffAdded[i].name)
                                console.log(`Item Added to Store: ${diffAdded[i].name}`)
                                slackNotification(diffAdded[i], '#36a64f', 'Newly Added Item')
                                checkCount = 0
                            } else if (item.length > 0) {
                                item = _.where(parsedOG, {
                                    name: diffAdded[i].name
                                })

                                if (diffAdded[i].status === "Available" && item[0].status === "Sold Out") {
                                    restockedItems.push(diffAdded[i])
                                    console.log(`Restocked Item: ${diffAdded[i].name}`)
                                    slackNotification(diffAdded[i], '#4FC3F7', 'Restocked Item')
                                    checkCount = 0
                                }

                                if (diffAdded[i].status === "Sold Out" && item[0].status === "Available") {
                                    soldoutItems.push(diffAdded[i])
                                    console.log(`Item Sold Out: ${diffAdded[i].name}`)
                                    slackNotification(diffAdded[i], '#ef5350', 'Sold Out Item')
                                    checkCount = 0
                                }

                            }
                        }

                    } else if (part.removed) {
                        removed.push(part.value)
                        var diffRemoved = []
                        for (var i = 0; i < part.value.length; i++) {
                            diffRemoved.push(JSON.parse(part.value[i]))
                        }

                        for (var i = 0; i < diffRemoved.length; i++) {
                            item = _.where(parsedNew, {
                                name: diffRemoved[i].name
                            })

                            if (item.length === 0) {
                                removedItems.push(diffRemoved[i])
                                console.log(`Item Removed from Store: ${parsedNew[i].name}`)
                                slackNotification(parsedNew[i], '#ef5350', 'Removed Item from Store')
                                checkCount = 0
                            }

                        }

                    }
                });

                if (newItems.length === 0 || restockedItems.length === 0 || removedItems.length === 0 || soldoutItems.length === 0) {
                    if (checkCount === 0) {
                        api.log('warning', 'No new updates found yet but still looking ヅ')
                    }
                    checkCount++
                    var parsedOG = []
                    var parsedNew = []
                    var removed = []
                    var newItems = []
                    var restockedItems = []
                    var removedItems = []
                    var soldoutItems = []
                }

                og = newbatch

            }

        })
    }, configuration.interval);
}

function slackNotification(parsedResult, color, pretext) {
    if (configuration.slackBot.active) {
        var params = {
            username: "ShopifyMonitor",
            icon_url: "http://i.imgur.com/zks3PoZ.png",
            attachments: [{
                "title": parsedResult.name,
                "title_link": parsedResult.link,
                "color": color,
                "fields": [{
                        "title": "Full Product Name",
                        "value": parsedResult.name,
                        "short": "false"
                    },
                    {
                        "title": "Brand",
                        "value": parsedResult.brand,
                        "short": "false"
                    },
                    {
                        "title": "Notification Type",
                        "value": pretext,
                        "short": "false"
                    },
                    {
                        "title": "Price",
                        "value": parsedResult.price,
                        "short": "false"
                    }
                ],
                "thumb_url": parsedResult.image
            }]
        }
        slackBot.postMessage(configuration.slackBot.channel, null, params);
    }
}
