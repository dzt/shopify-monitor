const request = require('request');
const moment = require('moment');
const chalk = require('chalk');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const _ = require('underscore');
const log = require('./utils/log');
const config = require('./config');
const fs = require('fs');
const db = require('knex')(config.database);
var events = require('./events');

var checkCount = 0;
var productCount = 0;
var initProductCount = 0;

var proxyInput = null;

if (config.proxies) {
    proxyInput = fs.readFileSync('proxies.txt').toString().split('\n');
}

const proxyList = [];
var products = [];

function formatProxy(proxy) {
    if (proxy && ['localhost', ''].indexOf(proxy) < 0) {
        proxy = proxy.replace(' ', '_');
        const proxySplit = proxy.split(':');
        if (proxySplit.length > 3)
            return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
        else
            return "http://" + proxySplit[0] + ":" + proxySplit[1];
    } else
        return undefined;
}

function getProxy() {
    if (!config.proxies) {
        return null;
    } else {
        return formatProxy(proxyInput[Math.floor(Math.random() * proxyInput.length)]);
    }
}

if (config.proxies) {
    for (let p = 0; p < proxyInput.length; p++) {
        proxyInput[p] = proxyInput[p].replace('\r', '').replace('\n', '');
        if (proxyInput[p] != '')
            proxyList.push(proxyInput[p]);
    }
}

// TODO: Keywords

var init = function(og, siteName, firstRun) {

    // TODO: Check if site is valid shopify site bychecking xml patttern

    const url = siteName + '/sitemap_products_1.xml';
    var proxy = getProxy();

    //console.log(`${url} - ${proxy}`);

    request({
        method: 'get',
        url: url,
        proxy: proxy,
        gzip: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3107.4 Safari/537.36'
        }
    }, (err, resp, body) => {

        if (err) {
            log(chalk.bgBlack.red(`Connection Error @ ${siteName}, polling again in ${config.pollTimeMs}ms`));
            if (firstRun) {
                return finalizeCheck(false);
            } else {
                return finalizeCheck(true);
            }
            //console.log(err)
        }

        if (body.includes('Try again in a couple minutes by refreshing the page.')) {
            // soft banned
            console.log(`Banned. Trying again in ${config.pollTimeMs}ms - ${url}`);
            return finalizeCheck(false);
        }

        const parsed = xml2js.parseString(body, (err, result) => {

            if (err) {
                const timeStamp = new Date().toString();

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

            products = result['urlset']['url'];

            if (products == undefined || products == null) {
                return finalizeCheck(false);
            }

            products.splice(0, 1)
            productCount = products.length;

            if (firstRun) {
                console.log(`${siteName} / Items: ${products.length}`)
            }

            fs.writeFile(`logs/${og}.json`, JSON.stringify(products, null, 4), function(err) {
                if (err) {
                    console.error('Error Occured Saving Log File: ' + err);
                }
            });

            if (productCount <= 1) {
                return finalizeCheck(true);
            }

            var queryPromises = [];
            var queryURLs = [];
            var insertPromises = [];
            var updatePromises = [];

            initProductCount = products.length;

            if (firstRun) {

              insertPromises.push(db.table('topChange').insert({
                  'site': og,
                  'productURL': products[0].loc[0],
                  'productCount': products.length
              }));

                for (var i = 0; i < products.length; i++) {
                        insertPromises.push(db.table('products').insert({
                            'site': og,
                            'productURL': products[i].loc[0],
                            'lastmod': products[i].lastmod[0]
                        }));
                }
                Promise.all(insertPromises).then((ret) => {
                    return finalizeCheck(true);
                }).catch((e) => {
                    console.log('err', e);
                });
            } else {

                db('topChange').where({
                  site: og
                }).first().then(function(topChange) {
                  persistentRun(topChange);
                })
                .catch(function(error) {
                  console.error(error);
                });

            }

            function persistentRun(topChange) {

                // Changes mades
                console.log(`${topChange.productURL} != ${products[0].loc[0]}`)

                if (topChange.productURL != products[0].loc[0]) {
                  console.log('Changes were made: ' + og);
                  for (var i = 0; i < products.length; i++) {
                          queryPromises.push(db('products').where({
                              productURL: products[i].loc[0]
                          }).first());
                  }

                  // TODO: Change top item thing in event where it needs to query all items


                  db('topChange').where('site', og).update({
                    productURL: products[0].loc[0],
                    productCount: products.length
                  })

                  Promise.all(queryPromises).then((ret) => {
                      execPersistent(ret);
                  }).catch((e) => {
                      console.error(e);
                  });

                } else {
                  // No changes made
                  return finalizeCheck(true);
                }


                function execPersistent(ret) {

                    var finalPromises = [];

                    for (var i = 0; i < ret.length; i++) {

                        /* Check if its actually a new item (seeing if it doessnt exist in database)
                        by seeing SQLIte3 File for testing */

                        if (ret[i] == null) {

                            events.emit('newItem', {
                                url: products[i].loc,
                                base: og
                            });

                            finalPromises.push(db.table('products').insert({
                                'site': og,
                                'productURL': products[i].loc[0],
                                'lastmod': products[i].lastmod[0]
                            }));

                        }

                        // TODO: Check for Restocks

                    }

                    Promise.all(finalPromises).then((ret) => {
                        return finalizeCheck(true);
                    }).catch((e) => {
                        console.error(e);
                        finalPromises = [];
                        return finalizeCheck(true);
                    });

                }


            }


        });

        function finalizeCheck(successful) {

            if (successful) {
                if (firstRun) {
                    log(chalk.bgBlack.green(`Initial data added to database:  ${og}`));
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
