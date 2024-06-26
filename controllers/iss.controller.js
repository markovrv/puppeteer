const { performance } = require('perf_hooks');
const common = require("../lib/common")
const debug = common.debug;
const pusherLog = true;
const pusher = common.pusher
const browserlist = require('../lib/browserlist')
const db = require("../lib/db")

// справочник видов работ (возможно, перечислены не все)
var context = { 
  catlist: [
    {
        "firstId": -1,
        "catName": "Чтение лекций"
    },
    {
        "firstId": -1,
        "catName": "Проведение практических занятий, семинаров"
    },
    {
        "firstId": -1,
        "catName": "Проведение лабораторных занятий (лабораторных практикумов)"
    },
    {
        "firstId": -1,
        "catName": "Подготовка к лекциям"
    },
    {
        "firstId": -1,
        "catName": "Подготовка к практическим занятиям"
    },
    {
        "firstId": -1,
        "catName": "Подготовка к лабораторным занятиям"
    },
    {
        "firstId": -1,
        "catName": "Методическое обеспечение и методическая «поддержка» дисциплины"
    },
    {
        "firstId": -1,
        "catName": "Контроль самостоятельной работы обучающихся в рамках дисциплины"
    },
    {
        "firstId": -1,
        "catName": "Организация текущего контроля успеваемости обучающихся в рамках дисциплины"
    },
    {
        "firstId": -1,
        "catName": "Проведение консультаций по дисциплине"
    },
    {
        "firstId": -1,
        "catName": "Прием экзаменов по дисциплине"
    },
    {
        "firstId": -1,
        "catName": "Прием зачетов по дисциплине"
    }
  ]
};

