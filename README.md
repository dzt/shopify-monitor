# shopify-monitor 2.0
Monitor for Shopify based brands

### Installation

shopify-monitor requires [Node.js (LTS Version)](http://nodejs.org/).

![slack](https://i.imgur.com/34ziNVQ.png)

Setup:

```sh
$ git clone https://github.com/dzt/shopify-monitor.git
$ cd shopify-monitor
$ npm install # "sudo npm install" if you're on macOS or Linux
```

Configure information inside the `config.example.json` be sure to rename it to `config.json` when you're done. More information about configuring your monitor can be found <a href="https://github.com/dzt/shopify-monitor/wiki/Configuring-your-monitor">here</a>.

If you end up getting a lot of errors in regards to SQL in the setup process run `sudo npm install sqlite3 --save` (macOS/Linux) or `npm install sqlite3 --save` on Windows.


Run After Setup:

```sh
$ npm start
```

## Todo List
- [ ] Twitter.
- [ ] Discord
- [ ] Removed/Sold Out Items.
- [ ] Better Docs

### What does this thing monitor?
- Newly added items
- Restocks

### Who

Written by <a href="http://petersoboyejo.com/">@dzt</a>, made better by you.

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
