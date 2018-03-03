# shopify-monitor v3
Monitor for Shopify based brands

[Community Discord Server](https://discord.gg/BkDxcjT)

### Installation

shopify-monitor requires [Node.js (LTS Version)](http://nodejs.org/).

![webapp](https://i.imgur.com/ZTGlrfq.png)

Setup:

```sh
git clone https://github.com/dzt/shopify-monitor.git
cd shopify-monitor
npm install # "sudo npm install" if you're on macOS or Linux
```

Configure information inside the `config.example.json` but be sure to rename it to `config.json` when you're done. Be sure to ONLY modify `port` and `mongodb_uri` fields.

Run After Setup:

```sh
node server.js
```

More information on configuration will be added soon.

## Todo List
- [ ] Products Search Page.
- [ ] Slack
- [ ] Edit Tasks
- [ ] Presets
- [ x ] Price Change Updates

### Some more screenshots to flex

![1](https://i.imgur.com/WbOxrBO.png)
![2](https://i.imgur.com/IUSU8b8.png)
![3](https://i.imgur.com/SVEh07S.png)

## License

```
The MIT License (MIT)

Copyright (c) 2017 Peter Soboyejo <http://petersoboyejo.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
