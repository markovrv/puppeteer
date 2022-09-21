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
    // функция нажатия кнопки на странице
    function pressButton(name) {
      return new Promise((resolve, reject) => {
        page.evaluate((text) => {
          var elems = document.querySelectorAll("span");
          var res = Array.from(elems).find(v => v.textContent == text);
          return res.id.split('-')[0];
        }, name).then(id => {
          page.click(`a[id="${id}"]`).then(()=>resolve());
        })
      })
    }
    // функция проверки корректности карточки
    function checkCard(work) {
      return new Promise((resolve, reject)=>{
        page.evaluate(data => {
          var items = document.querySelectorAll('div[class="x-panel-body x-panel-white x-panel-body-default x-abs-layout-ct x-panel-body-default x-docked-noborder-top x-docked-noborder-right x-docked-noborder-bottom x-docked-noborder-left"] li')
  
          var cat = -1
          if (items[0].textContent == "Занятия: Чтение лекций") { cat = 0; } 
          else if (items[0].textContent == "Занятия: Проведение практических занятий, семинаров"){ cat = 1; } 
          else if (items[0].textContent == "Занятия: Проведение лабораторных занятий (лабораторных практикумов)"){ cat = 2; }
          var name = items[2].textContent.replace("Дисциплина: ", "")
          var groups = items[3].textContent.replace("Группа: ", "").replace('В потоке ', '')
          return data.name == name && data.groups == groups && data.cat == cat
  
        }, work).then(checked => {resolve(checked)})
      });
    }
    // функция заполняет поле Время
    function inputTime(time) {
      return new Promise((resolve, reject) => {
        page.click(`input[tabindex="139"]`).then(()=>{
          page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id).then(id=>{
            page.click(`div[id="${id}"] li:nth-child(${time})`).then(()=>resolve());
          })
        });
      })
    }
    // функция проверки логов
    function checkLog(log, data) {
      var prevLog = (log.rows)?log.rows:[];
      var cancel = false;
      prevLog.forEach(item => {
        var date = item[0].split(' ')[0];
        var time = times.indexOf(item[0].split(' ')[1]) + 1;
        var count = Number(item[1]);
        if (date == data.date && time == data.time) cancel = true;
        if (date == data.date && time + 1 == data.time && count - 2 == data.count) cancel = true;
        else if (date == data.date && time + 2 == data.time && count - 4 == data.count) cancel = true;
        else if (date == data.date && time + 3 == data.time && count - 6 == data.count) cancel = true;
      });
      return cancel;
    }
    // функция заполняет поле c TabIndex
    function inputTab(tab, text) {
      return new Promise((resolve, reject) => {
        page.evaluate(val => document.querySelector(`input[tabindex="${val.tab}"]`).value = val.text, {tab, text}).then(()=>{resolve()})
      })
    }

    //   Открываем браузер
    const browser = await puppeteer.launch({ headless: false});
    // const browser = await puppeteer.launch({args: ['--no-sandbox']});

    //   Новая страница
    const page = await browser.newPage();
    await page.setViewport({
      width: 1040,
      height: 720,
      deviceScaleFactor: 1,
    });

    //   Загружаем сайт
    await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });

    // Сообщение для возврата клиенту
    var message = [];
    // Массив логов журнала
    var lastLog = [];
    // прослушиваем запросы, отлавливаем лог
    page.on('response', async (response) => {   
      var url = response.url();
      if (url.indexOf("IsEvent=1")>0 && url.indexOf("options=1")>0) { 
          var text = await response.text();
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
    await new Promise(r => setTimeout(r, 200));

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
      // Клик по найденной работе (на всякий случай - два раза)
      await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`, {delay: 200});
      await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`, {delay: 200});
      await new Promise(r => setTimeout(r, 200));

      //   Открываем форму добавления работы
      await pressButton("Добавить");

      //   Ждем загрузки формы
      await page.waitForSelector('input[tabindex="142"]');

      // проверяем, что данные предмета в форме отобразились правильно
      if(!await checkCard(input[w])) {
        message.push({id: input[w].id, status: 'Внутренняя ошибка сервиса', color: "red"});
        await pressButton("Отмена");
        continue;
      }

      //   Заполняем форму
      await inputTab('142', input[w].date)
      await inputTab('141', input[w].count)
      await inputTime(input[w].time);

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

      // Проверяем лог предмета
      if(checkLog(lastLog, input[w])){
        await pressButton("Отменить");
        message.push({id: input[w].id, status: 'Нагрузка уже в журнале', color: "blue", log: lastLog.rows});
      } else {
        await pressButton("Сохранить");
        message.push({id: input[w].id, status: 'Нагрузка добавлена', color: "green"});
        await new Promise(r => setTimeout(r, 2000));
      }
    }

  // Закрываем браузер и возвращаем ответ
    res.send(message);
    await browser.close();
  
  })(req.body.data, req.body.auth);
});

app.listen(3333);