# shopify-monitor 2.0
Monitor for Shopify based brands

[YouTube Tutorial](https://youtu.be/QMDi6_u6wn4)

[Community Discord Server](https://discord.gg/BkDxcjT)

### Installation

shopify-monitor requires [Node.js (LTS Version)](http://nodejs.org/).

![slack](https://i.imgur.com/34ziNVQ.png)

Setup:

```sh
$ git clone https://github.com/dzt/shopify-monitor.git
$ cd shopify-monitor
$ npm install # "sudo npm install" if you're on macOS or Linux
$ sudo npm install sqlite3 --save  # this command is essential only if you're on macOS
$ npm install pm2 -g
```

Configure information inside the `config.example.json` but be sure to rename it to `config.json` when you're done. More information about configuring your monitor can be found <a href="https://github.com/dzt/shopify-monitor/wiki/Configuring-your-monitor">here</a>.

If you end up getting a lot of errors in regards to SQL in the setup process run `sudo npm install sqlite3 --save` (macOS/Linux) or `npm install sqlite3 --save` on Windows.


Run After Setup:

```sh
$ pm2 start app.js --name "shopify-monitor"
```

## Configuration
Most things in the configuration are self explanatory. However, with the newly added keywords feature, there _are_ some details to know.

- Keywords are _only_ checked against titles.
- There is no 'negative keyword' support at the moment.
- Finally, it will STILL fetch the product details before checking keywords. Keep this in mind.

To modify keywords, simply modify the `keywords` section of the configuration and set active to true. Then you can list your keywords as such:

```json
"keywords": {
  "active": true,
  "list": [
    "adidas",
    "yeezy",
    "nmd"
  ]
}
```

More information on configuration will be added soon.

## Todo List
- [ ] Twitter.
- [x] Discord
- [ ] Removed/Sold Out Items.
- [ ] Better Docs

### What does this thing monitor?
- Newly added items
- Restocks

## Core Team

| [@dzt](https://github.com/dzt) | [@cameronb23](https://github.com/cameronb23) |
|---|---|
| [![](https://avatars1.githubusercontent.com/u/6421443?v=3&s=100)](https://github.com/dzt) | [![](https://avatars1.githubusercontent.com/u/7783071?v=3&s=100)](https://github.com/cameronb23) |

## Troubleshooting
There are a few common errors you may encounter that you have questions about. The most common include connection timeouts and parsing errors. Fixes and explanations for both of these errors are listed below.

- Knex timeout error: [Fix](https://github.com/dzt/shopify-monitor/issues/72)
- Parsing error: [Explanation](https://github.com/dzt/shopify-monitor/issues/82#issuecomment-343574150)

### Some more screenshots to flex

- Shout out to [@WashedEllis](https://twitter.com/WashedEllis) who plugged me with proxies for testing.

## License

```
The MIT License (MIT)

Copyright (c) 2017 Peter Soboyejo <http://petersoboyejo.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
