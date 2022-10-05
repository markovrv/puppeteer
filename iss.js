const puppeteer = require('puppeteer');
const express = require('express');
const Pusher = require("pusher");
const axios = require('axios');
const { performance } = require('perf_hooks');

const r_pass_base64 = "lKUuv4KJzhjuy12R1upaNVoi9QbRIUQ7pL8QhEIiwIfPI9U+l/N+qkt8eJr1KUk6ai0awWqUCJMMealbdwlMfH2+MBCmWVbnTmPZ/mCkJvK6gtZSzM4ZBKvJ5hVS1LCJ0MfQ7f/3Y24+BrFfLnjfh9LdWKUvoZC8mpl7XXFAVTo=";
const node_cryptojs = require('node-cryptojs-aes');
const CryptoJS = node_cryptojs.CryptoJS;
const JsonFormatter = node_cryptojs.JsonFormatter;

function decrypt(encrypted_json_str) {
  var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });
  return CryptoJS.enc.Utf8.stringify(decrypted);
}

const app = express();
const jsonParser = express.json();
const times = ["8:20:00", "10:00:00", "11:45:00", "14:00:00", "15:45:00", "17:20:00", "18:55:00"];
const debug = process.argv[2] == 'debug';
const pusherLog = true;
const pusher = new Pusher({
  appId: "1481587",
  key: "499bb8d44438cabb3eab",
  secret: "779dde48e446dec2664f",
  cluster: "eu",
  useTLS: true
});

app.use(express.static('vue/dist'));

app.use(function(req, res, next) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With, content-type');
  next();
});

