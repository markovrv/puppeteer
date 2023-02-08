var browsers = {} // по 1 браузеру для каждого пользователя. Каждый сервис - в своей вкладке

exports.startTimer = () => {
    setInterval(() => {
        for (var userName in browsers) {
          if (Date.now() - browsers[userName].session > 1000 * 60 * 5) { // браузер закроется через 5 минут бездействия
            console.log(`Закрываем браузер пользователя ${userName} по таймауту запросов`)
            browsers[userName].browser.close()
            delete browsers[userName]
          }
        }
      }, 1000 * 30); // проверка каждые 30 секунд
}
exports.hasBrowser = (userName) => (browsers[userName] && browsers[userName].browser)
exports.getBrowser = (userName) => {
    browsers[userName].session = Date.now()
    return browsers[userName].browser
}
exports.hasIss = (userName) => (browsers[userName] && browsers[userName].issPage)
exports.getIss = (userName) => (browsers[userName].issPage)
exports.setIss = (userName, page) => {
    browsers[userName].issPage = page
    browsers[userName].session = Date.now()
}
exports.setBrowserIss = (userName, browser, issPage) => {
    browsers[userName] = {browser, issPage, session: Date.now()}
}
exports.hasLk = (userName) => (browsers[userName] && browsers[userName].lkPage)
exports.getLk = (userName) => (browsers[userName].lkPage)
exports.setLk = (userName, page) => {
    browsers[userName].lkPage = page
    browsers[userName].session = Date.now()
}
exports.setBrowserLk = (userName, browser, lkPage) => {
    browsers[userName] = {browser, lkPage, session: Date.now()}
}

exports.closeBrowser = (userName) => {
    console.log(`Закрываем браузер пользователя ${userName} по запросу клиента`)
    if(browsers[userName]) {
        browsers[userName].browser.close()
        delete browsers[userName]
    }
}