// функция нажатия кнопки на странице
function pressButton(page, name) {
  return new Promise(resolve => {
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
  return new Promise(resolve => {
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

      return data.name == name && (data.groups == groups || typeof data.i !== 'undefined') && data.cat == cat

    }, work).then(resolve)
  });
}
// функция заполняет поле Время
function inputTime(page, time) {
  return new Promise(resolve => {
    page.click(`input[tabindex="139"]`).then(()=>{
      page.evaluate(() => document.querySelectorAll('div[class="x-boundlist x-boundlist-floating x-layer x-boundlist-default x-border-box"]')[1].id).then(id=>{
        page.click(`div[id="${id}"] li:nth-child(${time})`).then(()=>resolve());
      })
    });
  })
}
// функция заполняет поле Кабинет
function inputKab(page, kab){
  return new Promise(resolve => {
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
    var time = common.times.indexOf(item[0].split(' ')[1]) + 1;
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
// парсер таблицы работ для выбора работы
function parseWorks(page, work, context){
  return new Promise((resolve, reject)=>{
    page.evaluate((data, context) => {
      // Получаем id работ по типам нагрузки (ищем первые элементы каждого типа)
      if(!window.catlist) {
        window.catlist = context.catlist;
        let categories = Array.from(document.querySelectorAll(`td[class="x-group-hd-container"]`));
        categories.forEach(category => {
          var currentCat = window.catlist.find(cat=>(cat.firstId == -1 && cat.catName == category.querySelector('div').textContent.trim()));
          if (currentCat) currentCat.firstId = Number(category.parentNode.getAttribute("data-recordid"));
          else window.catlist.push({firstId: Number(category.parentNode.getAttribute("data-recordid")), catName: category.querySelector('div').textContent.trim()});

        });
      }
      // Получаем список работ, сгруппированый по типам нагрузки
      if(!window.countItems){
        window.countItems = Array.from(document.querySelectorAll('tr[id^="gridview-1015-record-"]')).length;
      }
      var cat = -1;
      var altGroups = [];
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
          if(percent < 100) return {n:i};
          // Если нашлось совпадение, но нагрузка по строке уже заполнена
          overloaded = true;
        } else if (data.name == name.trim() && data.groups != groups && data.cat == cat) {
          altGroups.push({groups, i});
        }
      }
      // В случае, если соответствий нет, выводим -1, нагрузка заполнена -2, не совпала группа -3
      if(overloaded) return {n:-2};
      if(altGroups.length > 0) return {n:-3, altGroups};
      return {n:-1};
    }, {name: work.name.trim(), groups: work.groups, cat: work.cat}, context).then(resolve)
  })
}
// парсер таблицы работ для вывода списка работ
function parseWorksToList(page, context){
  return new Promise((resolve, reject)=>{
    page.evaluate((context) => {
      // Получаем id работ по типам нагрузки (ищем первые элементы каждого типа)
      if(!window.catlist) {
        window.catlist = context.catlist;
        let categories = Array.from(document.querySelectorAll(`td[class="x-group-hd-container"]`));
        categories.forEach(category => {
          var currentCat = window.catlist.find(cat=>(cat.firstId == -1 && cat.catName == category.querySelector('div').textContent.trim()));
          if (currentCat) currentCat.firstId = Number(category.parentNode.getAttribute("data-recordid"));
          else window.catlist.push({firstId: Number(category.parentNode.getAttribute("data-recordid")), catName: category.querySelector('div').textContent.trim()});
        });
      }
      // Получаем список работ, сгруппированый по типам нагрузки
      if(!window.countItems){
        window.countItems = Array.from(document.querySelectorAll('tr[id^="gridview-1015-record-"]')).length;
      }
      var cat = -1;
      var workList = [];
      for (let i = 0; i < window.countItems; i++) {
        let item = Array.from(document.querySelectorAll(`tr[id="gridview-1015-record-${i}"] div`));
        let name = item[3].textContent;
        let groups = item[4].textContent.replace('В потоке ', '');
        let newCat = window.catlist.findIndex(c => (c.firstId == i));
        cat = (newCat > -1)?newCat:cat;
        var percent = -1;
        var info = '';
        if(item[5].firstElementChild != undefined && item[5].firstElementChild.firstElementChild != undefined){
          percent = Number(item[5].firstElementChild.firstElementChild.getAttribute("style").split('%')[0].split(':')[1]);
          info = item[5].firstElementChild.firstElementChild.firstElementChild.textContent;
        }
        if(percent >= 0 && info.split("/").length == 2)
          workList.push({id: i, name, cat, groups, percent, info})
      }
      return workList;
    }, context).then(resolve)
  })
}

module.exports.worklist = (req, res) => {
  (async (auth, context) => {
    if (debug) var startTime = performance.now()
    const workList = await parseWorksToList(req.page, context)
    if (debug) console.log("Список работ сформирован")
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Список работ сформирован", 
        color: "white",
        time: new Date()
      });
    } 

    res.send(workList)
    await db.isslog.insert({login: auth.login, semester: auth.semester, workList})

    if (debug) {
      console.log('Браузер будет закрыт по таймеру');
      console.log("");
      console.log('===================================');
      var endTime = performance.now()
      console.log(`Скрипт работал ${((endTime - startTime)/1000).toFixed(1)}s`)
      console.log(`Обработано ${workList.length} записей`)
    }

  })(req.body.auth, context)
}

module.exports.closeBrowser = (req, res) => {
  (async (userName) => {

    browserlist.closeBrowser(userName)

    res.send("Ok")

  })(req.body.username)
}

module.exports.lessons = (req, res) => {
  (async (input, auth) => {
    // Массив логов журнала
    var lastLog = [];
    // прослушиваем запросы, отлавливаем лог
    var respListen = false

    if (debug) {
      var startTime = performance.now()
    }

    var page = req.page

    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Начало обработки занятия №" + input.id, 
        color: "white",
        time: new Date()
      });
    }

    page.on('request',async(request)=>{
      if(respListen){
        var url=request.url()
        if ( url.indexOf("IsEvent=1") > 0 && url.indexOf("options=1") > 0 ) {
          if (debug) console.log("Запрос лога...")
          while (! request.response()) await common.wait(50);
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
    }) 
    
    // id нужной работы
    const itemIndex = input.id

    // включаем захват логов с сервера
    lastLog = {};
    respListen = true;

    // Клик по работе
    await page.click(`tr[id="gridview-1015-record-${itemIndex}"]`, {delay:50});

    if (debug) {
      console.log("Выбрали работу № ", itemIndex);
      console.log('Загружаем лог работы...');
    }

    await common.wait(200);

    // Ждем загрузки лога
    var timer = 0;
    while(respListen && timer < 10) {
      await common.wait(100);
      timer++;
    }

    if(timer >= 10 || !lastLog.rows) {
      res.send({ error: 'Ошибка загрузки списка занятий предмета №' + itemIndex });
    }

    res.send(lastLog.rows);

    if (debug) console.log('Задание обработано');
    if (pusherLog) {
      pusher.trigger(auth.login, "my-event", {
        message: "Конец обработки", 
        color: "white",
        time: new Date()
      });
    }

    if (debug) {
      console.log('Браузер будет закрыт по таймеру');
      console.log("");
      console.log('===================================');
      var endTime = performance.now()
      console.log(`Скрипт работал ${((endTime - startTime)/1000).toFixed(1)}s`)
    }

  })(req.body.data, req.body.auth)
}

