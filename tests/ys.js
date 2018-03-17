const fs = require('fs');

fs.readFile('ys.html', function(err, body) {
    if (err) {
        console.log(err);
    }

    let parsedObjects = [];
    let fields = [];

    let arr = body.toString().split('p.variants.push(').map(x => x.replace(");", ""))
    arr.shift()

    for (let i = 0 ; i < arr.length; i++) {
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

    console.log(parsedObjects);

});

let formatJSON = (object, fields) => {

    for (let i = 0; i < fields.length; i++) {
        object = object.replace(fields[i], `"${fields[i]}"`);
    }

    return JSON.parse(object);
    
}

let fetchFields = objectStr => {
    objectStr.trim();
    let newArr = objectStr.split(':').map( x => x.trim() );
    let list = [];
    for (let i = 0; i < newArr.length; i++) {
        if (i != (newArr.length - 1)) {
            let fieldName = newArr[i].split('\n')[newArr[i].split('\n').length - 1].replace(/ /g,'');
            list.push(fieldName)
        }
    }
    return list;
}