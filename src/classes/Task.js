const proxyUtil = require('../utils/proxy');
const Shopify = require('./Shopify');
const Notify = require('./Notify');
const mongoose = require('mongoose');
const fs = require('fs');

const Seller = require('../models/Seller');
const Product = require('../models/Product');
const NewProduct = require('../models/NewProduct');
const moment = require('moment');
const _ = require('lodash');
const cheerio = require('cheerio');
const md5 = require('md5');

class Task {

	constructor(monitorData, config) {
		this.taskData = monitorData;
		this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3107.4 Safari/537.36';
		this.proxies = monitorData.proxies; /* Empty Array if there are none. */
		this.keywords = monitorData.keywords;
		this.url = monitorData.url;
		this.active = true;
		this.firstRun = true;
		this.intv = null;
		this.intervalCount = 0;
		this.poll = monitorData.pollMS;
		this.sellerID = monitorData._id;
		this.ysMode = null;
	}

	async start() {

		let f;

		this.intv = setInterval(f = () => {

			const randomProxy = (this.proxies.length > 0) ? this.proxies[Math.floor(Math.random() * this.proxies.length)] : null;

			if (this.url != 'yeezysupply.com') {
				Shopify.parseSitemap(this.url, randomProxy, this.userAgent, (err, products) => {

					if (err) {

						this.log(err, 'error');

						if (err == 'Invalid Shopify Site.') {
							/* Stop Current Task */
							this.stop();
						}

						if (err == 'Temp Ban Occured.') {
							this.restart();
						}

					} else {

						/* Add Items to Data store (First Run) */
						if (this.firstRun) {
							if (products.length > 0) {
								this.updateSeller(products[products.length - 1].loc[0], products.length, md5(JSON.stringify(products)));
							} else {
								this.updateSeller(null, products.length, md5(JSON.stringify(products)));
							}

							for (let i = 0; i < products.length; i++) {
								let newProduct = new Product({
									url: products[i].loc[0],
									seller: this.sellerID,
									lastModification: products[i].lastmod
								});
								newProduct.save();
							}

							this.firstRun = false;
							this.log('Initial Check Done');

						} else {

							Seller.findOne({
								url: this.url
							}, (err, sellerQuery) => {

								if (err) {
									this.log('Query Error - ' + err);
								}

								let lastItemCompare;

								if (products.length == 0) {
									lastItemCompare = null;
								} else {
									lastItemCompare = _.last(products).loc[0];
								}

								/* Check if any new items were added */
								if (sellerQuery.lastItemAdded != lastItemCompare ||
									sellerQuery.lastItemCount != products.length ||
									sellerQuery.storeHash != md5(JSON.stringify(products))) {

									console.log(`[${this.url}] Changes were made`);

									if (products.length == 0) {
										this.updateSeller(null, products.length, md5(JSON.stringify(products)));
									} else {
										this.updateSeller(products[products.length - 1].loc[0], products.length, md5(JSON.stringify(products)));
									}

									for (let i = 0; i < products.length; i++) {

										Product.findOne({
											url: products[i].loc[0]
										}, (err, p) => {

											if (!p) {

												let foundProduct = new Product({
													url: products[i].loc[0],
													seller: this.sellerID,
													lastModification: products[i].lastmod
												});

												if (this.keywords.length == 0) {

													this.log('New Item: ' + products[i].loc[0]);
													Shopify.getStockData(products[i].loc[0], randomProxy, (res, err) => {
														if (err) {
															this.log(err)
														}

														let newCop = new NewProduct({
															url: products[i].loc[0],
															image: res.img,
															dateAdded: moment(),
															site: this.url,
															title: res.title
														});
														newCop.save();

														if (global.config.discord.active) {
															Notify.discord(global.config.discord.webhook_url, products[i].loc[0], this.url, res, 'Newly Added Item', 1609224);
														}
													});


													foundProduct.save();

												} else {

													for (let x = 0; i < this.keywords.length; x++) {
														const ky = this.keywords[x];
														if (products[i].loc[0].indexOf(ky) > -1) {
															this.log('New Item: ' + products[i].loc[0]);
															Shopify.getStockData(products[i].loc[0], randomProxy, (res, err) => {
																if (err) {
																	this.log(err)
																} else {
																	let newCop = new NewProduct({
																		url: products[i].loc[0],
																		image: res.image,
																		dateAdded: moment(),
																		site: this.url,
																		title: res.title
																	});

																	newCop.save();

																	if (global.config.discord.active) {
																		Notify.discord(global.config.discord.webhook_url, products[i].loc[0], this.url, res, 'Newly Added Item', 1609224);
																	}
																}
															});

															foundProduct.save();

														}
														break;
													}

												}

											} else {

												/* Check for Price Changes and Restocks */
												// TODO: Keyword Support for Restocks and Price changes
												if (this.keywords.length == 0) {

													Product.findOne({
														url: products[i].loc[0]
													}, (err, productToCheck) => {
														if (products[i].lastmod != productToCheck.lastModification) {

															Shopify.getStockData(products[i].loc[0], randomProxy, (res, err) => {
																if (err) {
																	this.log(err)
																} else {
																	this.log('Restock/Price Change: ' + products[i].loc[0]);

																	if (global.config.discord.active) {
																		Notify.discord(global.config.discord.webhook_url, products[i].loc[0], this.url, res, 'Restock/Price Change', 2061822);
																	}
																}

															});
															productToCheck.lastModification = products[i].lastmod;
															productToCheck.save();


														}
													});

												} else {
													for (let x = 0; i < this.keywords.length; x++) {
														const ky = this.keywords[x];
														if (products[i].loc[0].indexOf(ky) > -1) {

															Shopify.getStockData(products[i].loc[0], randomProxy, (res, err) => {
																if (err) {
																	this.log(err)
																} else {
																	this.log('Restock/Price Change: ' + products[i].loc[0]);

																	if (global.config.discord.active) {
																		Notify.discord(global.config.discord.webhook_url, products[i].loc[0], this.url, res, 'Restock/Price Change', 2061822);
																	}
																}

															});
															productToCheck.lastModification = products[i].lastmod;
															productToCheck.save();

														}
														break;
													}
												}

											}

										});

									}
								}
							})

						}
					}
				});
			} else {
				/* YeezySupply tings */

				/*

					upcoming - Single Product Page
					pw - password page
					live - product live

				*/

				if (this.firstRun) {

					Shopify.fetchYS(this.userAgent, randomProxy, this.mode, (err, data) => {
						if (!err) {

							if (global.config.discord.active) {
								Notify.ys(global.config.discord.webhook_url, data);
							}

							this.mode = data.mode;
							this.firstRun = false;
							this.log('Initial Check Done @ ' + this.mode);

						}
					});


				} else {

					Shopify.fetchYS(this.userAgent, randomProxy, this.mode, (err, data) => {
						if (!err) {

							if (this.mode != data.mode) {
								if (global.config.discord.active) {
									Notify.ys(global.config.discord.webhook_url, data);
								}
								this.mode = data.mode;
								this.log('Mode Changed: ' + this.mode);
							}

						}
					});

				}
			}

			this.intervalCount++;

		}, this.poll);

		f();

	}

	async stop() {
		this.log('Stopped')
		this.active = false;
		global.needsRestart = false;
		clearInterval(this.intv);
	}

	async restart() {
		this.log('Restarting task after ban in 60 secondss...');
		this.active = false;
		global.needsRestart = false;
		clearInterval(this.intv);
		var that = this;
		setTimeout(function () {
			that.start();
		}, 60000);
	}



	async updateSeller(lastItemAdded, lastItemCount, storeHash) {
		try {
			await Seller.findByIdAndUpdate(this.sellerID, {
				lastItemAdded: lastItemAdded,
				lastItemCount: lastItemCount,
				storeHash: storeHash
			});
		} catch (e) {
			this.log(e, 'error');
		}
	}

	log(msg, type) {

		var formatted = moment().format('MMMM Do YYYY h:mm:ss a')

		switch (type) {
			case 'error':
				console.error(`[${this.url}]: ` + msg);
				break;
			case 'info':
				console.info(`[${this.url}]: ` + msg);
				break;
			default:
				console.log(`[${this.url}]: ` + msg);
		}
		global.logs += `[${formatted}][${this.url}] ${msg}\n`
	}

}

module.exports = Task;