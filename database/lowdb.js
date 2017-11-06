let init = function(db) {
	return db.defaults({products: []}).write()    
}

module.exports = init
