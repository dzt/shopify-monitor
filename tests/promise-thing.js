const config = require('./config');
const db = require('knex')(config.database);

console.log(config.database)

var queryPromises = [];

queryPromises.push(db('products').where({
    productURL: "https://shop.exclucitylife.com/products/clyde-perforated-trapstar-3"
}).first());

Promise.all(queryPromises).then((ret) => {
    console.log(ret);
}).catch((e) => {
    console.log('err', e);
});
