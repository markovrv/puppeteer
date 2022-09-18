const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const jsonParser = express.json();
const times = ["8:20:00", "10:00:00", "11:45:00", "14:00:00", "15:45:00", "17:20:00", "18:55:00"];

app.use(express.static('app'));

app.use(function(req, res, next) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With, content-type');
  next();
});

app.post('/api', jsonParser, (req, res) => {
  (async (input, auth) => {
    //   Открываем браузер
    const browser = await puppeteer.launch({ headless: false});
    //   Новая страница
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: 1,
    });

    //   Загружаем сайт
    await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });
    var lastLog = [];
    page.on('response', async (response) => {   
      var url = response.url();
      if (url.indexOf("IsEvent=1")>0 && url.indexOf("options=1")>0) { 
          var text = await response.text();
          // var json = JSON.parse(text); 
          eval('lastLog = ' + text);
      }
    }); 

    //   Авторизуемся
    await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, auth.login);
    await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, auth.password);
    await page.click('a[id="O64_id"]');
    // Ждем загрузки меню
    await page.waitForSelector('label[id="OA3_id"]');
    //   Выбираем раздел Журнал
    await page.click('td[id="O19_id-inputCell"]');
    await page.click('li[class="x-boundlist-item"]:last-child');
    //   Ждем загрузки журнала
    await page.waitForSelector('table[id="gridview-1015-table"]');
    await new Promise(r => setTimeout(r, 1000));
    //   Сообщение для возврата клиенту
    var message = [];
    // Перебираем список работ в задании
    for (let w = 0; w < input.length; w++) {
      //   Парсим таблицу нагрузки
      const itemIndex = await page.evaluate((data) => {
        // Получаем id работ по типам нагрузки (ищем первые элементы каждого типа)
        if(!window.catlist) {
          window.catlist = [];
          let categories = Array.from(document.querySelectorAll(`td[class="x-group-hd-container"]`));
          categories.forEach(category => {
            window.catlist.push({firstId: Number(category.parentNode.getAttribute("data-recordid"))});
          });
        }
        // Получаем список работ, сгруппированый по типам нагрузки
        if(!window.countItems){
          window.countItems = Array.from(document.querySelectorAll('tr[id^="gridview-1015-record-"]')).length;
        }
        var cat = 0;
        // Проверяем каждую работу на соответствие искомым параметрам
        var overloaded = false; // флаг - нагрузка по работе выполнена
        for (let i = 0; i < window.countItems; i++) {
          let item = Array.from(document.querySelectorAll(`tr[id="gridview-1015-record-${i}"] div`));
          let name = item[3].textContent;
          let groups = item[4].textContent.replace('В потоке ', '');
          let newCat = window.catlist.findIndex(cat => (cat.firstId == i));
          cat = (newCat > -1)?newCat:cat;
          var percent = 0;
          if(!(item[5].firstElementChild == undefined || item[5].firstElementChild.firstElementChild == undefined))
            percent = Number(item[5].firstElementChild.firstElementChild.getAttribute("style").split('%')[0].split(':')[1]);
          // Если соответствие найдено, возвращаем индекс нужной строки
          if(data.name == name && data.groups == groups && data.cat == cat) {
            if(percent < 100) return i;
            // Если нашлось совпадение, но нагрузка по строке уже заполнена
            overloaded = true;
          }
        }
        // В случае, если соответствий нет, выводим -1, нагрузка заполнена -2
        if(overloaded) return -2;
        return -1;
      }, {name: input[w].name, groups: input[w].groups, cat: input[w].cat});
  
      //   Обработка исключений
      if (itemIndex == -1) {
        message.push({id: input[w].id, status: 'Нагрузка не найдена', color: "red"});
        continue;
      }

      if (itemIndex == -2) {
        message.push({id: input[w].id, status: 'Нагрузка заполнена', color: "red"});
        continue;
      }
      // Клик по найденной работе
      await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`);
      await new Promise(r => setTimeout(r, 1000));

      //   Открываем форму добавления работы
      // Ищем кнопку Добавить
      let btnAddId = await page.evaluate((text) => {
        var elems = document.querySelectorAll("span");
        var res = Array.from(elems).find(v => v.textContent == text);
        return res.id.split('-')[0];
      }, "Добавить");
      // Жмем кнопку
      await page.click(`a[id="${btnAddId}"]`);

      //   Ждем загрузки формы
      await page.waitForSelector('input[tabindex="142"]');
      //   Заполняем форму: дата, количество
      await page.evaluate(val => document.querySelector('input[tabindex="142"]').value = val, input[w].date);
      await page.evaluate(val => document.querySelector('input[tabindex="141"]').value = val, input[w].count);
      // Заполняем поле Время
      await page.click(`input[tabindex="139"]`);
      let timeListId = await page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id);
      await page.click(`div[id="${timeListId}"] li:nth-child(${input[w].time})`);
      // Ищем поле Кабинет
      await page.click(`input[tabindex="143"]`)
      let KabListId = await page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[2].id);
      //   Парсим кабинеты
      // Если дистант
      if( input[w].kab.length > 10 ) {
        await page.click(`div[id="${KabListId}"] li:nth-child(1)`);
        await page.click(`input[tabindex="144"]`)
        let WorkFormListId = await page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[3].id);
        await page.click(`div[id="${WorkFormListId}"] li:nth-child(1)`);
        await page.evaluate(val => document.querySelector('input[tabindex="145"]').value = val, input[w].kab);
      } else {
        // иначе ищем кабинет в списке
        const kabIndex = await page.evaluate((data) => {
          // Получаем список кабинетов
              let kabs = Array.from(document.querySelectorAll(`div[id="${data.KabListId}"] li`));
              let countKabs = kabs.length;
          // Проверяем каждый кабинет на соответствие искомым параметрам
              for (let i = 1; i < countKabs; i++) {
                  let kab = kabs[i].textContent;
                  if(data.kab == kab) return i;
              }
          // В случае, если соответствий нет, выводим 0
              return 0;
            }, {kab: input[w].kab, KabListId});
        // Выбираем нужный кабинет
        await page.click(`div[id="${KabListId}"] li:nth-child(${kabIndex + 1})`);
      }
      // Проверка наличия работы в логах нагрузки (логи загружаются автоматическипри выборе работы в массив lastLog)
      var prevLog = (lastLog.rows)?lastLog.rows:[];
      var cancel = false;
      prevLog.forEach(item => {
        var date = item[0].split(' ')[0];
        var time = times.indexOf(item[0].split(' ')[1]) + 1;
        var count = Number(item[1]);
        if (date == input[w].date && time == input[w].time) cancel = true;
        if (date == input[w].date && time + 1 == input[w].time && count - 2 == input[w].count) cancel = true;
        else if (date == input[w].date && time + 2 == input[w].time && count - 4 == input[w].count) cancel = true;
        else if (date == input[w].date && time + 3 == input[w].time && count - 6 == input[w].count) cancel = true;
      });

      // Скриншотим для отчета
      // await page.screenshot({path: `iss_${w}.png`});

      if(cancel){
        // Ищем кнопку Отмена
        let btnId = await page.evaluate((text) => {
          var elems = document.querySelectorAll("span");
          var res = Array.from(elems).find(v => v.textContent == text);
          return res.id.split('-')[0];
        }, "Отменить");
        // Жмем кнопку Отмена
        await page.click(`a[id="${btnId}"]`);
        // Фиксируем сообщение об отмене
        message.push({id: input[w].id, status: 'Нагрузка уже есть в журнале', color: "blue", log: prevLog});
      } else {
        // Ищем кнопку Сохранить
        let btnId = await page.evaluate((text) => {
          var elems = document.querySelectorAll("span");
          var res = Array.from(elems).find(v => v.textContent == text);
          return res.id.split('-')[0];
        }, "Сохранить");
        // Жмем кнопку Сохранить
        await page.click(`a[id="${btnId}"]`);
        await new Promise(r => setTimeout(r, 2000));
        // Фиксируем сообщение об успешном сохранении
        message.push({id: input[w].id, status: 'Нагрузка успешно добавлена', color: "green"});
      }
    }
  
  // Закрываем браузер и возвращаем ответ
    res.send(message);
    await browser.close();
  
  })(req.body.data, req.body.auth);
});

app.listen(3333);