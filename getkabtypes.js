const puppeteer = require('puppeteer');
const common = require("./lib/common");
const fs = require('fs');

    // функция нажатия кнопки на странице
    function pressButton(page, name) {
      return new Promise((resolve, reject) => {
        page.evaluate((text) => {
          var elems = document.querySelectorAll("span");
          var res = Array.from(elems).find(v => v.textContent == text);
          return res.id.split('-')[0];
        }, name).then(id => {
          page.click(`a[id="${id}"]`).then(()=>resolve());
        }).catch(e=>console.log(e))
      })
    }

  (async () => {
    var browser = await puppeteer.launch({ headless: false});
    var page = await browser.newPage();
    await page.setViewport({
      width: 1040,
      height: 720,
      deviceScaleFactor: 1,
    });

    //   Загружаем сайт
    page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 YaBrowser/22.11.2.807 Yowser/2.5 Safari/537.36")
    await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });

    //   Авторизуемся
    await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, '********');
    await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, '********');
    await page.click('a[id="O64_id"]');

    // Ждем загрузки меню
    await page.waitForSelector('label[id="OA3_id"]');

    //   Выбираем 6 раздел
    await page.click('td[id="O19_id-inputCell"]');
    await page.waitForSelector('li[class="x-boundlist-item"]');
    await common.wait(200);
    await page.click('li[class="x-boundlist-item"]:nth-child(6)');
    await page.waitForSelector('input[id="OBE_id-inputEl"]');
    await common.wait(300);
    await page.click('input[id="OBE_id-inputEl"]');
    await page.waitForSelector('div[id="boundlist-1047-listEl"]');
    await common.wait(50);

    // Загружаем предпоследний год
    await page.click('div[id="boundlist-1047-listEl"] li:nth-child(2)');
    await page.waitForSelector('table[class="x-gridview-1032-table x-grid-table x-grid-table-selected-first x-grid-table-focused-first"]');
    await common.wait(50);
    await pressButton(page, "Заполнить/просмотреть РП");

    // Переходим в раздел Аудитории
    await page.waitForSelector('li[id="opmenu8"]');
    await common.wait(50);
    await page.click('li[id="opmenu8"] a');
    await page.waitForSelector('tbody[id="gridview-1116-body"]');
    await common.wait(100);

    // Активируем список корпусов
    await page.waitForSelector('input[id="O247_id-inputEl"]');
    await page.click('input[id="O247_id-inputEl"]');
    await page.waitForSelector('div[id="boundlist-1157-listEl"]');
    await common.wait(100);

    var corps = await page.evaluate(() => {
      var corps = []
      document.querySelectorAll('div[id="boundlist-1157-listEl"] li').forEach(li=>{corps.push(li.textContent)});
      return corps;
    },{});

    var id = 0;
    var corplist = [];
    var count = corps.length;

    while ( id < count ) {
      if ( id > 0 ) {
        await page.click(`div[id="boundlist-1157-listEl"] li:nth-child(${id+1})`);
        await common.wait(100);
      }

      var kabs = await page.evaluate(() => {
        var rows = document.querySelectorAll('tbody[id="gridview-1116-body"] tr')
        var kabs = [];

        rows.forEach(row=>{
          var cols = row.querySelectorAll('div')
          var kab = cols[0].textContent
          var seats = Number(cols[2].textContent.trim())
          var type = cols[4].textContent.trim()
          var board = cols[8].textContent.trim()
          var projector = cols[9].textContent.trim() == '+'
          var tv = cols[10].textContent.trim() == '+'
          if(seats > 0 && type.split('\\')[0].trim() == "Учебное")
            kabs.push({kab, seats, board, projector, tv, type: type.split('\\')[2].trim()})
        });

        return kabs;
      }, {});

      var name = corps[id];
      corplist.push({name, kabs});

      if ( id > 0 ) {
        await page.click('input[id="O247_id-inputEl"]');
        await page.waitForSelector('div[id="boundlist-1157-listEl"]');
        await common.wait(100);
      }

      id++;
    }

    fs.writeFileSync('lib/kabinfo.json', JSON.stringify(corplist));
    await browser.close();
  })()