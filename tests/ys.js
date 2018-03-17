const fs = require('fs');

fs.readFile('ys.html', function(err, body) {
    if (err) {
        console.log(err);
    }

    let parsedObjects = [];

    let arr = body.toString().split('p.variants.push(').map(x => x.replace(");", ""))
    arr.shift()

    for (let i = 0 ; i < arr.length; i++) {
        if (arr[i].indexOf('options') > -1) {
            if (i == (arr.length - 1)) {

            } else {
                console.log(arr[i])
            }
        }
    }

    

    //console.log(arr[0]);

});