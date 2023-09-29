const common = require("../lib/common")
const strasp = require("../lib/strasp")
const pusherLog = true;
const pusher = common.pusher

module.exports = (req, res) => {
    (async (data, auth) => {

        var multiday = false
        var rasplist = []
        var i = 0;
        var count = data.groups.length
    
        var page = req.page

        page.bringToFront();
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

          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Вводим запрос..."
            });
          }

          await strasp.inputId(page, "input-question", group)
          await common.wait(600);
          await page.click('div[type="submit"]');
          await common.wait(600);

          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Получен ответ."
            });
          }
          
          // уточнение результатов поиска (нововведение от сентября `23)
          var buttonsList = await strasp.getButtonsList(page)
          var buttonId = buttonsList.findIndex(elem => elem.indexOf(group)>-1)
          if( buttonId > -1 ) {

            if (pusherLog) {
              pusher.trigger(auth.login, "my-event", {
                message: "Уточняем запрос."
              });
            }

            await strasp.pressButton(page, buttonsList[buttonId]);
            await common.wait(700);
          }
          //////////////////////////////////////////////////////////////

          if(!multiday){
            await strasp.pressButton(page, "На любой день")
            await common.wait(700);

            if (pusherLog) {
              pusher.trigger(auth.login, "my-event", {
                message: "Открываем календарь..."
              });
            }
          }
          var buttonsList = await strasp.getButtonsList(page)
          var buttonId = buttonsList.findIndex(elem => elem.indexOf(data.date)>-1)
          if( buttonId > -1 ) {

            if (pusherLog) {
              pusher.trigger(auth.login, "my-event", {
                message: "Выбираем день..."
              });
            }

            await strasp.pressButton(page, buttonsList[buttonId])
            await common.wait(700);
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

          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Чистим историю поиска..."
            });
          }
    
          await common.wait(700);
          await strasp.pressButton(page, "Назад")
          await common.wait(700);
          await strasp.pressButton(page, "Назад")
          await common.wait(700);
          i++
        }// конец цикла
        
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Пожалуйста, подождите..."
          });
        }
    
        res.send(rasplist)
       
      })({groups: req.body.groups, date: req.body.date}, req.body.auth);
}