let init = function(db) {
	// Create the tables we need to store tokens
	db.schema.createTableIfNotExists('products', function (table) {
		table.increments()
		table.string('site')
		table.string('productURL')
    table.string('lastmod')
	}).then(() => {})

	db.schema.createTableIfNotExists('topChange', function (table) {
		table.increments()
		table.string('site')
		table.string('productURL')
	}).then(() => {})

}

module.exports = init
