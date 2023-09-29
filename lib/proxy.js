const axios = require('axios');
const config = require("../config")

var current = null;

var getProxy = () => new Promise((resolve, reject) => {
  var arr = []
  axios({
    method: 'get',
    url: config.proxy.url,
    timeout: 10000,
    headers: {
      "Auth-Token": config.proxy.authToken
    }
  }).then(response => {
    var proxies = response.data.data.proxies
    for(var key in proxies){
      if (proxies[key].active == 1)
        arr.push({host: proxies[key].ip, port: proxies[key].http_port})
    }
    var i = Math.floor(Math.random()*arr.length);
    current = arr[i];
    resolve(current);
  })
})

exports.get = () => new Promise((resolve, reject) => {
  getProxy().then(resolve)
})

exports.current = () => new Promise((resolve, reject) => {
  if (current) resolve(current)
  else getProxy().then(resolve)
})