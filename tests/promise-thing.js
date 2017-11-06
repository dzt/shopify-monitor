const config = require('./config');
const db = require('lowdb')(new (require('lowdb/adapters/FileSync'))(config.database))
require('./database/lowdb.js')(db);

console.log(db)

var queryPromises = [];

queryPromises.push(db.get('products').filter({
    productURL: "https://shop.exclucitylife.com/products/clyde-perforated-trapstar-3"
}).take(1).value());

Promise.all(queryPromises).then((ret) => {
    console.log(ret);
}).catch((e) => {
    console.log('err', e);
});
