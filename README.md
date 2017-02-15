# shopify-monitor
Monitor for Shopify based brands

![term](http://i.imgur.com/baiwk9f.png)

### Installation

<a href="https://youtu.be/oIDPuyMBwvI">Screencast</a>

shopify-monitor requires [Node.js](http://nodejs.org/).

Setup:

```sh
$ git clone https://github.com/dzt/shopify-monitor.git
$ cd shopify-monitor
$ npm install
```

Configure information inside the `config.example.json` be sure to rename it to `config.json` when you're done. More information about configuring your monitor can be found <a href="https://github.com/dzt/shopify-monitor/wiki/Configuring-your-monitor">here</a>.


<a href="https://github.com/dzt/shopify-monitor/wiki/Configuring-your-monitor">General Configuration Guide</a>

<a href="https://github.com/dzt/shopify-monitor/wiki/Twitter">Twitter Configuration Guide</a>

<a href="https://github.com/dzt/shopify-monitor/wiki/Slack">Slack Configuration Guide</a>


Run After Setup:

```sh
$ npm start
```

<a href="https://www.youtube.com/watch?v=oirJnCmtfQY&feature=youtu.be">Video Demo</a>

## Todo List
- [x] Integrate restock monitor.
- [x] Multiple brand support on the demands of the people.
- [x] Add Sitemap feature to search sitemap instead of site DOM for finding early links.
- [x] Add Twitter API Settings to Tweet/Send out notifications to timeline.
- [x] Have results return item stock
- [x] Slack bot commands.
- [x] Add Brands via main link.
- [x] Better wiki/docs.
- [ ] Web Interface to modify sites, keywords, etc. (config)
- [x] Garbage collection to prevent heap error after running the monitor over time.
- [ ] Proxy Support
- [ ] Redis Storage for Cache


### What does this thing monitor?
- Newly added items
- Items that become Sold Out
- Items that get restocked
- Items that get removed from stores.
- Early Links.

**Note: If you add a site link to your config you will only be updated on newly dropped items. I'm working on finding a way to add all functionality to people using links instead of built in brands.**

### Brands???
- Palace USA (`palace`)
- AntiSocialSocialClub (`assc`)
- More to come soon inside of the box, but you can simply add a site domain into the `sites` array in your `config.json` file or you can add a sitemap url that ends in `.xml`.

**Note: each site link should have http:// or https:// at the beginning or shopify-monitor won't pick it up.**

### Who

Written by <a href="http://petersoboyejo.com/">@dzt</a>, made better by you.

### Some more screenshots to flex

![new](https://i.imgur.com/86GnKHD.jpg)
- Shout out to [@lucidhyped](https://twitter.com/lucidhyped) who helped me spot a minor bug and suggested adding the add cart stock.

![slack](http://i.imgur.com/h7Jt0wT.png)

![hyper](http://i.imgur.com/TME8GvF.png)
- Beating HyperSniper by 37 seconds :^)


## License

```
The MIT License (MIT)

Copyright (c) 2017 Peter Soboyejo <http://petersoboyejo.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
