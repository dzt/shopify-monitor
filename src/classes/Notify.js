const DiscordWebhook = require("discord-webhooks");
const SlackWebhook = require('slack-webhook')

let Notify = {};

Notify.discord = function (webhook_url, url, brand, metadata, type, color) {

	let myWebhook = new DiscordWebhook(webhook_url);
	let stock;
	if (isNaN(metadata.stock)) {
		stock = 'Unavailable'
	} else {
		stock = metadata.stock
	}

	let price = metadata.price

	let links;
	if (Array.isArray(metadata.links)) {
		const set = [];
		for (let i = 0; i < metadata.links.length; i++) {
			const letiant = metadata.links[i];
			let baseUrl = letiant.baseUrl;
			set.push(`[${letiant.title}](${baseUrl}/cart/${letiant.id}:1)`);
		}
		links = set.join('\n');
	} else {
		links = 'Unavailable'
	}

	myWebhook.on("ready", () => {
		myWebhook.execute({
			embeds: [{
				"title": metadata.title,
				"url": url,
				"color": color,
				"timestamp": new Date().toISOString(),
				"footer": {
					"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
					"text": "Shopify Monitor by dzt"
				},
				"thumbnail": {
					"url": metadata.img
				},
				"author": {
					"name": "Shopify Monitor",
					"url": "https://discordapp.com",
					"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
				},
				"fields": [{
					"name": "Notification Type",
					"value": type,
					"inline": true
				}, {
					"name": "Stock Count",
					"value": stock,
					"inline": true
				}, {
					"name": "Brand",
					"value": brand,
					"inline": true
				}, {
					"name": "Price",
					"value": price,
					"inline": true
				}, {
					"name": "Links",
					"value": links
				}]
			}]
		});
	});
}

Notify.slack = function (webhook_url, url, brand, metadata, type, color) {

	let webhook = new SlackWebhook(webhook_url);

	if (isNaN(metadata.stock)) {
		let stock = 'Unavailable'
	} else {
		let stock = metadata.stock
	}

	let price = metadata.price

	let links;
	if (Array.isArray(metadata.links)) {
		const set = [];
		for (let i = 0; i < metadata.links.length; i++) {
			const letiant = metadata.links[i];
			let baseUrl = letiant.baseUrl;
			set.push(`[${letiant.title}](${baseUrl}/cart/${letiant.id}:1)`);
		}
		links = set.join('\n');
	} else {
		links = 'Unavailable'
	}

	webhook.send({
		attachments: [
			{
			  "fallback": metadata.title,
			  "title": metadata.title,
			  "title_link": url,
			  "color": color,
			  "fields": [
				{
				  "title": "Stock Count",
				  "value": stock,
				  "short": "false"
				}, {
				  "title": "Brand",
				  "value": brand,
				  "short": "false"
				}, {
				  "title": "Notification Type",
				  "value": type,
				  "short": "false"
				}, {
				  "title": "Price",
				  "value": price,
				  "short": "false"
				}, {
				  "title": "Links 🚪",
				  "value": links,
				  "short": "false"
				}
			  ],
			  "thumb_url": metadata.img
			}
		  ]
	})
}

Notify.discordTest = function (webhook_url) {
	let myWebhook = new DiscordWebhook(webhook_url);
	myWebhook.on("ready", () => {
		myWebhook.execute({
			content: "Shopify Monitor Test"
		});
	});
}

Notify.slackTest = function (webhook_url) {
	let webhook = new SlackWebhook(webhook_url);
	webhook.send('Shopify Monitor Test');
}

Notify.ys = function (webhook_url, data) {
	let myWebhook = new DiscordWebhook(webhook_url);
	myWebhook.on("ready", () => {
		let exec = {
			embeds: [{
				"title": "Yeezy Supply Monitor",
				"description": data.title,
				"url": "https://yeezysupply.com/",
				"color": 15844367,
				"timestamp": new Date().toISOString(),
				"footer": {
					"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
					"text": "Shopify Monitor by dzt"
				},
				"thumbnail": {
					"url": data.img
				},
				"author": {
					"name": "Shopify Monitor",
					"url": "https://discordapp.com",
					"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
				},
				"fields": [{
					"name": "Sizes",
					"value": (data.letiants == null) ? 'Unavailable' : data.letiants.map(x => x = x.options[0] + ` - ${x.id}`).join('\n'),
					"inline": true
				}]
			}]
		}
		myWebhook.execute(exec);
	});
}

module.exports = Notify;
