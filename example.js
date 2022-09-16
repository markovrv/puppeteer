const puppeteer = require('puppeteer');

(async () => {
//   Открываем браузер
  const browser = await puppeteer.launch({ headless: true});
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
  await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, "usr11935");
  await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, "Vyatsu20222");
  await page.click('a[id="O64_id"]');
// Ждем загрузки меню
  await page.waitForSelector('label[id="OA3_id"]');
//   Выбираем раздел Журнал
  await page.click('td[id="O19_id-inputCell"]');
  await page.click('li[class="x-boundlist-item"]:last-child');
//   Ждем загрузки журнала
  await page.waitForSelector('table[id="gridview-1015-table"]');

//   Парсим таблицу нагрузки
  const itemList = await page.evaluate(() => {
// Получаем id работ по типам нагрузки (ищем первые элементы каждого типа)
    let catList = [];
    let categories = Array.from(document.querySelectorAll(`td[class="x-group-hd-container"]`));
    categories.forEach(category => {
        catList.push({firstId: Number(category.parentNode.getAttribute("data-recordid"))});
    });
// Получаем список работ, сгруппированый по типам нагрузки
    let arr = [];
    let countItems = Array.from(document.querySelectorAll('tr[id^="gridview-1015-record-"]')).length;
    let cat = 0;
    for (let i = 0; i < countItems - 1; i++) {
        let item = Array.from(document.querySelectorAll(`tr[id="gridview-1015-record-${i}"] div`));
        let name = item[3].textContent;
        let groups = item[4].textContent.replace('В потоке ', '');
        let newCat = catList.findIndex(cat => (cat.firstId == i));
        cat = (newCat > -1)?newCat:cat;
        arr.push({name, groups, cat});
    }
// Возвращаем список для проверки
    return arr;
  });

  let getWorkId = (name, groups, cat) => (itemList.findIndex(item=>(item.name == name && item.groups == groups && item.cat == cat)));

// Выводим результат в консоль терминала
  console.log(getWorkId("Управление жизненным циклом информационных систем","БИб-3601-01-64",4));
  
// Скриншотим для отчета
  await page.screenshot({path: 'iss.png'});
// Закрываем браузер
  await browser.close();

})();