const puppeteer = require('puppeteer');
const browserlist = require("../lib/browserlist")
const common = require("../lib/common")
const strasp = require("../lib/strasp")
const app_env = common.app_env;
const debug = common.debug
const pusherLog = true;
const pusher = common.pusher


exports.getData = (req, res) => {
    (async (data, auth) => {
        var browser, page
        var multiday = false
        var rasplist = []
        var i = 0;
        var count = data.groups.length
    
        if (browserlist.hasBrowser(auth.login)) {
          browser = browserlist.getBrowser(auth.login)
        } else {
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Активация API..."
            });
          }
          if(app_env == 'public')  {
            browser = await puppeteer.launch({args: ['--no-sandbox']});
          } else {
            browser = await puppeteer.launch({ headless: !debug});
          }
        }
        if(browserlist.hasLk(auth.login)){
          page = browserlist.getLk(auth.login)
        } else {
          page = await browser.newPage();
          await page.setViewport({
            width: 1040,
            height: 720,
            deviceScaleFactor: 1,
          });
        
          await page.setRequestInterception(true);
          page.on('request', request => {
            if (request.resourceType() === 'font' || request.resourceType() === 'image') {
              request.abort();
            } else {
              request.continue();
            }
          });
    
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Загрузка приложения..."
            });
          }
    
          await page.goto('https://new.vyatsu.ru/account/');
    
          await page.waitForSelector('div[class="chat-button bell"]');
    
          await page.click('div[class="chat-button bell"]');
          await new Promise(r => setTimeout(r, 550));
          await strasp.pressButton(page, "Студент/Сотрудник")
          await new Promise(r => setTimeout(r, 550));
          await strasp.pressButton(page, "Общее расписание")
          await new Promise(r => setTimeout(r, 550));
        }
        // Активация многодневного режима
        if(data.date == "") {
          data.date = "Расписание"
          multiday = true
        }
    
        // начало цикла
        while (i < count) {
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: `загрузка ${i+1} из ${count} ...`
            });
          }
          var group = data.groups[i]
          var subgr = 0
          if (group.indexOf(',подгруппа1')>-1) subgr = 1
          if (group.indexOf(',подгруппа2')>-1) subgr = 2
          await strasp.inputId(page, "input-question", group)
          await common.wait(550);
          await page.click('div[type="submit"]');
          await common.wait(550);
          if(!multiday){
            await strasp.pressButton(page, "На любой день")
            await new Promise(r => setTimeout(r, 550));
          }
          var buttonsList = await strasp.getButtonsList(page)
          var buttonId = buttonsList.findIndex(elem => elem.indexOf(data.date)>-1)
          if( buttonId > -1 ) {
            await strasp.pressButton(page, buttonsList[buttonId])
            await new Promise(r => setTimeout(r, 550));
            var rasp = await page.evaluate(() => {
                var items = document.querySelectorAll('div[class="chat-message-answer"]');
                return items[items.length - 1].innerHTML
            })
          } else {
            var rasp = ''
            if (multiday) { rasp = "ERROR" }
            else { rasp = `➡ ${group}<br>Расписание на дату ${data.date} недоступно` }
            if (pusherLog) {
              pusher.trigger(auth.login, "my-event", {
                message: rasp
              });
            }
          }
    
          var content = strasp.parse(rasp, subgr)
    
          if (content.length > 0) rasplist.push({group, content})
          else {
            buttonsList.pop();
            var dates = buttonsList.sort(strasp.sortbtns)
            rasplist.push({rasp, dates, group})
          }
    
          await common.wait(550);
          i++
        }// конец цикла
        
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Пожалуйста, подождите..."
          });
        }
    
        res.send(rasplist)
    
        // запоминаем для дальнейшего использования
        if(browserlist.hasBrowser(auth.login)) {
          browserlist.setLk(auth.login, page)
        } else {
          browserlist.setBrowserLk(auth.login, browser, page)
        }
       
      })({groups: req.body.groups, date: req.body.date}, req.body.auth);
}