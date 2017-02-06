var api = require('./api')
const _ = require('underscore')
const cheerio = require('cheerio')
const jsdiff = require('diff')
const express = require('express')
const base64 = require('node-base64-image')
const lib = require('./lib')
const app = express()

function scheduleGc() {
    if (!global.gc) {
        console.log('Garbage collection is not exposed');
        return;
    }

    // schedule next gc within a random interval (e.g. 15-45 minutes)
    // tweak this based on your app's memory usage
    var nextMinutes = Math.random() * 30 + 15;

    setTimeout(function() {
        global.gc();
        console.log('Manual gc', process.memoryUsage());
        scheduleGc();
    }, nextMinutes * 60 * 1000);
}

// call this in the startup script of your app (once per process)
scheduleGc();

    try {
        var configuration = require('./config.json');
    } catch (e) {
        api.log('error', 'Missing, config.json file or invalid json syntax.')
        return process.exit()
    }

const request = require('request').defaults({
    timeout: 30000
})

var og
var pickupFirst = false

var added = []
var removed = []
var matches = []

var a = configuration.keywords
var ending = [a.slice(0, -1).join(', '), a.slice(-1)[0]].join(a.length < 2 ? '' : ' and ');
var b = configuration.sites
var endingSites = [b.slice(0, -1).join(', '), b.slice(-1)[0]].join(b.length < 2 ? '' : ' and ');

// Web Server

var uptime = convertSecondsToMinutesAndSeconds(process.uptime())
var uptimeFormatted = uptime[0] + ' minutes'

app.listen(configuration.serverPort)
app.set('port', configuration.serverPort)
api.log('success', `Local server started on port ${configuration.serverPort}`)

app.get('/', function(req, res) {
    res.send('Shopify Monitor v1')
})

// slash commands
app.post('/command/status', function(req, res) {
    let data = {
        response_type: 'in_channel',
        text: 'Shopify Monitor Status',
        attachments: [{
            fallback: "Shopify Monitor Status",
            color: '#7E57C2',
            fields: [{
                    "title": "Current Keyword(s)",
                    "value": ending,
                    "short": "false"
                },
                {
                    "title": "Sites being monitored",
                    "value": endingSites,
                    "short": "false"
                },
                {
                    "title": "Interval Rate",
                    "value": configuration.interval,
                    "short": "false"
                },
                {
                    "title": "Server Uptime",
                    "value": uptimeFormatted,
                    "short": "false"
                }
            ]
        }]
    };
    return res.json(data)
})

if (configuration.notify.new) {
    api.log('info', 'Looking for new items...')
}

if (configuration.notify.keywords) {
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
    api.log('info', 'Slack Bot currently enabled.')
    slackBot.on('start', function() {
        slackBot.postMessageToChannel(configuration.slackBot.channel, 'Shopify Monitor currently active ◕‿◕', configuration.slackBot.settings);
    })
    slackBot.on('error', function() {
        api.log('error', 'An error occurred while connecting to Slack, please try again.')
        return process.exit()
    })
}

if (configuration.twitter.active) {
    api.log('info', 'Twitter service is currently enabled.')
    var Twit = require('twit')
    var T = new Twit({
        consumer_key: configuration.twitter.consumer_key,
        consumer_secret: configuration.twitter.consumer_secret,
        access_token: configuration.twitter.access_token,
        access_token_secret: configuration.twitter.access_token_secret
    })
}


function getInitialData() {
    api.log('info', 'Getting initial data...')
    api.log('info', `Interval set for every ${configuration.interval}ms`)
    var start = +new Date();
    api.getItems(configuration.sites, (response, err) => {
        if (err || response == null) {
            if (configuration.autoRetryOnCrash == true) {
                api.log('error', 'Site Crashed, retrying...')
                return getInitialData()
            } else {
                api.log('error', err)
                //return process.exit()
            }
        }
        og = response.productDetails
        var end = +new Date();
        api.log('success', `Time elapsed to gather inital data: ${end-start}ms`)
        return seek()
    })
}

getInitialData()

var checkCount = 0

function seek() {

    api.log('info', `Now seeking for items with the keywords ${ending}`)

    var newbatch

    var interval = setInterval(function() {
        var startSeek = +new Date();
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
            if (configuration.notify.keywords) {
                var x
                for (x = 0; x < configuration.keywords.length; x++) {
                    // looks if keywords matches any of the results
                    var products = response.productDetails.map(function(result, i) {
                        var parsedResult = JSON.parse(result)
                        var productToCompare = parsedResult.name.toLowerCase()
                        if (productToCompare.indexOf(configuration.keywords[x].toLowerCase()) > -1) {

                            var possibleMatch = _.where(matches, parsedResult)

                            // checks if its already found that match before and if not it pushes it to slack or whatever
                            if (possibleMatch.length === 0) {

                                var newMatch = parsedResult
                                lib.getStockData(parsedResult.link, (res, err) => {
                                    if (err) {
                                        api.log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
                                    }
                                    newMatch.stock = res.stock
                                    matches.push(newMatch)
                                })

                                if (pickupFirst === false) {
                                    // does nothing
                                    //api.log('success', `Match Found:\nProduct Name: "${parsedResult.name}"\nLink: ${parsedResult.link}\n`)
                                } else {
                                    api.log('success', `Match Found:\nProduct Name: "${parsedResult.name}"\nLink: ${parsedResult.link}\n`)
                                    slackNotification(parsedResult, '#F48FB1', 'Keyword Match')
                                    twitterNotification(parsedResult, 'match')
                                }
                            } else {
                                var possibleRestock = _.findWhere(matches, {
                                    name: parsedResult.name,
                                    brand: parsedResult.brand
                                });

                                if (possibleRestock === undefined) {
                                    // do nothing
                                } else {
                                    // compare stock
                                    if (possibleRestock.stock === 'Unavailable') {

                                    } else {
                                        if (possibleRestock.stock === 0) {
                                            // find match stock
                                            lib.getStockData(parsedResult.link, (res, err) => {
                                                if (err) {
                                                    api.log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
                                                }
                                                if (Number.isInteger(res.stock)) {
                                                    if (res.stock > 0) {

                                                        var newRestock = parsedResult
                                                        console.log('splicing')
                                                        matches.splice(matches.indexOf(possibleRestock), 1);
                                                        newRestock.stock = res.stock
                                                        matches.push(newRestock)

                                                        slackNotification(parsedResult, '#4FC3F7', 'Restock')
                                                        twitterNotification(parsedResult, 'restock')
                                                    }
                                                }
                                            })
                                        }
                                    }
                                }

                            }
                        }
                    })
                }
                pickupFirst = true
            }

            // this needs to be enhanced
            if (configuration.notify.new || configuration.notify.restocks) {

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
                                twitterNotification(diffAdded[i], 'new')
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
                                // TODO: Bug Spot
                                //api.log('error', `Item Removed from Store: ${parsedNew[i].name}`)
                                //slackNotification(parsedNew[i], '#ef5350', 'Removed Item from Store')
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
                newbatch = null

            }

        })
        // var endSeek = +new Date();
        //api.log('success', `Interval completion time: ${endSeek-startSeek}ms`)
    }, configuration.interval);
}

