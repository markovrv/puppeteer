const browserlist = require("../lib/browserlist")
const common = require("../lib/common")
const strasp = require("../lib/strasp")
const pusherLog = true;
const pusher = common.pusher

module.exports = async (req, res, next) => {

  if(browserlist.hasLk(req.body.auth.login)){
    req.page = browserlist.getLk(req.body.auth.login)
  } else {
    req.page = await req.browser.newPage();
    await req.page.setViewport({
      width: 1040,
      height: 720,
      deviceScaleFactor: 1,
    });
  
    await req.page.setRequestInterception(true);
    req.page.on('request', request => {
      if (request.resourceType() === 'font' || request.resourceType() === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    });

    if (pusherLog) {
      pusher.trigger(req.body.auth.login, "my-event", {
        message: "Загрузка приложения..."
      });
    }

    req.page.setUserAgent(req.get('User-Agent'))
    await req.page.goto('https://new.vyatsu.ru/account/');

    await req.page.waitForSelector('div[class="chat-button bell"]');

    await req.page.click('div[class="chat-button bell"]');
    await new Promise(r => setTimeout(r, 550));
    await strasp.pressButton(req.page, "Студент/Сотрудник")
    await new Promise(r => setTimeout(r, 550));
    await strasp.pressButton(req.page, "Общее расписание")
    await new Promise(r => setTimeout(r, 550));
  }

  // запоминаем для дальнейшего использования
  if(browserlist.hasBrowser(req.body.auth.login)) {
    browserlist.setLk(req.body.auth.login, req.page)
  } else {
    browserlist.setBrowserLk(req.body.auth.login, req.browser, req.page)
  }

  next()
  
}