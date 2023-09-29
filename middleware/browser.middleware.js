const puppeteer = require('puppeteer')
const browserlist = require("../lib/browserlist")
const common = require("../lib/common")
const debug = common.debug;
const pusherLog = true;
const pusher = common.pusher
const app_env = common.app_env;
const proxy = require("../lib/proxy")
const config = require("../config")

module.exports = async (req, res, next) => {

  if (browserlist.hasBrowser(req.body.auth.login)) {
    req.browser = browserlist.getBrowser(req.body.auth.login)
  } else {

    if (debug) {
      console.log('===================================');
      console.log('');
      console.log("Активация")
    }
    if (pusherLog) {
      pusher.trigger(req.body.auth.login, "my-event", {
        message: "Активация API...", 
        color: "white",
        time: new Date()
      });
    }

    var p = await proxy.current()
    var proxyString = (config.proxy.enabled)?`--proxy-server=${p.host}:${p.port}`:'';

    //   Открываем браузер
    if(app_env == 'public')  {
      req.browser = await puppeteer.launch({args: ['--no-sandbox', proxyString]});
    } else {
      req.browser = await puppeteer.launch({ headless: !debug, args: [proxyString] });
    }
  }

  next()
  
}