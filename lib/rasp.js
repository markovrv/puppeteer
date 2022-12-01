const axios = require('axios');
const db = require("./db")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// класс - пустое занятие
class Lesson {
  static times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
  constructor(time){
      this.time = time
      this.predm = ''
      this.type = ''
      this.kab = ''
      this.groups = []
  }
  setInfo(data){
      this.predm = data.predm
      this.type = data.type
      this.kab = data.kab
  }
  setGroups(groups){
      this.groups = groups
  }
  static getEmptyDayLessons() {
      var arr = []
      for (var i = 0; i < 7; i++) arr.push(new Lesson(this.times[i]))
      return arr
  }
}

// парсер страницы с расписанием из Личного Кабинета
var parse = (data) => {
    // проверяем на ошибки
    var errBlock = new JSDOM(data).window.document.querySelector('div[class="alert alert-danger"]');
    if(errBlock) return {error: errBlock.textContent}
    // вырезаем расписание из страницы
    var table = new JSDOM(data).window.document.querySelector('div[class="container"]');
    // вырезаем дни
    var arrDays = table.querySelectorAll('div[class=" mx-auto p-5 md:px-0"]');
    // будущий массив с расписанием
    var days = [];
    arrDays.forEach(dItem => {
        var day = dItem.querySelector('div[class="bg-[#1414140D] px-5 md:px-16 py-7 text-lg font-normal"] b').textContent.trim().dateformat()
        var arrLes = dItem.querySelectorAll('div[class="flex flex-col space-y-2 day-pair"]')
        var lessons = Lesson.getEmptyDayLessons()
        arrLes.forEach((litem) => {
            // Номер занятия в выбранный день
            var idl = litem.querySelector('div[class="font-semibold text-base"]').textContent.trim().split(' ')[1] - 1

            // сохраняем данные о предмете
            var apr = litem.querySelector('div[class="text-sm"]').innerHTML.trim().split(',')
            var predm, type, kab
            predm = type = kab = ''
            var l = apr.length
            apr.forEach((str, id)=>{
                var s = str.trim()
                if(s != '(Дисциплина по выбору)' && id < l - 2) predm += (s + ', ')
                else if(id == l - 2) type = s
                else if(id == l - 1) kab = s
            })
            predm = predm.slice(0, -2).replace('Подгруппа 1, ','').replace('Подгруппа 2, ','').replace('Подгруппа 3, ','').replace('Подгруппа 4, ','')
            lessons[idl].setInfo({predm, type, kab})

            // Сохраняем группы для занятия
            var stgroups = []
            var agr = litem.querySelectorAll('span[class="text-xs"]')
            agr.forEach(gr => {
                stgroups.push(gr.textContent.trim())
            })
            lessons[idl].setGroups(stgroups)
        })
        days.push({ day, lessons })
    })

    return days
}

// проверка занятий на идентичность
var foolEq = (l1, l2) => (l1.predm == l2.predm && l1.type == l2.type && l1.kab == l2.kab)

// функция соединяет расписание с сервера с БД
exports.raspAndDbConcat = async (login, rasp) => {
    var date = new Date();
    var type = 0;
    var i = 0;
    var count = rasp.length
    while (i < count) {
      var day = rasp[i].day
      var j = 0
      while (j < rasp[i].lessons.length) {
        var time = rasp[i].lessons[j].time
        var lesson = rasp[i].lessons[j]
        var doc = await db.lessons.findOne({ login, day, time })
        if (doc){
          if (doc.type == 0 && !foolEq(lesson, doc.lesson))
            await db.lessons.update({_id: doc._id}, {$set: {lesson}}, {});
        } else await db.lessons.insert({login, type, day, time, lesson, date})

        // добавляем замены из старой БД
        var doc = await db.changes.findOne({ login, day, time })
        if (doc) await db.lessons.update({ login, day, time }, {$set: {lesson: doc.lesson, type: doc.type}}, {});

        j++
      }
      i++
    }
}
  
// функция получает расписание с сервера
exports.getRaspData = async (login, password) => {
    try {
      var response = await axios({
        method: 'post',
        url: 'https://new.vyatsu.ru/account/obr/rasp/?login=yes',
        timeout: 30000,
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        data: `AUTH_FORM=Y&TYPE=AUTH&backurl=/account/obr/rasp/&USER_LOGIN=${login}&USER_PASSWORD=${password}&USER_REMEMBER=N&Login=Войти`
      })
    } catch {
      return {error: 'Get data error'}
    }
    return parse(response.data)
}

// порядок сортировки дней и занятий
exports.asc = (a, b) => {
    if(a.day == b.day){
        if(a.time[0] == '8') return -1
        if(b.time[0] == '8') return 1
        if(a.time > b.time) return 1
        return -1
    }
    if(a.day > b.day) return 1
    return -1
}

// форматирование дней и занятий
exports.map = (docs) => {
    var days = []
    var lessons = []
    var day = ''
    docs.forEach(doc => {
        if(day == '' || doc.day == day) {
            lessons.push(doc.lesson)
            if(day == '') day = doc.day
        } else {
            days.push({day, lessons})
            day = doc.day
            lessons = [doc.lesson]
        }
    })
    return days
}