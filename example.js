const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const jsonParser = express.json();

app.use(function(req, res, next) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With, content-type');
  next();
});

app.post('/', jsonParser, (req, res) => {
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
  
    // Перебираем список работ в задании
    for (let w = 0; w < input.length; w++) {
      //   Парсим таблицу нагрузки
      const itemIndex = await page.evaluate((data) => {
        // Получаем id работ по типам нагрузки (ищем первые элементы каждого типа)
        let catList = [];
        let categories = Array.from(document.querySelectorAll(`td[class="x-group-hd-container"]`));
        categories.forEach(category => {
            catList.push({firstId: Number(category.parentNode.getAttribute("data-recordid"))});
        });
        // Получаем список работ, сгруппированый по типам нагрузки
        let countItems = Array.from(document.querySelectorAll('tr[id^="gridview-1015-record-"]')).length;
        let cat = 0;
        // Проверяем каждую работу на соответствие искомым параметрам
        var overloaded = false; // флаг - нагрузка по работе выполнена
        for (let i = 0; i < countItems; i++) {
            let item = Array.from(document.querySelectorAll(`tr[id="gridview-1015-record-${i}"] div`));
            let name = item[3].textContent;
            let groups = item[4].textContent.replace('В потоке ', '');
            let newCat = catList.findIndex(cat => (cat.firstId == i));
            cat = (newCat > -1)?newCat:cat;
            var percent = 0;
            if(!(item[5].firstElementChild == undefined || item[5].firstElementChild.firstElementChild == undefined))
              percent = Number(item[5].firstElementChild.firstElementChild.getAttribute("style").split('%')[0].split(':')[1]);
            // Если соответствие найдено, возвращаем индекс нужной строки
            if(data.name == name && data.groups == groups && data.cat == cat) {
              if(percent < 100) return i;
              overloaded = true;
            }
        }
        // В случае, если соответствий нет, выводим -1
        if(overloaded) return -2;
        return -1;
      }, {name: input[w].name, groups: input[w].groups, cat: input[w].cat});
  
      //   Обработка исключений
      if (itemIndex == -1) {
        await browser.close();
        res.send({ message: 'Work not found' });
        return null;
      }

      if (itemIndex == -2) {
        await browser.close();
        res.send({ message: 'Work is overloaded' });
        return null;
      }
  
      await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`, {delay: 500});
      //   Открываем форму добавления работы
      await page.click(`a[id="O11B_id"]`, {delay: 500});
      //   Ждем загрузки формы
      await page.waitForSelector('input[tabindex="142"]');
      //   Заполняем форму
      await page.evaluate(val => document.querySelector('input[tabindex="142"]').value = val, input[w].date);
      await page.evaluate(val => document.querySelector('input[tabindex="141"]').value = val, input[w].count);
      await page.click(`input[tabindex="139"]`);
      let timeListId = await page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id);
      await page.click(`div[id="${timeListId}"] li:nth-child(${input[w].time})`);
      await page.click(`input[tabindex="143"]`)
      let KabListId = await page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[2].id);
  
      //   Парсим кабинеты
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
      // Скриншотим для отчета
      await page.screenshot({path: `iss_${w}.png`});
      // Жмем кнопку Отмена
      let btnId = await page.evaluate((text) => {
        var elems = document.querySelectorAll("span");
        var res = Array.from(elems).find(v => v.textContent == text);
        return res.id.split('-')[0];
      }, "Отменить");
      await page.click(`a[id="${btnId}"]`);
    }
  
  // Закрываем браузер
    await browser.close();
    res.send({ message: 'OK' });
  
  })(req.body.data, req.body.auth);
});

app.listen(3333);