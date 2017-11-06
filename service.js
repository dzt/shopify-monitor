const request = require('request');
const moment = require('moment');
const chalk = require('chalk');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const _ = require('underscore');
const log = require('./utils/log');
const config = require('./config');
const fs = require('fs');
const db = require('lowdb')(new (require('lowdb/adapters/FileSync'))(config.database))
require('./database/lowdb.js')(db);
var events = require('./events');

var checkCount = 0;
var productCount = 0;

var proxies = [];

var readline = require('linebyline'),
    rl = readline('./proxies.txt');
rl.on('line', function(line, lineCount, byteCount) {
        // do something with the line of text
        proxies.push(formatProxy(line));
    })
    .on('error', function(e) {});

function formatProxy(str) {
    let data = str.split(':');

    if (data.length === 2) {
        return 'http://' + data[0] + ':' + data[1];
    } else if (data.length === 4) {
        return 'http://' + data[2] + ':' + data[3] + '@' + data[0] + ':' + data[1];
    } else {
        console.log('Unable to parse proxy');
        return null;
    }
}

function getProxy() {
    if (!config.proxies) return null;
    return proxies[Math.floor(Math.random() * proxies.length)]
}

// TODO: Keywords

var init = function(og, siteName, firstRun) {

    // TODO: Check if site is valid shopify site bychecking xml patttern
    
    var url = siteName + '/sitemap_products_1.xml'
    var proxy = getProxy();

    request({
        method: 'get',
        url: url,
        proxy: proxy,
        gzip: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3107.4 Safari/537.36'
        }
    }, (err, resp, body) => {

        if (err || resp.statusCode == 404 || resp.body == null ) {
            log(chalk.bgBlack.red(`Connection Error @ ${siteName}, polling again in ${config.pollTimeMs}ms`));
            if (firstRun) {
                return finalizeCheck(false);
            } else {
                return finalizeCheck(true);
            }
            //console.log(err)
        }

        const parsed = xml2js.parseString(body, (err, result) => {

            if (err) {
                log(chalk.bgBlack.red(`Parsing Error @ ${siteName}, polling again in ${config.pollTimeMs}ms`));
                if (firstRun) {
                    return finalizeCheck(false);
                } else {
                    return finalizeCheck(true);
                }
            }

            if (result == undefined || result == null) {
                return finalizeCheck(false);
            }

            const products = result['urlset']['url'];
            productCount = products.length;

            if (productCount <= 1) {
                return finalizeCheck(true);
            }

            var queryPromises = [];
            var queryURLs = [];
            var insertPromises = [];
            var updatePromises = [];

            if (firstRun) {
                for (var i = 0; i < products.length; i++) {
                    if (i != 0) {
                        insertPromises.push(db.get('products').push({
                            'site': og,
                            'productURL': products[i].loc[0],
                            'lastmod': products[i].lastmod[0]
                        }).write());
                    }
                }
                Promise.all(insertPromises).then((ret) => {
                    return finalizeCheck(true);
                }).catch((e) => {
                    console.log('err', e);
                });
            } else {
                persistentRun(products);
            }

            function persistentRun(products) {
                for (var i = 0; i < products.length; i++) {
                    if (i != 0) {
                        queryPromises.push(db.get('products').filter({
                            productURL: products[i].loc[0]
                        }).take(1).value());
                    }
                }

                Promise.all(queryPromises).then((ret) => {
                    execPersistent(ret);
                }).catch((e) => {
                    console.log('err', e);
                });


                function execPersistent(ret) {

                    var finalPromises = [];

                    for (var i = 0; i < ret.length; i++) {

                        /* Check if its actually a new item (seeing if it doessnt exist in database)
                        by seeing SQLIte3 File for testing */

                        if (ret[i] == null) {

                            events.emit('newItem', {
                                url: products[i + 1].loc,
                                base: og
                            });

                            finalPromises.push(db.get('products').push({
                                'site': og,
                                'productURL': products[i + 1].loc[0],
                                'lastmod': products[i + 1].lastmod[0]
                            }).write());

                        } else {
                            
                            var compare = products.find(function(o) {
                                return o.loc[0] == [ret[i][0].productURL];
                            });

                            if (ret[i][0].productURL != compare.loc[0]) {

                                events.emit('restock', {
                                    url: products[i + 1].loc,
                                    base: og
                                });

                                // TODO: Update Database with latest mod!!!!

                                finalPromises.push(db.get('products').filter({
                                    productURL: products[i + 1].loc
                                }).assign({
                                    mod: products[i + 1].lastmod
                                }).write());

                            }

                        }

                    }

                    Promise.all(finalPromises).then((ret) => {
                        return finalizeCheck(true);
                    }).catch((e) => {
                        return finalizeCheck(true);
                    });

                }


            }


        });

        function finalizeCheck(successful) {

            if (successful) {
                if (firstRun) {
                    log(chalk.bgBlack.green(`Initial Check (Successful):  ${og} with ${productCount} products`));
                }
                return setTimeout(function() {
                    return init(og, siteName, false);
                }, config.pollTimeMs);
                checkCount++;

            } else {
                return setTimeout(function() {
                    return init(og, siteName, true);
                }, config.pollTimeMs);
                checkCount++;
            }

        }

    });
}

module.exports = {
    init: init
};