// обработчик метки Добавлено в ИСС
module.exports.delIss = (req, res) => {
  (async () => {
      var id = req.body._id;
      // через АПИ только удаляем метку
      await db.lessons.updIss({in_iss: 0, id});
      res.send({status: "OK"});
  })()
}

// обработчик комментария к занятию
module.exports.setContent = (req, res) => {
  (async () => {
      var id = req.body._id;
      var content = req.body.content;
      // через АПИ меняем комментарий
      await db.lessons.updContent({content, id});
      res.send({status: "OK"});
  })()
}

module.exports.index = (req, res) => {
  (async (input, auth, context) => {
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

    var page = req.page

    page.on('request',async(request)=>{
      if(respListen){
        var url=request.url()
        if ( url.indexOf("IsEvent=1") > 0 && url.indexOf("options=1") > 0 ) {
          if (debug) console.log("Запрос лога...")
          while (! request.response()) await common.wait(50);
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
          while (! request.response()) await common.wait(50);
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
          while (! request.response()) await common.wait(50);
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
      if ( typeof input[w].i !== 'undefined' ) {
        var itemIndex = {n:input[w].i};
      } else {
        var itemIndex = await parseWorks(page, input[w], context);
      }

      if (debug) console.log("Найден ID: ", itemIndex.n)

      //   Обработка исключений
      if ( itemIndex.n == -1 ) {
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
      if ( itemIndex.n == -2 ) {
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
      if ( itemIndex.n == -3 ) {
        message.push({id: input[w].id, status: 'Требуется уточнить группу', color:"#9d9d11", variants: itemIndex.altGroups});
        if (debug) console.log('Требуется уточнить группу');
        if (debug) console.log(itemIndex.altGroups);
        if (pusherLog) {
          pusher.trigger(auth.login, "my-event", {
            message: "Требуется уточнить группу",
            color:  "#9d9d11",
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
      await page.click(`tr[id="gridview-1015-record-${itemIndex.n}"]`,{delay:50});

      if (debug) {
        console.log("Выбрали работу № ", itemIndex.n);
        console.log('Проверяем лог работы...');
      }

      await common.wait(200);

      // Ждем загрузки лога предмета
      var timer = 0;
      while(respListen && timer < 10) {
        await common.wait(100);
        timer++;
      }
      if(timer >= 10) continue;


      // Проверяем лог предмета
      if(checkLog(lastLog, input[w])){
        // Отметка в БД о добавлении занятия
        await db.lessons.updIss({in_iss: 1, id: input[w]._id});
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
      while(writeOnListen) await common.wait(50);

      if (debug) console.log('Запись формы разрешена, сохраняем');

      // Флаг Отслеживать ответ на событие - клик
      btnClickListen = true;

      // Клик по кнопке Сохранить
      await pressButton(page, "Сохранить")

      // ждем ответа сервера
      while(btnClickListen) await common.wait(50); 

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
        // Отметка в БД о добавлении занятия
        await db.lessons.updIss({in_iss: 1, id: input[w]._id});
        message.push({id: input[w].id, status: 'Занятие добавлено', color: "green"})
        await common.wait(700);
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

    // возвращаем ответ
    res.send(message)


    if (debug) {
      console.log('Браузер будет закрыт по таймеру');
      console.log("");
      console.log('===================================');
      var endTime = performance.now()
      console.log(`Скрипт работал ${((endTime - startTime)/1000).toFixed(1)}s`)
      console.log(`Обработано ${input.length} записей`)
      console.log(`Из них добавлено ${added} записей`)
    }

  })(req.body.data, req.body.auth, context)
}
