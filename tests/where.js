const _ = require('underscore');

var products = [
  {
    "name": "lol",
    "loc": [
        "https://shop.dertbag.us/products/dertbag-academy-champion-t-shirt"
    ],
    "lastmod": [
        "2016-05-20T17:20:00-04:00"
    ]
  }
]

var val = products.find(function (o) { return o.loc[0] == ["httpproducts/dertbag-academy-champion-t-shirt"]; });

if (val == null) {
  console.log("null lol");
}