app.post('/api/iss', jsonParser, (req, res) => {
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
        }).catch(e=>console.log(e))
      })
    }
    // функция проверки корректности карточки
    function checkCard(work) {
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
    function inputTime(time) {
      return new Promise((resolve, reject) => {
        page.click(`input[tabindex="139"]`).then(()=>{
          page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id).then(id=>{
            page.click(`div[id="${id}"] li:nth-child(${time})`).then(()=>resolve());
          })
        });
      })
    }
    // функция заполняет поле Кабинет
    function inputKab(kab){
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
    function inputTab(tab, text) {
      return new Promise((resolve, reject) => {
        page.evaluate(val => document.querySelector(`input[tabindex="${val.tab}"]`).value = val.text, {tab, text}).then(()=>{resolve()})
      })
    }
    // парсер таблицы работ
    function parseWorks(work){
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
            if(data.name == name && data.groups == groups && data.cat == cat) {
              if(percent < 100) return i;
              // Если нашлось совпадение, но нагрузка по строке уже заполнена
              overloaded = true;
            }
          }
          // В случае, если соответствий нет, выводим -1, нагрузка заполнена -2
          if(overloaded) return -2;
          return -1;
        }, {name: work.name, groups: work.groups, cat: work.cat}).then(id=>resolve(id))
      })
    }

    if (debug) {
      console.log('===================================');
      console.log('');
      console.log("Активация")
      var startTime = performance.now()
      var added = 0;
    }
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Активация", 
        color: "white",
        time: new Date()
      });
    }

    var browser
    //   Открываем браузер
    if(process.argv[2] == 'server') {
      browser = await puppeteer.launch({args: ['--no-sandbox']});
    } else {
      browser = await puppeteer.launch({ headless: !debug});
    }

    if (debug) console.log("Загрузка страницы")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Загрузка приложения", 
        color: "white",
        time: new Date()
      });
    }

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

    // Строка ответа сервера
    var ansStr = '';

    // прослушиваем запросы, отлавливаем лог
    var respListen = false
    var writeOnListen = false
    var btnClickListen = false

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
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Получен лог...",
              color: "white",
              time: new Date()
            });
          }
          respListen=false;
        }
      }
      if(writeOnListen){
        var postData=request.postData()
        if ( postData && postData.indexOf("IsEvent=1") > 0 && postData.indexOf("Evt=activate") > 0 ) {
          if (debug) console.log("Запрос разрешения на запись...")
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Запрос разрешения на запись...", 
              color: "cornflowerblue",
              time: new Date()
            });
          }
          while (! request.response()) {
            await new Promise(r => setTimeout(r, 50));
          }
          var text = await request.response().text()
          if (debug) console.log("Получен статус:")
          if (debug) console.log(text)
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Разрешение получено.", 
              color: "lawngreen",
              time: new Date()
            });
          }
          writeOnListen=false;
        }
      }
      if(btnClickListen){
        var postData=request.postData()
        if ( postData && postData.indexOf("IsEvent=1") > 0 && postData.indexOf("Evt=click") > 0 ) {
          if (debug) console.log("Попытка сохранить данные...")
          if (pusherLog) {
            pusher.trigger(auth.login, "my-event", {
              message: "Отправка данных ...",
              color:  "white",
              time: new Date()
            });
          }
          while (! request.response()) {
            await new Promise(r => setTimeout(r, 50));
          }
          var text = await request.response().text()
          if (debug) console.log("Получен ответ: ", (text.indexOf("Error") > 0)?'Ошибка':'ОК')
          if (pusherLog) {
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

    if (debug) console.log("Авторизация")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Авторизация", 
        color: "white",
        time: new Date()
      });
    }

    //   Авторизуемся
    await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, auth.login);
    await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, decrypt(auth.passwordAES));
    await page.click('a[id="O64_id"]');

    if (debug) console.log("Загрузка меню")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Загрузка меню", 
        color:  "white",
        time: new Date()
      });
    }

    // Ждем загрузки меню
    await page.waitForSelector('label[id="OA3_id"]');

    if (debug) console.log("Загрузка журнала")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Загрузка журнала",
        color: "white",
        time: new Date()
      });
    }

    //   Выбираем раздел Журнал
    await page.click('td[id="O19_id-inputCell"]');
    await page.click('li[class="x-boundlist-item"]:last-child');
    //   Ждем загрузки журнала
    await page.waitForSelector('table[id="gridview-1015-table"]');
    await new Promise(r => setTimeout(r, 400));

    if (debug) console.log("Журнал загружен")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Журнал загружен",
        color:  "white",
        time: new Date()
      });
    }

    // номер текущей работы в задании
    var w = 0 

    // счетчик ошибок для повторения запроса
    var errTimer = 0 

    // Перебираем список работ в задании
    while( w < input.length ){

      if (debug) console.log("РАБОТА  ", w+1, " ИЗ ", input.length)
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "РАБОТА  " + (w+1) + " ИЗ " + input.length, 
          color: "white",
          time: new Date()
        });
      }

      //   Ищем id нужной работы
      const itemIndex = await parseWorks(input[w])

      if (debug) console.log("Найден ID: ", itemIndex)
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Найден ID: " + itemIndex, 
          color: "white",
          time: new Date()
        });
      }

      //   Обработка исключений
      if ( itemIndex == -1 ) {
        message.push({id: input[w].id, status: 'Нагрузка не найдена', color:"red"});

        if (debug) console.log('Нагрузка не найдена');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Нагрузка не найдена", 
            color: "red",
            time: new Date()
          });
        }

        w++;
        continue;
      }
      if ( itemIndex == -2 ) {
        message.push({id: input[w].id, status: 'Нагрузка заполнена', color:"red"});
        if (debug) console.log('Нагрузка заполнена');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Нагрузка заполнена",
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
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Проверка лога нагрузки...", 
          color: "cornflowerblue",
          time: new Date()
        });
      }

      await new Promise(r => setTimeout(r, 200));

      // Проверяем лог предмета
      while(respListen) await new Promise(r => setTimeout(r, 100));

      if(checkLog(lastLog, input[w])){
        message.push({id: input[w].id, status: 'Нагрузка уже в журнале', color: "blue", log: lastLog.rows});
        if (debug) console.log('   Работа есть в логе, действие не требуется');
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Нагрузка уже в журнале", 
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
          message: "Нагрузка еще не записана", 
          color:  "yellow",
          time: new Date()
        });
      }

      // флаг "Отслеживать ответ на запрос включения режима записи"
      writeOnListen = true; 

      //   Открываем форму добавления работы
      await pressButton("Добавить");

      if (debug) console.log('Нажимаем Добавить');
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Добавляем", 
          color: "white",
          time: new Date()
        });
      }

      //   Ждем загрузки формы
      await page.waitForSelector('input[tabindex="142"]');

      if (debug) console.log('Форма открыта, проверяем корректность...');
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Проверка корректности данных формы",
          color: "cornflowerblue",
          time: new Date()
        });
      }

      // если в форме отобразились неверные данные
      if(!await checkCard(input[w])){
        if (debug) console.log('   Данные некорректны, отменяем');
        if (debug) console.log('   Данные', input[w]);
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Данные некорректны, отменяем",
            color:  "red",
            time: new Date()
          });
        }
        await pressButton("Отменить")
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
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Данные корректны, заполняем текстовые поля", 
          color: "lawngreen",
          time: new Date()
        });
      }

      //   Заполняем форму
      await inputTab('142', input[w].date)
      if(input[w].cat <= 2) await inputTab('141', input[w].count)
      else await pressButton("Закрыть")
      await inputTime(input[w].time)
      await inputKab(input[w].kab)

      // ждем включения режима записи
      while(writeOnListen) await new Promise(r => setTimeout(r, 50));

      if (debug) {
        console.log('Запись формы разрешена, сохраняем');
      }
      if (pusherLog) {
        pusher.trigger(auth.login, "my-event", {
          message: "Сохранение разрешено...", 
          color: "lawngreen",
          time: new Date()
        });
      }

      // Флаг Отслеживать ответ на событие - клик
      btnClickListen = true;

      // Клик по кнопке Сохранить
      await pressButton("Сохранить")

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
        await pressButton("Отменить")

      // если ошибки в ответе нет
      } else {
        message.push({id: input[w].id, status: 'Нагрузка добавлена', color: "green"})
        await new Promise(r => setTimeout(r, 500));
        if (debug) {
          console.log('Нагрузка добавлена');
          added++;
        }
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Добавлено",
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
    if (!debug) browser.close()

    if (debug) {
      console.log('Браузер закрыт');
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
  (async (data) => {

    function pressButton(name) {
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

    function inputId(id, text) {
        return new Promise((resolve, reject) => {
          page.evaluate(val => document.querySelector(`input[id="${val.id}"]`).value = val.text, {id, text}).then(()=>{resolve()})
        })
    }

    var browser
    //   Открываем браузер
    if(process.argv[2] == 'server') {
      browser = await puppeteer.launch({args: ['--no-sandbox']});
    } else {
      browser = await puppeteer.launch({ headless: !debug});
    }

    const page = await browser.newPage();
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

   await page.goto('https://new.vyatsu.ru/account/'); // , { waitUntil: 'networkidle2' }

   await page.waitForSelector('div[class="chat-button bell"]');

    await page.click('div[class="chat-button bell"]');
    await new Promise(r => setTimeout(r, 550));
    await pressButton("Студент/Сотрудник")
    await new Promise(r => setTimeout(r, 550));
    await pressButton("Общее расписание")
    await new Promise(r => setTimeout(r, 550));
    await inputId("input-question", data.group)
    await new Promise(r => setTimeout(r, 550));
    await page.click('div[type="submit"]');
    await new Promise(r => setTimeout(r, 550));
    await pressButton("На любой день")
    await new Promise(r => setTimeout(r, 550));
    var buttonsList = await getButtonsList()
    var buttonId = buttonsList.findIndex(elem => elem.indexOf(data.date)>-1)
    if( buttonId > -1 ) {
      await pressButton(buttonsList[buttonId])
      await new Promise(r => setTimeout(r, 550));
      var rasp = await page.evaluate(() => {
          var items = document.querySelectorAll('div[class="chat-message-answer"]');
          return items[items.length - 1].innerHTML
      })
    } else rasp = `➡ ${data.group}<br>Расписание на дату ${data.date} недоступно`
    buttonsList.pop();
    var dates = buttonsList.sort((a, b) => ((Number(a.slice(3,5)) > Number(b.slice(3,5)) || Number(a.slice(3,5)) == Number(b.slice(3,5)) && Number(a.slice(0,2)) > Number(b.slice(0,2)))?1:-1))
    res.send({rasp, dates, group: data.group})
    browser.close()
   
  })({group: req.body.group, date: req.body.date});
})

app.post('/api/encrypt', jsonParser, (req, res) => {
  var message = req.body.text;
  var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });
  var encrypted_json_str = encrypted.toString();
  res.send(encrypted_json_str);
})

app.post('/api/rasp', jsonParser, (req, res) => {
  var login = req.body.login;
  var passwordAES = req.body.passwordAES;
  var password = decrypt(passwordAES)

  axios.post('https://e.markovrv.ru/api/v2/', {
    login: login,
    password: password,
  })
    .then(response => {
      res.send(response.data)
    })
})

app.listen(3333)