function slackNotification(parsedResult, color, pretext) {
    if (configuration.slackBot.active) {

        if (parsedResult.image === undefined || parsedResult.image === null) {
            var img = configuration.noImageURL
        } else {
            var img = parsedResult.image
        }

        var stockCount
        lib.getStockData(parsedResult.link, (res, err) => {
            if (err) {
                api.log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
            }
            send(res)
        })

        function send(res) {
            if (isNaN(res.stock)) {
                var stock = 'Unavailable'
            } else {
                var stock = res.stock
            }

            var price = res.price

            var links = res.links.join('\n')

            var params = {
                username: "ShopifyMonitor",
                icon_url: "http://i.imgur.com/zks3PoZ.png",
                attachments: [{
                    "fallback": `${pretext}: ${parsedResult.name}`,
                    "title": parsedResult.name,
                    "title_link": parsedResult.link,
                    "color": color,
                    "fields": [{
                            "title": "Stock Count",
                            "value": stock,
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
                            "value": price,
                            "short": "false"
                        },
                        {
                            "title": "Add Cart Links 🚪",
                            "value": links,
                            "short": "false"
                        }
                    ],
                    "thumb_url": img
                }]
            }
            slackBot.postMessage(configuration.slackBot.channel, null, params);
        }
    }
}

function twitterNotification(parsedResult, type) {
    if (configuration.twitter.active) {

        if (parsedResult.image === undefined || parsedResult.image === null) {
            var img = configuration.noImageURL
        } else {
            var img = parsedResult.image
        }

        var stockCount
        lib.getStockData(parsedResult.link, (res, err) => {
            if (err) {
                api.log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
                return process.exit()
            }
            sendTweet(res)
        })

        function sendTweet(res) {
            if (res.stock === NaN || res.stock === undefined) {
                var stock = 0
            } else {
                var stock = res.stock
            }

            var name = parsedResult.name
            var url = parsedResult.link
            var price = res.price

            if (type === 'new') {
                var altText = `Added:\n${name}\n${price}\nStock Count: ${stock}\n${url}`
            }

            if (type === 'match') {
                var altText = `${name}\n${price}\nStock Count: ${stock}\n${url}`
            }

            if (type === 'restock') {
                var altText = `Restock:\n${name}\n${price}\nStock Count: ${stock}\n${url}`
            }

            if (configuration.twitter.encodeImages) {
                api.log('info', 'Encoding image for Tweet...')
                base64.encode(img, {
                    string: true
                }, function(err, image) {
                    if (err) {
                        api.log('error', err)
                    }
                    post(image)
                });
            } else {
                postWithoutImg()
            }

            function post(img) {
                api.log('info', 'Tweeting...')
                T.post('media/upload', {
                    media_data: img,
                    alt_text: {
                        text: altText
                    }
                }, function(err, data, response) {

                    if (err) {
                        return api.log('error', err)
                    }

                    var mediaIdStr = data.media_id_string
                    var meta_params = {
                        media_id: mediaIdStr,
                        alt_text: {
                            text: altText
                        }
                    }

                    T.post('media/metadata/create', meta_params, function(err, data, response) {
                        if (!err) {
                            var params = {
                                status: altText,
                                media_ids: [mediaIdStr]
                            }

                            T.post('statuses/update', params, function(err, data, response) {
                                if (err) {
                                    return api.log('error', err)
                                }
                                return api.log('success', `Tweet Sent: https://twitter.com/${data.user.screen_name}/status/${data.id_str}`)
                            })
                        } else {
                            return api.log('error', err)
                        }
                    })

                })
            }

            function postWithoutImg() {
                var params = {
                    status: altText
                }
                T.post('statuses/update', params, function(err, data, response) {
                    if (err) {
                        return api.log('error', err)
                    }
                    return api.log('success', `Tweet Sent: https://twitter.com/${data.user.screen_name}/status/${data.id_str}`)
                })
            }

        }
    }
}

// twitterNotification({
//   image: 'https://cdn.shopify.com/s/files/1/0094/2252/products/Adidas_Superstar_Foundation_FtwWhtCBurgGoldMt_BY3713_7722-1.progressive.jpg',
//   link: 'https://kith.com/products/adidas-originals-superstar-burgundy',
//   name: 'ADIDAS ORIGINALS SUPERSTAR'
// }, 'new')
