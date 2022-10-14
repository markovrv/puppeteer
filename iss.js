const puppeteer = require('puppeteer');
const express = require('express');
const Pusher = require("pusher");
const axios = require('axios');
const { performance } = require('perf_hooks');
const { Datastore } = require("nedb-async-await");
const node_cryptojs = require('node-cryptojs-aes');
const CryptoJS = node_cryptojs.CryptoJS;
const JsonFormatter = node_cryptojs.JsonFormatter;

// Соединение с базой данных
const users = Datastore({filename:  'db/users', autoload: true});
const changes = Datastore({filename:  'db/changes', autoload: true});

// Параметры запуска: Перед выгрузкой на сервер заменить строку на public
const app_env = 'local';
// const app_env = 'public';
const debug = process.argv[2] == 'debug';
const pusherLog = true;
const r_pass_base64 = "lKUuv4KJzhjuy12R1upaNVoi9QbRIUQ7pL8QhEIiwIfPI9U+l/N+qkt8eJr1KUk6ai0awWqUCJMMealbdwlMfH2+MBCmWVbnTmPZ/mCkJvK6gtZSzM4ZBKvJ5hVS1LCJ0MfQ7f/3Y24+BrFfLnjfh9LdWKUvoZC8mpl7XXFAVTo=";


function decrypt(encrypted_json_str) {
  var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });
  return CryptoJS.enc.Utf8.stringify(decrypted);
}

String.prototype.MD5 = function() {
  var d = this;
  function M(d) {
    for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++) _ = d.charCodeAt(r), f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _);
    return f
  }
  function X(d) {
    for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++) _[m] = 0;
    for (m = 0; m < 8 * d.length; m += 8) _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32;
    return _
  }
  function V(d) {
    for (var _ = "", m = 0; m < 32 * d.length; m += 8) _ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255);
    return _
  }
  function Y(d, _) {
    d[_ >> 5] |= 128 << _ % 32, d[14 + (_ + 64 >>> 9 << 4)] = _;
    for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) {
      var h = m,
        t = f,
        g = r,
        e = i;
      f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551), m = safe_add(m, h), f = safe_add(f, t), r = safe_add(r, g), i = safe_add(i, e)
    }
    return Array(m, f, r, i)
  }
  function md5_cmn(d, _, m, f, r, i) {
    return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m)
  }
  function md5_ff(d, _, m, f, r, i, n) {
    return md5_cmn(_ & m | ~_ & f, d, _, r, i, n)
  }
  function md5_gg(d, _, m, f, r, i, n) {
    return md5_cmn(_ & f | m & ~f, d, _, r, i, n)
  }
  function md5_hh(d, _, m, f, r, i, n) {
    return md5_cmn(_ ^ m ^ f, d, _, r, i, n)
  }
  function md5_ii(d, _, m, f, r, i, n) {
    return md5_cmn(m ^ (_ | ~f), d, _, r, i, n)
  }
  function safe_add(d, _) {
    var m = (65535 & d) + (65535 & _);
    return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m
  }
  function bit_rol(d, _) {
    return d << _ | d >>> 32 - _
  }
	d = unescape(encodeURIComponent(d));
	var result = M(V(Y(X(d), 8 * d.length)));
	return result.toLowerCase();
}

String.prototype.dateformat = function() {
  var dat = this.split(' ')[1]
  var d = dat.slice(0, 2)
  var m = dat.slice(3, 5)
  var y = dat.slice(6)
  return `20${y}-${m}-${d}`
}

const app = express();
const jsonParser = express.json();
const times = ["8:20:00", "10:00:00", "11:45:00", "14:00:00", "15:45:00", "17:20:00", "18:55:00"];
const pusher = new Pusher({
  appId: "1481587",
  key: "499bb8d44438cabb3eab",
  secret: "779dde48e446dec2664f",
  cluster: "eu",
  useTLS: true
});

if(app_env == 'local') app.use(express.static('vue/dist'));
else app.use(express.static('app'));

var browsers = {} // по 1 браузеру для каждого пользователя. Каждый сервис - в своей вкладке

