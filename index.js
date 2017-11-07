require('console-stamp')(console, {
    colors: {
        stamp: 'yellow',
        label: 'cyan',
        label: true,
        metadata: 'green'
    }
});

const request = require('request-promise');
const async = require('async');
const config = require('./config');
const log = require('./utils/log');
const chalk = require('chalk');
const taskLib = require('./task');
const fs = require('fs');
const api = require('./utils/api')

const db = require('knex')(config.database);
require('./database/db.js')(db);

var proxyCount = 0;
var events = require('./events');

var proxies = [];

var taskArr = [];

log('------------------------------------------------');
log('               ShopifyMonitor v2');
log('------------------------------------------------');
log('                Developed by dzt');
log('------------------------------------------------');

if (config.slackBot.active) {
    const Bot = require('slackbots')
    var slackBot = new Bot({name: config.slackBot.settings.username, token: config.slackBot.token})
    slackBot.on('start', function() {
        slackBot.postMessageToChannel(config.slackBot.channel, 'Shopify Monitor currently active ◕‿◕', config.slackBot.settings);
    })
    slackBot.on('error', function() {
        log('An error occurred while connecting to Slack, please try again.', 'error');
        return process.exit()
    })
}

log(chalk.bgBlack.green('config.json file has been loaded'));

if (config.proxies) {
    fs.readFile('./proxies.txt', function read(err, data) {
        if (err) {
            log(err)
            throw err;
        }
        log(chalk.bgBlack.blueBright(`Proxies: ${data.toString().split(/\r\n|\r|\n/).length - 1}`));
        log(chalk.bgBlack.blueBright(`Site Count: ${config["sites"].length}`));
        log('------------------------------------------------');
    });
}

tranformConfig();

function tranformConfig() {

    for (var i = 0; i < config["sites"].length; i++) {
        taskArr.push(config["sites"][i]);
    }

    db('products').del().then((ret) => {
        setTimeout(function() {
            init();
        }, 500);
    }).catch((err) => {
        return console.log('err', err);
    });

}

function init() {

    log(chalk.bgBlack.green('Starting Tasks...'));

    var tasks = [];

    taskArr.map(function(task, i) {
        tasks.push(function(cb) {
            taskLib.start(task, (err, response) => {
                if (err) {
                    log(chalk.redBright.red(err), 'error');
                    return process.exit(1);
                }
                return cb(null, response);
            });
        });
    });

    async.parallel(tasks, function(err, res) {
        if (err) {
            log(chalk.bgBlack.redBright(err), 'error');
            return process.exit(1);
        } else {
            log(chalk.bgBlack.green('All tasks have been successfully Initialized'));
            log('------------------------------------------------');

            if (config.twitter.active) {
                log(chalk.bgBlack.blueBright('Twitter Bot Enabled'));
            }

            if (config.slackBot.active) {
                log(chalk.bgBlack.redBright('Slack Bot Enabled'));
            }

            if (config.discord.active) {
                log(chalk.bgBlack.cyanBright('Discord Bot Enabled'));
            }

            log('------------------------------------------------');

        }
    });

}

events.on('initCheck', (data) => {});

events.on('newItem', (data) => {
    console.log(`new item: \n ${JSON.stringify(data)}`);
    slackNotification(data.url[0], '#36a64f', 'Newly Added Item', data.base);
    discordNotification(data.url[0], "Newly Added Item", data.base);
});

events.on('restock', (data) => {
    console.log(`restock: \n ${JSON.stringify(data)}`);
    slackNotification(data.url[0], '#4FC3F7', "Restock", data.base);
    discordNotification(data.url[0], "Restock", data.base);
});

