# shopify-monitor
Monitor for Shopify based brands

![term](http://i.imgur.com/6xzBTEH.png)

### Installation

shopify-monitor requires [Node.js](http://nodejs.org/).

Setup:

```sh
$ git clone https://github.com/dzt/shopify-monitor.git
$ cd shopify-monitor
$ npm install
```

Configure information inside the `config.example.json` be sure to rename it to `config.json` when you're done. More information about configuring your monitor can be found <a href="https://github.com/dzt/shopify-monitor/wiki/Configuring-your-monitor">here</a>.

<br>

Run After Setup:

```sh
$ node monitor.js
```

<a href="https://www.youtube.com/watch?v=oirJnCmtfQY&feature=youtu.be">Video Demo</a>

## Todo List
- [x] Integrate restock monitor.
- [ ] Multiple brand support on the demands of the people.
- [ ] Add Sitemap feature to search sitemap instead of site DOM for finding early links.
- [ ] Add Discord and Twitter API Settings to Tweet/Send out notifications to chats/timeline.
- [ ] Slack bot commands.
- [ ] Better wiki/docs.

### What does this thing monitor?
- Newly added items
- Items that become Sold Out
- Items that get restocked
- Items that get removed from stores.
- Early Links.

### Who

Written by <a href="http://petersoboyejo.com/">@dzt</a>, made better by you.

### Some more screenshots to flex

![slack](http://i.imgur.com/h7Jt0wT.png)

## License

```
The MIT License (MIT)

Copyright (c) 2017 Peter Soboyejo <http://petersoboyejo.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