setInterval(() => {
  for (var userName in browsers) {
    if (Date.now() - browsers[userName].session > 1000 * 60 * 5) { // браузер закроется через 5 минут бездействия
      console.log(`Закрываем браузер пользователя ${userName} по таймауту запросов`)
      browsers[userName].browser.close()
      delete browsers[userName]
    }
  }
}, 1000 * 30); // проверка каждые 30 секунд

app.use(function(req, res, next) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With, content-type');
  next();
});

app.post('/api/iss', jsonParser, (req, res) => {
  (async (input, auth) => {
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
    // функция проверки корректности карточки
    function checkCard(page, work) {
      return new Promise((resolve, reject)=>{
        page.evaluate(data => {
          var items = document.querySelectorAll('div[class="x-panel-body x-panel-white x-panel-body-default x-abs-layout-ct x-panel-body-default x-docked-noborder-top x-docked-noborder-right x-docked-noborder-bottom x-docked-noborder-left"] li')
          var cat = -1
          
          if      (items[0].textContent.trim() == "Занятия: Чтение лекций") { cat = 0; } 
          else if (items[0].textContent.trim() == "Занятия: Проведение практических занятий, семинаров"){ cat = 1; } 
          else if (items[0].textContent.trim() == "Занятия: Проведение лабораторных занятий (лабораторных практикумов)"){ cat = 2; }
          else if (items[0].textContent.trim() == "Занятия: Проведение консультаций по дисциплине"){ cat = 9; }
          else if (items[0].textContent.trim() == "Занятия: Прием экзаменов по дисциплине"){ cat = 10; }
          else if (items[0].textContent.trim() == "Занятия: Прием зачетов по дисциплине"){ cat = 11; }

          var name = items[2].textContent.replace("Дисциплина: ", "")
          var groups = items[3].textContent.replace("Группа: ", "").replace('В потоке ', '')

          return data.name == name && data.groups == groups && data.cat == cat
  
        }, work).then(checked => {resolve(checked)})
      });
    }
    // функция заполняет поле Время
    function inputTime(page, time) {
      return new Promise((resolve, reject) => {
        page.click(`input[tabindex="139"]`).then(()=>{
          page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id).then(id=>{
            page.click(`div[id="${id}"] li:nth-child(${time})`).then(()=>resolve());
          })
        });
      })
    }
    // функция заполняет поле Кабинет
    function inputKab(page, kab){
      return new Promise((resolve, reject)=>{
        // Ищем поле Кабинет
        page.click(`input[tabindex="143"]`).then(()=>{
          page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[2].id)
            .then(KabListId=>{
              //   Парсим кабинеты
              // Если дистант
              if( kab.length > 10 ) {
                page.click(`div[id="${KabListId}"] li:nth-child(1)`).then(()=>{
                  page.click(`input[tabindex="144"]`).then(()=>{
                    page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[3].id)
                      .then(WorkFormListId=>{
                        page.click(`div[id="${WorkFormListId}"] li:nth-child(1)`).then(()=>{
                          page.evaluate(val => document.querySelector('input[tabindex="145"]').value = val, kab)
                            .then(()=>{resolve()})
                        })
                      })
                  })
                })
              } else {
                  // иначе ищем кабинет в списке
                  page.evaluate((data) => {
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
                  }, {kab: kab, KabListId}).then(kabIndex=>{
                    // Выбираем нужный кабинет
                    page.click(`div[id="${KabListId}"] li:nth-child(${kabIndex + 1})`)
                      .then(()=>{resolve()})
                  });
                }
            })
        })
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
    function inputTab(page, tab, text) {
      return new Promise((resolve, reject) => {
        page.evaluate(val => document.querySelector(`input[tabindex="${val.tab}"]`).value = val.text, {tab, text}).then(()=>{resolve()})
      })
    }
    // парсер таблицы работ
    function parseWorks(page, work){
      return new Promise((resolve, reject)=>{
        page.evaluate((data) => {
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
            if(data.name == name.trim() && data.groups == groups && data.cat == cat) {
              if(percent < 100) return i;
              // Если нашлось совпадение, но нагрузка по строке уже заполнена
              overloaded = true;
            }
          }
          // В случае, если соответствий нет, выводим -1, нагрузка заполнена -2
          if(overloaded) return -2;
          return -1;
        }, {name: work.name.trim(), groups: work.groups, cat: work.cat}).then(id=>resolve(id))
      })
    }

    var browser
    var page
    // Сообщение для возврата клиенту
    var message = [];
    // Массив логов журнала
    var lastLog = [];
    // Строка ответа сервера
    var ansStr = '';
    // прослушиваем запросы, отлавливаем лог
    var respListen = false
    var writeOnListen = false
    var btnClickListen = false
    // номер текущей работы в задании
    var w = 0 
    // счетчик ошибок для повторения запроса
    var errTimer = 0 

    if (debug) {
      var startTime = performance.now()
      var added = 0;
    }

    if (browsers[auth.login] && browsers[auth.login].browser) {
      browser = browsers[auth.login].browser
      browsers[auth.login].session = Date.now()
    } else {

      if (debug) {
        console.log('===================================');
        console.log('');
        console.log("Активация")
      }
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Активация", 
          color: "white",
          time: new Date()
        });
      }

      //   Открываем браузер
      if(app_env == 'public')  {
        browser = await puppeteer.launch({args: ['--no-sandbox']});
      } else {
        browser = await puppeteer.launch({ headless: !debug});
      }
    }

    if(browsers[auth.login] && browsers[auth.login].issPage){
      page = browsers[auth.login].issPage
    } else {

      if (debug) console.log("Загрузка страницы")

      //   Новая страница
      page = await browser.newPage();
      await page.setViewport({
        width: 1040,
        height: 720,
        deviceScaleFactor: 1,
      });

      //   Загружаем сайт
      await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });

      if (debug) console.log("Авторизация")

      //   Авторизуемся
      await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, auth.login);
      await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, decrypt(auth.passwordAES));
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

      if (debug) console.log("Журнал загружен")
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Журнал загружен",
          color:  "white",
          time: new Date()
        });
      }

      await new Promise(r => setTimeout(r, 2000));

    }

    page.on('request',async(request)=>{
      if(respListen){
        var url=request.url()
        if ( url.indexOf("IsEvent=1") > 0 && url.indexOf("options=1") > 0 ) {
          if (debug) console.log("Запрос лога...")
          while (! request.response()) {
            await new Promise(r => setTimeout(r, 50));
          }
          var text = await request.response().text()
          eval('lastLog = ' + text);
          if (debug) {
            console.log("Получен лог:")
            if(lastLog.rows) {
              lastLog.rows.forEach(row => {
                console.log("   - ", row['0'])
              });
            } else console.log("   незнакомый формат лога")
          }
          respListen=false;
        }
      }
      if(writeOnListen){
        var postData=request.postData()
        if ( postData && postData.indexOf("IsEvent=1") > 0 && postData.indexOf("Evt=activate") > 0 ) {
          if (debug) console.log("Запрос разрешения на запись...")
          while (! request.response()) {
            await new Promise(r => setTimeout(r, 50));
          }
          var text = await request.response().text()
          if (debug) console.log("Получен статус:")
          if (debug) console.log(text)
          writeOnListen=false;
        }
      }
      if(btnClickListen){
        var postData=request.postData()
        if ( postData && postData.indexOf("IsEvent=1") > 0 && postData.indexOf("Evt=click") > 0 ) {
          if (debug) console.log("Попытка сохранить данные...")
          while (! request.response()) {
            await new Promise(r => setTimeout(r, 50));
          }
          var text = await request.response().text()
          if (debug) console.log("Получен ответ: ", (text.indexOf("Error") > 0)?'Ошибка':'ОК')
          if (pusherLog && text.indexOf("Error") > 0) {
            pusher.trigger(auth.login, "my-event", {
              message: "Получен ответ: " + ((text.indexOf("Error") > 0)?'Ошибка':'ОК'), 
              color:  ((text.indexOf("Error") > 0)?'red':'lawngreen'),
              time: new Date()
            });
          }
          btnClickListen=false;
          ansStr = text;
        }
      }
    }) 

    // Перебираем список работ в задании
    while( w < input.length ){

      if (debug) console.log("Занятие  ", w+1, " из ", input.length)
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Занятие  " + (w+1) + "  из " + input.length, 
          color: "white",
          time: new Date()
        });
      }

      //   Ищем id нужной работы
      const itemIndex = await parseWorks(page, input[w])

      if (debug) console.log("Найден ID: ", itemIndex)

      //   Обработка исключений
      if ( itemIndex == -1 ) {
        message.push({id: input[w].id, status: 'Дисциплина не найдена в нагрузке', color:"red"});

        if (debug) console.log('Нагрузка не найдена');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Дисциплина не найдена в нагрузке", 
            color: "red",
            time: new Date()
          });
        }

        w++;
        continue;
      }
      if ( itemIndex == -2 ) {
        message.push({id: input[w].id, status: 'Нагрузка по дисциплине заполнена на 100%', color:"red"});
        if (debug) console.log('Нагрузка заполнена');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Нагрузка по дисциплине заполнена на 100%",
            color:  "red",
            time: new Date()
          });
        }
        w++;
        continue;
      }

      // включаем захват логов с сервера
      lastLog = [];
      respListen = true;

      // Клик по найденной работе
      await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`,{delay:50});

      if (debug) {
        console.log("Выбрали работу № ", itemIndex);
        console.log('Проверяем лог работы...');
      }

      await new Promise(r => setTimeout(r, 200));

      // Ждем загрузки лога предмета
      var timer = 0;
      while(respListen && timer < 10) {
        await new Promise(r => setTimeout(r, 100));
        timer++;
      }
      if(timer >= 10) continue;


      // Проверяем лог предмета
      if(checkLog(lastLog, input[w])){
        message.push({id: input[w].id, status: 'Занятие уже записано', color: "blue", log: lastLog.rows});
        if (debug) console.log('   Работа есть в логе, действие не требуется');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Занятие уже записано", 
            color: "yellow",
            time: new Date()
          });
        }
        w++
        continue;
      }

      if (debug) console.log('   Работа в логе не найдена');
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Занятие еще не записано", 
          color:  "yellow",
          time: new Date()
        });
      }

      // флаг "Отслеживать ответ на запрос включения режима записи"
      writeOnListen = true; 

      //   Открываем форму добавления работы
      await pressButton(page, "Добавить");

      if (debug) console.log('Нажимаем Добавить');

      //   Ждем загрузки формы
      await page.waitForSelector('input[tabindex="142"]');

      if (debug) console.log('Форма открыта, проверяем корректность...');

      // если в форме отобразились неверные данные
      if(!await checkCard(page, input[w])){
        if (debug) console.log('   Данные некорректны, отменяем');
        if (debug) console.log('   Данные', input[w]);
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Данные заполнены некорректно, отменяем",
            color:  "red",
            time: new Date()
          });
        }
        await pressButton(page, "Отменить")
        if (errTimer > 5) {
          message.push({id:input[w].id,status:'Внутренняя ошибка сервиса',color:"red"});
          if (debug) console.log('   Внутренняя ошибка сервиса');
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Внутренняя ошибка сервиса", 
              color:  "red",
              time: new Date()
            });
          }
          w++;
          errTimer = 0;
        }
        else errTimer++;
        continue;
      } else errTimer = 0

      if (debug) console.log('   Данные корректны, заполняем форму');

      //   Заполняем форму
      await inputTab(page, '142', input[w].date)
      if(input[w].cat <= 2) await inputTab(page, '141', input[w].count)
      else await pressButton(page, "Закрыть")
      await inputTime(page, input[w].time)
      await inputKab(page, input[w].kab)

      // ждем включения режима записи
      while(writeOnListen) await new Promise(r => setTimeout(r, 50));

      if (debug) console.log('Запись формы разрешена, сохраняем');

      // Флаг Отслеживать ответ на событие - клик
      btnClickListen = true;

      // Клик по кнопке Сохранить
      await pressButton(page, "Сохранить")

      // ждем ответа сервера
      while(btnClickListen) await new Promise(r => setTimeout(r, 50)) 

      // Обрабатываем ответ сервера
      if (ansStr.indexOf("Error") > 0) {
        // Формируем сообщение об ошибке
        var mess = ansStr.split('Msg.show({title:"Error",msg:"')[1].split('",icon:Ext.Msg.ERROR')[0]
        message.push({id: input[w].id, status: mess, color: "red"})
        if (debug) console.log(mess)
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: mess,
            color: "red",
            time: new Date()
          });
        }
        // Закрываем всплывающие окна
        await page.keyboard.press('Escape')
        await pressButton(page, "Отменить")

      // если ошибки в ответе нет
      } else {
        message.push({id: input[w].id, status: 'Занятие добавлено', color: "green"})
        await new Promise(r => setTimeout(r, 700));
        if (debug) {
          console.log('Нагрузка добавлена');
          added++;
        }
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Занятие добавлено",
            color: "lawngreen",
            time: new Date(),
          });
        }
      }

      // к следующей работе
      w++
    }

    if (debug) console.log('Задания обработаны');
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Конец обработки", 
        color: "white",
        time: new Date()
      });
    }

  // Закрываем браузер и возвращаем ответ
    res.send(message)

    // if (!debug) browser.close()

    // запоминаем для дальнейшего использования
    if(browsers[auth.login] && browsers[auth.login].browser) {
      browsers[auth.login].issPage = page
      browsers[auth.login].session = Date.now()
    } else {
      browsers[auth.login] = {browser, issPage: page, session: Date.now()}
    }

    if (debug) {
      console.log('Браузер будет закрыт по таймеру');
      console.log("");
      console.log('===================================');
      var endTime = performance.now()
      console.log(`Скрипт работал ${((endTime - startTime)/1000).toFixed(1)}s`)
      console.log(`Обработано ${input.length} записей`)
      console.log(`Из них добавлено ${added} записей`)
    }

  })(req.body.data, req.body.auth)
})

app.post('/api/stud', jsonParser, (req, res) => {
  (async (data, auth) => {

    function pressButton(page, name) {
      return new Promise((resolve, reject) => {
        page.evaluate((text) => {
          var elems = document.querySelectorAll("button");
          var res = Array.from(elems).find(v => v.textContent == text);
          var id = `mybtn_${(new Date()).getTime()}`
          res.setAttribute("id", id)
          return id;
        }, name).then(id => {
          page.click(`button[id="${id}"]`).then(()=>resolve());
        }).catch(e=>console.log(e))
      })
    }

    function getButtonsList() {
      return new Promise((resolve, reject) => {
        page.evaluate(() => {
          var elems = document.querySelectorAll('div[class="flexsearch--buttons-panel"] button');
          var names = [];
          Array.from(elems).forEach(btn => {
            names.push(btn.textContent)
          })
          return names;
        }).then(resolve)
        .catch(reject);
      })
    }

    function inputId(page, id, text) {
        return new Promise((resolve, reject) => {
          page.evaluate(val => document.querySelector(`input[id="${val.id}"]`).value = val.text, {id, text}).then(()=>{resolve()})
        })
    }
    var browser
    var page

    var multiday = false
    var rasplist = []
    var i = 0;
    var count = data.groups.length

    if (browsers[auth.login] && browsers[auth.login].browser) {
      browser = browsers[auth.login].browser
      browsers[auth.login].session = Date.now()
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
    if(browsers[auth.login] && browsers[auth.login].lkPage){
      page = browsers[auth.login].lkPage
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
      await pressButton(page, "Студент/Сотрудник")
      await new Promise(r => setTimeout(r, 550));
      await pressButton(page, "Общее расписание")
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
      await inputId(page, "input-question", group)
      await new Promise(r => setTimeout(r, 550));
      await page.click('div[type="submit"]');
      await new Promise(r => setTimeout(r, 550));
      if(!multiday){
        await pressButton(page, "На любой день")
        await new Promise(r => setTimeout(r, 550));
      }
      var buttonsList = await getButtonsList()
      var buttonId = buttonsList.findIndex(elem => elem.indexOf(data.date)>-1)
      if( buttonId > -1 ) {
        await pressButton(page, buttonsList[buttonId])
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

      var content = []
      var days = rasp.split('—| ')
      if (days.length > 1) {
        days.shift()
        days.forEach(day=>{
          var lessons = day.split('<br>——/ ')
          var date = lessons.shift()
          date = ('_ ' + date.split(' | ')[1]?.slice(0, -4)).dateformat()
          var lsns = []
          lessons.forEach(lesson=>{
            var parts = lesson.split(' /——<br>')
            var time = parts.shift()
            var aparts = parts[0].split('<br>')
            if(aparts[0].indexOf('подгруппа')>0){
              if (subgr == 0) aparts.shift()
              else {
                var first = aparts.indexOf(subgr + ' подгруппа')
                aparts.splice(0, first+1)
              }
            }
            if (aparts.length >=4) lsns.push({time, kab: aparts[3]})
          })
          content.push({date, lessons: lsns})
        })
      }

      if (content.length > 0) rasplist.push({group, content})
      else {
        buttonsList.pop();
        var dates = buttonsList.sort((a, b) => ((Number(a.slice(3,5)) > Number(b.slice(3,5)) || Number(a.slice(3,5)) == Number(b.slice(3,5)) && Number(a.slice(0,2)) > Number(b.slice(0,2)))?1:-1))
        rasplist.push({rasp, dates, group})
      }

      await new Promise(r => setTimeout(r, 550));
      i++
    }// конец цикла
    
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Пожалуйста, подождите..."
      });
    }

    res.send(rasplist)
    // if(!debug) browser.close()

    // запоминаем для дальнейшего использования
    if(browsers[auth.login] && browsers[auth.login].browser) {
      browsers[auth.login].lkPage = page
      browsers[auth.login].session = Date.now()
    } else {
      browsers[auth.login] = {browser, lkPage: page, session: Date.now()}
    }
   
  })({groups: req.body.groups, date: req.body.date}, req.body.auth);
})

app.post('/api/login', jsonParser, (req, res) => {
  (async()=>{
    var login = req.body.login;
    var message = req.body.text;
    var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });
    var encrypted_json_str = encrypted.toString();
    var apikey = encrypted_json_str.MD5();
    var date = new Date();
    await users.insert({login, apikey, date})
    res.send({encrypted_json_str});
  })()
})

app.post('/api/logout', jsonParser, (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    await users.remove({login, apikey}, {})
    res.send({status: 'OK'});
  })()
})

app.post('/api/rasp', jsonParser, (req, res) => {
   (async()=>{
    var login    = req.body.login;
    var password = decrypt(req.body.passwordAES);
    var response = await axios.post('https://e.markovrv.ru/api/v2/', { login, password });
    var rasp = response.data
    var i = 0;
    while (i < rasp.length) {
      rasp[i].day = rasp[i].day.dateformat()
      var day = rasp[i].day
      var j = 0
      while (j < rasp[i].lessons.length) {
        var time = rasp[i].lessons[j].time
        var doc = await changes.findOne({ login, day, time })
        if (doc) rasp[i].lessons[j] = doc.lesson 
        j++
      }
      i++
    }
    res.send(rasp) 
  })();
})

app.post('/api/changekab/cancel', jsonParser, (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await users.find({login, apikey})
    if (docs.length > 0){
      var day  = req.body.day;
      var time = req.body.lesson.time
      var type = 0 // удаляем только замены кабинетов
      await changes.remove({login, day, time, type}, {})
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

app.post('/api/copy/del', jsonParser, (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await users.find({login, apikey})
    if (docs.length > 0){
      var day  = req.body.day;
      var time = req.body.lesson.time
      var type = 1 // удаляем только скопированные
      await changes.remove({login, day, time, type}, {})
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

app.post('/api/changekab', jsonParser, (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await users.find({login, apikey})
    if (docs.length > 0){
      if(!req.body.lesson.copied) req.body.lesson.oldkab = req.body.lesson.kab
      req.body.lesson.kab = req.body.newkab
      var type   = 0; // замена кабинета без копирования
      if(req.body.lesson.copied) type = 1; // копирование занятия
      var day    = req.body.day;
      var time   = req.body.lesson.time;
      var lesson = req.body.lesson;
      var date   = new Date();
      var rec = await changes.findOne({login, day, time, lesson, date})
      if (rec){
        await changes.update({_id: rec._id}, {lesson}, {});
      } else {
        await changes.insert({login, type, day, time, lesson, date})
      }
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

app.listen(3333)