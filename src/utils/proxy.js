let proxy = {};

proxy.formatProxy = function(proxy) {
  if (proxy && ['localhost', ''].indexOf(proxy) < 0) {
    proxy = proxy.replace(' ', '_');
    const proxySplit = proxy.split(':');
    if (proxySplit.length > 3)
      return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
    else
      return "http://" + proxySplit[0] + ":" + proxySplit[1];
    }
  else
    return undefined;
}

proxy.getRandomItem = function(array) {
  if (array.length === 0) {
    return null;
  } else {
    return proxy.formatProxy(array[Math.floor(Math.random() * array.length)]);
  }
}

proxy.formatList = function(array) {
  let list = [];
  for (let i = 0; i < array.length; i++) {
    list.push(proxy.formatProxy(array[i]));
  }
  return list;
}

module.exports = proxy;
