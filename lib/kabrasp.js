const axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const randomUseragent = require('random-useragent');
const proxy = require("./proxy")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const common = require("./common")
const config = require("../config")

// форматирование даты для сравнения
var dateFormat = (date) => {
  day = date[0] + date[1];
  month = date[2] + date[3];
  year = date[6] + date[7];
  return year + month + day;
}

// получение имени файла с расписанием
exports.getFilename = async ( kab, date, semester = 1 ) => {
  var corp = kab.split('-')[0];
  var day = dateFormat(date);
  if (config.proxy.enabled)
    var p = await proxy.current();
  var httpsAgent = (config.proxy.enabled)?new HttpsProxyAgent(p):null;
  var userAgent = randomUseragent.getRandom();
  return new Promise((resolve, reject) => {
      axios({
          method: 'get',
          url: 'https://www.vyatsu.ru/studentu-1/spravochnaya-informatsiya/zanyatost-auditoriy.html',
          timeout: 30000,
          httpsAgent,
          headers: {
                "User-Agent": userAgent
            }
      }).then(resp => {
          if (!resp.data) reject(-1)
          // вырезаем таблицу из страницы
          var table = new JSDOM(resp.data).window.document.querySelector("table");
          // вырезаем список корпусов
          var divCorpuses = table.querySelectorAll(`div[class=korpPeriod]`);
          var corps = [];
          divCorpuses.forEach(corp => {
            corps.push(corp.textContent.trim().split(' ')[2])
          });
          // вырезаем блок нужного корпуса
          var linksDiv = table.querySelector(`div[id=listPeriod_${corp}${semester}]`);
          // вырезаем ссылки
          var links = linksDiv.querySelectorAll('a');
          for (var i = 0; i < links.length; i+=2){
              var href = links[i].href.replace('/reports/schedule/room/','').replace('.html','')
              var arr = href.split('_')
              //ищем текущую неделю
              if (day >= dateFormat(arr[2]) && day <= dateFormat(arr[3])) resolve({url: `https://www.vyatsu.ru/reports/schedule/room/${href}.html`, corps});
          }
          reject(0)
      }).catch(reject)
  })
}

// парсер таблицы расписания аудитории
exports.getRasp = async (url, kab='') => {
  if (config.proxy.enabled)
    var p = await proxy.current();
  var httpsAgent = (config.proxy.enabled)?new HttpsProxyAgent(p):null;
  var userAgent = randomUseragent.getRandom();
  return new Promise((resolve, reject) => {
      if (!url || url < 0) reject(0)
      axios({
          method: 'get',
          url,
          timeout: 30000,
          httpsAgent,
          headers: {
                "User-Agent": userAgent
            },
      }).then(resp => {
          if (!resp.data) reject(-1)
          // вырезаем таблицу из страницы
          var table = new JSDOM(resp.data).window.document.querySelector("table");
          // вырезаем даты
          var items = table.querySelectorAll('td[rowspan="7"]');
          var dates = [];
          items.forEach(date=>{
              dates.push(date.textContent.trim())
          })
          // вырезаем кабинеты
          var items = table.querySelectorAll('td[class="R1C2"]');
          var kabs = [];
          items.forEach(aud=>{
              kabs.push(aud.textContent.trim())
          })
          // вырезаем занятия
          var rows = table.querySelectorAll(`tr`);
          var lessons = [];
          var rid = 0;
          rows.forEach((row, id) => {
              if(id > 1) {
                  var cols = row.querySelectorAll('td');
                  var cid = 0;
                  var dayId = Math.floor(rid / 7);
                  cols.forEach(col=>{
                      var colHtml = col.outerHTML
                      if( colHtml.indexOf('rowspan="7"') == -1 &&
                          colHtml.indexOf("<td>") == -1 &&
                          colHtml.indexOf('colspan="2"') == -1 &&
                          colHtml.indexOf("white-space:nowrap;max-width:0px;") == -1 ) {
                              if(!lessons[cid])lessons[cid] = {}
                              if(!lessons[cid].name) lessons[cid].name = kabs[cid]
                              if(!lessons[cid].data) lessons[cid].data = []
                              if(!lessons[cid].data[dayId]) lessons[cid].data[dayId] = {}
                              if(!lessons[cid].data[dayId].day) lessons[cid].data[dayId].day = dates[dayId]
                              if(!lessons[cid].data[dayId].lessons) lessons[cid].data[dayId].lessons = []
                              if(!lessons[cid].data[dayId].lessons[rid % 7]) lessons[cid].data[dayId].lessons[rid % 7] = col.textContent.trim()
                              cid++
                          }
                  })
                  rid++
              }
          });
          // выгружаем подготовленные данные
          if (kab.indexOf('-') != -1) {
              var types = common.kabTypes(kab)
              var rasp = [lessons.find(kabrasp => (kabrasp.name == kab))]
              resolve({rasp, kabs, dates, types})
          } else {
              var types = common.kabTypes(kab.split('-')[0])
              resolve({rasp: lessons, kabs, dates, types})
          }
      }).catch(reject)
  })
}