const browserlist = require("../lib/browserlist")
const common = require("../lib/common")
const crypto = require("../lib/crypto")
const pusherLog = true;
const pusher = common.pusher
const debug = common.debug;

module.exports = async (req, res, next) => {

  var auth = req.body.auth
  var page

  if (browserlist.hasIss(auth.login)) {
    page = browserlist.getIss(auth.login)
  } else {

    if (debug) console.log("Загрузка страницы")

    //   Новая страница
    page = await req.browser.newPage();
    await page.setViewport({
      width: 1040,
      height: 720,
      deviceScaleFactor: 1,
    });

    //   Загружаем сайт
    page.setUserAgent(req.get('User-Agent'))
    await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });

    if (debug) console.log("Авторизация")

    //   Авторизуемся
    await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, auth.login);
    await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, crypto.decrypt(auth.passwordAES));
    await page.click('a[id="O64_id"]');

    if (debug) console.log("Загрузка меню")

    // Ждем загрузки меню
    await page.waitForSelector('label[id="OA3_id"]');

    if (debug) console.log("Загрузка журнала")

    //   Выбираем раздел Журнал
    await page.click('td[id="O19_id-inputCell"]');
    await page.click('li[class="x-boundlist-item"]:last-child');

    //   Ждем загрузки журнала
    await page.waitForSelector('table[id="gridview-1015-table"]');

    if (auth.semester == 2) {
      if (debug) console.log("МЕНЯЕМ СЕМЕСТР НА 2")
      await page.waitForSelector('a[id="tab-1079"]');
      await common.wait(1000);
      await page.click('a[id="tab-1079"]');
      await page.click('a[id="tab-1079"]');
      await page.click('a[id="tab-1079"]');
      await page.click('a[id="tab-1079"]');
    }

    if (debug) console.log("Журнал загружен")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Журнал загружен",
        color: "white",
        time: new Date()
      });
    }

    await common.wait(2000);

  }

  req.page = page

  // запоминаем для дальнейшего использования
  if (browserlist.hasBrowser(auth.login)) {
    browserlist.setIss(auth.login, page)
  } else {
    browserlist.setBrowserIss(auth.login, req.browser, page)
  }

  next()

}