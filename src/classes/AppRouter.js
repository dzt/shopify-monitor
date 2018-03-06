const {
	version
} = require('../../package');

const Seller = require('../models/Seller');
const Product = require('../models/Product');
const NewProduct = require('../models/NewProduct');

const Notify = require('../classes/Notify');

const proxyUtil = require('../utils/proxy');
const moment = require('moment');
const fs = require('fs');
const parseUrl = require("parse-url");
const multer = require('multer')
const upload = multer({
	dest: 'uploads/'
})

let randomColors = [
	'#007bff',
	'#6610f2',
	'#6f42c1',
	'#e83e8c',
	'#dc3545',
	'#fd7e14',
	'#ffc107',
	'#28a745',
	'#20c997',
	'#17a2b8',
	'#6c757d',
	'#343a40',
	'#007bff',
	'#6c757d',
	'#28a745',
	'#17a2b8',
	'#ffc107',
	'#dc3545',
	'#f8f9fa',
	'#343a40'
]

class AppRouter {

	constructor(app) {
		this.app = app;
		this.setupRouters();
	}

	setupRouters() {
		const app = this.app;

		app.get('/', (req, res, next) => {

			let storesWithColors = [];
			let newItemsWithColors = [];
			let isEmpty = true;

			Seller
				.find({})
				.limit(3)
				.sort('-dateAdded')
				.exec(function(err, stores) {

					for (let i = 0; i < stores.length; i++) {
						storesWithColors.push({
							color: randomColors[Math.floor(Math.random() * randomColors.length)],
							proxies: stores[i].proxies,
							keywords: stores[i].keywords,
							_id: stores[i]._id,
							url: stores[i].url,
							lastItemAdded: stores[i].lastItemAdded,
							lastItemCount: stores[i].lastItemCount,
							pollMS: stores[i].pollMS
						})
					}

					NewProduct
						.find({})
						.sort('-dateAdded')
						.limit(3)
						.exec(function(err, products) {

							for (let i = 0; i < products.length; i++) {
								newItemsWithColors.push({
									color: randomColors[Math.floor(Math.random() * randomColors.length)],
									url: products[i].url,
									image: products[i].image,
									dateAdded: products[i].dateAdded,
									site: products[i].site,
									title: products[i].title
								})
							}

							if (newItemsWithColors.length > 0) {
								isEmpty = false;
							}

							return res.render('home', {
								status: global.status,
								stores: storesWithColors,
								count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
								needsRestart: global.needsRestart,
								startTime: global.startTime,
								newItems: newItemsWithColors,
								isEmpty: isEmpty
							});

						});

				});

		});

		app.get('/stores', (req, res, next) => {

			Seller
				.find({})
				.exec(function(err, stores) {

					let storesWithColors = [];

					for (let i = 0; i < stores.length; i++) {
						storesWithColors.push({
							color: randomColors[Math.floor(Math.random() * randomColors.length)],
							proxies: stores[i].proxies,
							keywords: stores[i].keywords,
							_id: stores[i]._id,
							url: stores[i].url,
							lastItemAdded: stores[i].lastItemAdded,
							lastItemCount: stores[i].lastItemCount,
							pollMS: stores[i].pollMS
						})
					}

					return res.render('stores', {
						stores: storesWithColors,
						count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
						needsRestart: global.needsRestart
					});

				});

		});

		app.post('/stores/add', (req, res, next) => {

			if (req.body.url == '' || req.body.pollMS == '') {
				return res.json(200, {
					message: 'Missing important fields to add store, please try again',
					error: true
				})
			}

			let newStore = new Seller({
				url: parseUrl(req.body.url).resource,
				lastItemAdded: null,
				lastItemCount: null,
				proxies: (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n')),
				keywords: (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n'),
				pollMS: req.body.pollMS,
				dateAdded: moment(),
				storeHash: null
			});

			newStore.save();

			if (global.status == 'Active') {
				global.needsRestart = true;
			}

			return res.redirect('/stores');

		});

		app.get('/settings', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {
				let dataToAppend = JSON.parse(data);

				if (dataToAppend.discord.active) {
					dataToAppend.discord.active = 'checked'
				}

				if (dataToAppend.slackBot.active) {
					dataToAppend.slackBot.active = 'checked'
				}

				return res.render('settings', {
					settings: dataToAppend
				});
			});

		});

		app.post('/settings/update', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {

				let dataToAppend = JSON.parse(data);
				console.log(req.body)

				let discord = false;
				let slack = false;

				if (req.body.slackBotActive == 'on') {
					slack = true;
				}

				if (req.body.discordActive == 'on') {
					discord = true;
				}

				let newConfig = {
					"port": dataToAppend.port,
					"mongodb_uri": dataToAppend.mongodb_uri,
					"slackBot": {
						"active": slack,
						"token": req.body.token,
						"channel": req.body.channel,
						"settings": {
							"username": req.body.username,
							"icon_url": req.body.icon_url
						}
					},
					"discord": {
						"active": discord,
						"webhook_url": req.body.webhook_url
					}
				}

				global.config = newConfig;

				fs.writeFile(__dirname + '/../../config.json', JSON.stringify(newConfig, null, 4), function(err) {
					return res.redirect('/settings');
				});

			});

		});

		app.get('/restart', (req, res, next) => {
			global.stopTasks();
			setTimeout(function() {
				global.startTasks();
				return res.redirect('/');
			}, 10000);
		});

		app.get('/stop', (req, res, next) => {

			global.stopTasks();
			return res.redirect('/');

		});

		app.get('/start', (req, res, next) => {
			global.startTasks();
			return res.redirect('/');
		});

		app.get('/logs', (req, res, next) => {
			return res.render('logs', {
				logs: global.logs
			});
		});

		app.get('/products', (req, res, next) => {
			res.json({
				message: 'Coming Soon :)',
				error: false
			})
		});

		app.get('/settings/discord/test', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {
				Notify.discordTest(JSON.parse(data).discord.webhook_url);
			});

			return res.redirect('/settings');

		});

		app.get('/logs/clear', (req, res, next) => {
			global.logs = '';
			return res.redirect('/logs');
		});

		app.get('/store/delete/:id', (req, res, next) => {
			Seller.findOneAndRemove({
				_id: req.params.id
			}, function(err) {
				if (err) {
					return res.json({
						message: 'Seller not found',
						error: true
					})
				} else {
					global.stopTasks();
					return res.redirect('/stores');
				}
			});
		});

		app.post('/stores/addFile', upload.single('sitelist'), (req, res, next) => {

			if (req.body.file == '' || req.body.pollMS == '') {
				return res.json(200, {
					message: 'Missing important fields to add store, please try again',
					error: true
				})
			}

			const siteList = fs.readFileSync(req.file.path).toString().split('\n');

			for (let i = 0; i < siteList.length; i++) {
				if (siteList[i] != '') {
					let newStore = new Seller({
						url: parseUrl(siteList[i]).resource,
						lastItemAdded: null,
						lastItemCount: null,
						proxies: (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n')),
						keywords: (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n'),
						pollMS: req.body.pollMS,
						dateAdded: moment(),
						storeHash: null
					});
					newStore.save();
				}
			}
			global.stopTasks();
			return res.redirect('/stores');

		});

		app.get('/store/:id', (req, res) => {

			Seller.findById(req.params.id, (err, s) => {

				if (s) {
					s.keywords = s.keywords.join('\n');

					for (let i = 0; i < s.proxies.length; i++) {
						s.proxies[i] = s.proxies[i].replace("http://", "")
					}

					s.proxies = s.proxies.join('\n');

					if (err) return res.json({
						message: err,
						error: true
					});
					return res.render('store', s);
				} else {
					return res.json({
						message: 'Error Occured while trying to find: ' + req.params.id,
						error: true
					})
				}
			});

		});

		app.post('/store/update/:id', (req, res) => {

			Seller.findById(req.params.id, (err, s) => {

				if (err) return res.redirect('/stores');

				s.pollMS = parseInt(req.body.pollMS);
				s.proxies = (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n'))
				s.keywords = (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n');

				s.save();
				global.stopTasks();

				setTimeout(() => {
					return res.redirect(`/store/${req.params.id}`);
				}, 1500);

			});

		});


	}

}

module.exports = AppRouter;