// TODO: Flow type checking ?
async function discordNotification(url, pretext, base) {
    if (config.discord.active) {
        var stockCount
        api.getStockData(url, async(res, err) => {
            if (err) {
                api.log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
            }
            await send(res);
        });

        async function send(res) {
            if (isNaN(res.stock)) {
                var stock = 'Unavailable'
            } else {
                var stock = res.stock
            }

            var price = res.price

            var links;
            if (Array.isArray(res.links)) {
                const set = [];
                for (let i = 0; i < res.links.length; i++) {
                    const variant = res.links[i];
                    let baseUrl = variant.baseUrl;
                    set.push(`[${variant.title}](${baseUrl}/cart/${variant.id}:1)`);
                }
                links = set.join('\n');
            } else {
                links = 'Unavailable'
            }

            const embeds = [
                {
                    "title": res.title,
                    "url": url,
                    "color": 1609224, // green
                    "timestamp": new Date().toISOString(),
                    "footer": {
                        "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
                        "text": "Shopify Monitor by dzt"
                    },
                    "thumbnail": {
                        "url": res.img
                    },
                    "author": {
                        "name": "Shopify Monitor",
                        "url": "https://discordapp.com",
                        "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
                    },
                    "fields": [
                        {
                            "name": "Notification Type",
                            "value": pretext,
                            "inline": true
                        }, {
                            "name": "Stock Count",
                            "value": stock,
                            "inline": true
                        }, {
                            "name": "Brand",
                            "value": base,
                            "inline": true
                        }, {
                            "name": "Price",
                            "value": price,
                            "inline": true
                        }, {
                            "name": "Links",
                            "value": links
                        }
                    ]
                }
            ];

            const message = {
                embeds
            };

            const opts = {
                url: config.discord.webhook_url,
                method: 'POST',
                body: message,
                json: true,
                resolveWithFullResponse: true,
                simple: false
            }

            try {
                const response = await request(opts);

                if ((/^2/.test('' + response.statusCode))) {
                    return;
                }

                if (response.statusCode === 429) {
                    setTimeout(async() => {
                        return await send(res);
                    }, response.body.retry_after);
                }
            } catch (e) {
                setTimeout(async() => {
                    return await send(res);
                }, 1500);
            }
        }
    }
}

function slackNotification(url, color, pretext, base) {
    if (config.slackBot.active) {
        var stockCount
        api.getStockData(url, (res, err) => {
            if (err) {
                return log(`Error occured while fetching stock data from ${parsedResult.link}`, 'error');
            }
            //console.log('res: ' + JSON.stringify(res));
            send(res)
        })

        function send(res) {
            if (isNaN(res.stock)) {
                var stock = 'Unavailable'
            } else {
                var stock = res.stock
            }

            var price = res.price

            var links;
            if (Array.isArray(res.links)) {
                const set = [];
                for (let i = 0; i < res.links.length; i++) {
                    const variant = res.links[i];
                    let baseUrl = variant.baseUrl;
                    set.push(`<${baseUrl}/cart/${variant.id}:1|${variant.title}>`);
                }
                links = set.join('\n');
            } else {
                links = 'Unavailable'
            }

            var params = {
                username: config.slackBot.settings.username,
                icon_url: config.slackBot.settings.icon_url,
                attachments: [
                    {
                        "fallback": `${res.title}`,
                        "title": res.title,
                        "title_link": url,
                        "color": color,
                        "fields": [
                            {
                                "title": "Stock Count",
                                "value": stock,
                                "short": "false"
                            }, {
                                "title": "Brand",
                                "value": base,
                                "short": "false"
                            }, {
                                "title": "Notification Type",
                                "value": pretext,
                                "short": "false"
                            }, {
                                "title": "Price",
                                "value": price,
                                "short": "false"
                            }, {
                                "title": "Add Cart Links 🚪",
                                "value": links,
                                "short": "false"
                            }
                        ],
                        "thumb_url": res.img,
                        "footer": "Shopify Monitor",
                        "ts": Math.floor(Date.now() / 1000),
                        "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png"
                    }
                ]
            }
            slackBot.postMessage(config.slackBot.channel, null, params);
        }
    }
}

function formatProxy(str) {
    // TODO: format is ip:port:user:pass
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
