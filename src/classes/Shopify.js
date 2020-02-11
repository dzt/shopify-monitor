const xml2js = require('xml2js');
const request = require('request');
const cheerio = require('cheerio');

let Shopify = {};

Shopify.parseSitemap = function (url, proxy, userAgent, callback) {

	request({
		method: 'get',
		url: 'https://' + url + '/sitemap.xml',
		proxy: proxy,
		gzip: true,	
		headers: {
			'User-Agent': userAgent
		}
	}, (err, resp, body) => {

		if (err) return callback(err, null);

		if (body.indexOf('Please try again in a couple minutes by refreshing the page') > -1) {

			return callback('Temp Ban Occured.', null);

		}else if (body.indexOf('http://www.sitemaps.org/schemas') > -1) {

			const parsedsitemap = xml2js.parseString(body, (error, result) => {

			if (error || result == undefined) return callback(error, true);

			let sitemapurl = result['sitemapindex']['sitemap'][0]['loc'][0];

			request({
				method: 'get',
				url: sitemapurl,
				proxy: proxy,
				gzip: true,
				headers: {
					'User-Agent': userAgent
				}
			}, (errr, respp, bodyy) => {
				if (typeof bodyy != undefined && !errr && bodyy.indexOf()) {
					if (bodyy.indexOf('Please try again in a couple minutes by refreshing the page') > -1) {
						return callback('Temp Ban Occured.', null);
					} else if (bodyy.indexOf('http://www.sitemaps.org/schemas') > -1) {

						const parsed = xml2js.parseString(bodyy, (errorr, resultt) => {

							if (errr || result == undefined) return callback(errorr, true);

							let products = resultt['urlset']['url'];
							products.shift()
							return callback(null, products);

						})

					} else if (bodyy.indexOf('Please try again in 5 or 10 minutes by refreshing the page.') > -1){
						return callback('Temp Ban Occured or Technical problem', null);
					} else {
						return callback('Invalid Shopify Site.', null);
					}
				} else {
					return callback('An error occured whilst trying to check the site.', null);
				}

			});

		});

		}else if (body.indexOf('Please try again in 5 or 10 minutes by refreshing the page.') > -1){
			return callback('Temp Ban Occured or Technical problem', null);
		}

	})

}
Shopify.fetchYS = function (userAgent, proxy, mode, callback) {

	request({
		method: 'get',
		url: 'https://yeezysupply.com/',
		proxy: proxy,
		gzip: true,
		followRedirect: true,
		headers: {
			'User-Agent': userAgent
		}
	}, (err, resp, body) => {

		if (err) return callback(err, null);

		let $ = cheerio.load(body);
		let data;

		if (body.toLowerCase().indexOf('TOMORROW') > -1 || body.toLowerCase().indexOf('TODAY') > -1) {
			data = {
				pageURL: resp.request.uri.href,
				img: 'http:' + $('div[class="P__img_bg"] img').attr('src'),
				title: (mode == null) ? "Monitor Started @ Upcoming Page" : `Upcoming Page Live for "${$('div[itemprop="name"]').text()}"!`,
				mode: 'upcoming',
				variants: null
			}
			return callback(null, data);
		}

		if (body.toLowerCase().indexOf('/cart/add') > -1 && resp.request.uri.path == '/') {

			Shopify.parseVariantsYS(body.toLowerCase(), (err, variants) => {
				data = {
					pageURL: resp.request.uri.href,
					img: 'http:' + $('div[class="P__img_bg"] img').attr('src'),
					title: (mode == null) ? "Monitor Started @ Cart Page" : `Page Live for "${$('div[itemprop="name"]').text()}"!`,
					mode: 'live',
					variants: variants
				}
				return callback(null, data);
			});

		}

		if (resp.request.uri.path == '/password') {
			data = {
				pageURL: resp.request.uri.href,
				img: null,
				title: (mode == null) ? 'Monior Started @ Password Page' : 'Password Page Live',
				mode: 'pw',
				variants: null
			}
			return callback(null, data);
		}

	});

}

Shopify.parseVariantsYS = function (body, callback) {

	let parsedObjects = [];
	let fields = [];

	let arr = body.toString().split('p.variants.push(').map(x => x.replace(");", ""))
	arr.shift();

	let formatJSON = (object, fields) => {

		for (let i = 0; i < fields.length; i++) {
			object = object.replace(fields[i], `"${fields[i]}"`);
		}

		return JSON.parse(object);

	}

	let fetchFields = objectStr => {
		objectStr.trim();
		let newArr = objectStr.split(':').map(x => x.trim());
		let list = [];
		for (let i = 0; i < newArr.length; i++) {
			if (i != (newArr.length - 1)) {
				let fieldName = newArr[i].split('\n')[newArr[i].split('\n').length - 1].replace(/ /g, '');
				list.push(fieldName)
			}
		}
		return list;
	}

	for (let i = 0; i < arr.length; i++) {
		if (arr[i].indexOf('options') > -1) {
			if (i == (arr.length - 1)) {
				let obj = arr[i].split("}")[0] + "}";
				let fields = fetchFields(obj);
				parsedObjects.push(formatJSON(obj, fields));
			} else {
				let obj = arr[i];
				let fields = fetchFields(obj);
				parsedObjects.push(formatJSON(obj, fields));
			}
		}
	}

	return callback(null, parsedObjects);

}

Shopify.getStockData = function (url, proxy, callback) {

	let status;
	let totalStock = 0;

	request({
		url: url + '.json',
		method: 'get',
		proxy: proxy,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
		}
	}, function (err, res, body) {

		if (err) {
			return callback(null, 'An error has occured while trying to establish a connection when collecting stock data.');
		} else {
			if (tryParseJSON(body)) {
				let jsonBodyProduct = JSON.parse(body)
				let data = []
				for (let i = 0; i < jsonBodyProduct.product.variants.length; i++) {
					totalStock += jsonBodyProduct.product.variants[i].inventory_quantity
					const baseUrl = url.split('/products')[0] // remove the product path from url

					const variantData = {
						baseUrl,
						id: jsonBodyProduct.product.variants[i].id,
						title: jsonBodyProduct.product.variants[i].option1
					};

					// data.push('<' + baseUrl + '/cart/' + jsonBodyProduct.product.variants[i].id + ':1' + '|' + jsonBodyProduct.product.variants[i].option1 +'>')
					data.push(variantData);
				}

				if (totalStock > 0) {
					status = 'Available'
				} else {
					status = 'Sold Out'
				}

				if (isNaN(totalStock)) {
					var finalStock = 'Unavailable'
				} else {
					var finalStock = totalStock
				}

				let image = "https://i.imgur.com/FpYrCaS.png";

				if (jsonBodyProduct.product.image != null) {
					image = jsonBodyProduct.product.image.src
				}

				let product = {
					title: jsonBodyProduct.product.title,
					handle: jsonBodyProduct.product.handle,
					stock: finalStock,
					status: status,
					links: data,
					img: image,
					price: '$' + jsonBodyProduct.product.variants[0].price
				}

				return callback(product, null)

			} else {
				return callback(null, 'An error has occured while trying to establish a connection when collecting stock data.');
			}
		}

	})
}

function tryParseJSON(jsonString) {
	try {
		let o = JSON.parse(jsonString);
		if (o && typeof o === "object") {
			return o;
		}
	} catch (e) {}
	return false;
}

module.exports = Shopify;
