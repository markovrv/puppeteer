const axios = require('axios');

var current = null;

var getProxy = () => new Promise((resolve, reject) => {
  var arr = []
  axios({
    method: 'get',
    url: 'https://proxy.house/api/open/v1/proxy/list?tariff_id=3&limit=20',
    timeout: 10000,
    headers: {
      "Auth-Token": "503460_1685571348_6fdb7cdb513a1b3aae942eecff17d0d341d49bb0",
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