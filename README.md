# Shopify Monitor
Monitor for Shopify based brands

[Community Discord Server](https://discord.gg/BkDxcjT)

[macOS Install Video Guide](https://youtu.be/rpO5wdudfpQ)

[Windows Install Video Guide](https://youtu.be/KlgZdFRd5r4)

### Installation

shopify-monitor requires [Node.js (LTS Version)](http://nodejs.org/).

![webapp](https://i.imgur.com/ZTGlrfq.png)

Setup:

```sh
git clone https://github.com/aabbccsmith/shopify-monitor.git
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
- [x] Edit Tasks
- [ ] Presets
- [x] Price Change Updates
- [x] YeezySupply
- [x] Quick Tasks

### Some more screenshots to flex

![1](https://i.imgur.com/WbOxrBO.png)
![2](https://i.imgur.com/IUSU8b8.png)
![3](https://i.imgur.com/SVEh07S.png)
