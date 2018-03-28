const DiscordWebhook = require("discord-webhooks");

let Notify = {};

Notify.discord = function (webhook_url, url, brand, metadata, type, color) {

	let myWebhook = new DiscordWebhook(webhook_url);
	if (isNaN(metadata.stock)) {
		var stock = 'Unavailable'
	} else {
		var stock = metadata.stock
	}

	var price = metadata.price

	var links;
	if (Array.isArray(metadata.links)) {
		const set = [];
		for (let i = 0; i < metadata.links.length; i++) {
			const variant = metadata.links[i];
			let baseUrl = variant.baseUrl;
			set.push(`[${variant.title}](${baseUrl}/cart/${variant.id}:1)`);
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

Notify.discordTest = function (webhook_url) {
	let myWebhook = new DiscordWebhook(webhook_url);
	myWebhook.on("ready", () => {
		myWebhook.execute({
			content: "Shopify Monitor Test"
		});
	});
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
					"value": (data.variants == null) ? 'Unavailable' : data.variants.map(x => x = x.options[0] + ` - ${x.id}`).join('\n'),
					"inline": true
				}]
			}]
		}
		myWebhook.execute(exec);
	});
}

module.exports = Notify;