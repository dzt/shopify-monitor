require('console-stamp')(console, {
    colors: {
        stamp: 'yellow',
        label: 'cyan',
        label: true,
        metadata: 'green'
    }
});

const async = require('async');
const config = require('./config');
const log = require('./utils/log');
const chalk = require('chalk');
const taskLib = require('./task');
const api = require('./utils/api')

const db = require('knex')(config.database);
require('./database/db.js')(db);

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
    log('error', 'An error occurred while connecting to Slack, please try again.')
    return process.exit()
  })
}

log(chalk.bgBlack.green('config.json file has been loaded'));

var proxyCount = 0;

if (config.proxies) {
    var readline = require('linebyline'),
        rl = readline('./proxies.txt');
    rl.on('line', function(line, lineCount, byteCount) {
        proxyCount++;
    }).on('error', function(e) {});
}

setTimeout(function() {
    log(chalk.bgBlack.blueBright(`Proxies: ${proxyCount}`));
    log(chalk.bgBlack.blueBright(`Site Count: ${config["sites"].length}`));
    log('------------------------------------------------');
}, 500);

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

            log('------------------------------------------------');

        }
    });

}

events.on('initCheck', (data) => {});

events.on('newItem', (data) => {
    console.log(`new item: \n ${JSON.stringify(data)}`);
    slackNotification(res, '#36a64f', 'Newly Added Item', data.base)
});

events.on('restock', (data) => {
  console.log(`restock: \n ${JSON.stringify(data)}`);
  slackNotification(res, '#4FC3F7', 'Restock', data.base)
});

//slackNotification("https://shop-usa.palaceskateboards.com/products/at-pants-black", '#36a64f', 'Newly Added Item', "nigga");

function slackNotification(url, color, pretext, base) {
    if (config.slackBot.active) {
        var stockCount
        api.getStockData(url, (res, err) => {
            if (err) {
                log('error', `Error occured while fetching stock data from ${parsedResult.link}`)
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
                links = res.links.join('\n');
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
