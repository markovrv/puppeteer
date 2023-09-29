const axios = require('axios');
const HttpsProxyAgent = require("https-proxy-agent").HttpsProxyAgent;
const randomUseragent = require('random-useragent');
const common = require("../lib/common")
var debug = common.debug;
const pusherLog = true;
const pusher = common.pusher
const proxy = require("./proxy")
const config = require("../config")
const db = require("./db")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// класс - пустое занятие
class Lesson {
    static times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
    constructor(time, predm = '', type = '', kab = '', groups = []) {
        this.time = time
        this.predm = predm
        this.type = type
        this.kab = kab
        this.groups = groups
    }
    setInfo(data) {
        this.predm = data.predm
        this.type = data.type
        this.kab = data.kab
    }
    setGroups(groups) {
        this.groups = groups
    }
    static getEmptyDayLessons() {
        var arr = []
        for (var i = 0; i < 7; i++) arr.push(new Lesson(this.times[i]))
        return arr
    }
    static setLessonInDay(day, lesson) {
        var id = day.lessons.findIndex(l => l.time == lesson.time)
        if (id >= 0) day.lessons[id] = lesson
    }
}

// парсер страницы с расписанием из Личного Кабинета
var parse = (data) => {
    // проверяем на ошибки
    var errBlock = new JSDOM(data).window.document.querySelector('div[class="alert alert-danger"]');
    if (errBlock) return { error: errBlock.textContent }
    // вырезаем расписание из страницы
    var table = new JSDOM(data).window.document.querySelector('div[class="container"]');
    // вырезаем дни
    var arrDays = table.querySelectorAll('div[class="mx-auto p-5 md:px-0 day-container"]');
    // будущий массив с расписанием
    var days = [];
    arrDays.forEach(dItem => {
        var day = dItem.querySelector('div[class="px-5 md:px-16 py-7 text-lg font-normal"] b').textContent.trim().dateformat()
        var arrLes = dItem.querySelectorAll('div[class="flex flex-col day-pair"]')
        var lessons = Lesson.getEmptyDayLessons()
        arrLes.forEach((litem) => {
            // Номер занятия в выбранный день
            var idl = litem.querySelector('div[class="font-semibold text-base"]').textContent.trim().split(' ')[1] - 1

            // сохраняем данные о предмете
            var apr = litem.querySelector('div[class="text-sm pair_desc"]').innerHTML.trim().split(',')
            var predm, type, kab
            predm = type = kab = ''
            var l = apr.length
            apr.forEach((str, id) => {
                var s = str.trim()
                if (s != '(Дисциплина по выбору)' && id < l - 2) predm += (s + ', ')
                else if (id == l - 2) type = s
                else if (id == l - 1) kab = s
            })
            predm = predm.slice(0, -2).replace('Подгруппа 1, ', '').replace('Подгруппа 2, ', '').replace('Подгруппа 3, ', '').replace('Подгруппа 4, ', '')
            lessons[idl].setInfo({ predm, type, kab })

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

// функция получает расписание с сервера 
var getRaspData = async (login, password) => {
    var tryCount = 10;
    var tryIndex = 0;
    while (tryIndex < tryCount) {
        try {
            tryIndex++;
            if (config.proxy.enabled)
                var p = await proxy.get();
            var httpsAgent = (config.proxy.enabled)?new HttpsProxyAgent(p):null;
            var response = await axios({
                method: 'post',
                url: 'https://new.vyatsu.ru/account/obr/rasp/?login=yes',
                timeout: 10000,
                httpsAgent,
                headers: {
                    "Content-type": "application/x-www-form-urlencoded",
                    "User-Agent": randomUseragent.getRandom()
                },
                data: `AUTH_FORM=Y&TYPE=AUTH&backurl=/account/obr/rasp/&USER_LOGIN=${login}&USER_PASSWORD=${password}&USER_REMEMBER=N&Login=Войти`
            })
            if (debug && config.proxy.enabled) console.log("OK: " + p.host)
            if (pusherLog && config.proxy.enabled) {
                pusher.trigger(login, "my-event", {
                    message: "Ваш IP: " + p.host,
                    color: "#8bc34a",
                    time: new Date()
                });
            }
            return parse(response.data)
        } catch {
            if (debug && config.proxy.enabled) console.log("err: " + p.host)
            if (pusherLog && config.proxy.enabled) {
                pusher.trigger(login, "my-event", {
                    message: "Ошибка IP: " + p.host,
                    color: "red",
                    time: new Date()
                });
            }
        }
    }
    return { error: "get data error" }
}


// форматирование дней и занятий
var map = (docs) => {
    var days = []
    docs.forEach(doc => {
        var day = days.find(d => d.day == doc.day)
        if (!day) {
            day = {
                day: doc.day,
                lessons: Lesson.getEmptyDayLessons()
            }
            days.push(day)
        }
        Lesson.setLessonInDay(day, doc.lesson)
    })
    return days
}

// функция соединяет расписание с сервера с БД
exports.raspAndDbConcat = async (login, rasp) => {
    var date = new Date();
    var type = 0;
    var i = 0;
    var count = rasp.length
    var docs = await db.lessons.find({ login })
    while (i < count) {
        var day = rasp[i].day
        var j = 0
        while (j < rasp[i].lessons.length) {
            var time = rasp[i].lessons[j].time
            var lesson = rasp[i].lessons[j]
            var doc = docs.find(d => (d.day == day && d.time == time))
            if (doc) {
                // проверка изменений в расписании с оф. сайта
                if (doc.type == 0 && !foolEq(lesson, doc.lesson))
                    await db.lessons.update({ _id: doc._id, lesson });
            }
            else if (lesson.predm != '') await db.lessons.insert({ login, type, day, time, lesson, date })
            j++
        }
        i++
    }
}

exports.filter = (data, fstr) => {
    if (!fstr) return data
    if (fstr.split("--").length == 1) return data.filter(day => day.day == fstr)
    if (fstr.split("--").length == 2) {
        if (fstr.split("--")[0].length > 1 && fstr.split("--")[1] == "*") return data.filter(day => day.day >= fstr.split("--")[0])
        if (fstr.split("--")[0] == "*" && fstr.split("--")[1].length > 1) return data.filter(day => day.day <= fstr.split("--")[1])
        if (fstr.split("--")[0].length > 1 && fstr.split("--")[1].length > 1) return data.filter(day => (day.day >= fstr.split("--")[0]) && (day.day <= fstr.split("--")[1]))
        return data
    }
    return data
}

exports.getRaspFromVyatsu = (auth, cb, err) => {
    getRaspData(auth.login, auth.password).then(data => {
        if (data.error) err({ 'error': data.error })
        else cb(data)
    })
}

exports.getLessonsFromDB = (login, filter, cb) => {
    db.lessons.find({ login }).then(docs => {
        // преобразуем в вид День - Занятия и отправляем клиенту
        let days = map(docs)
        // применяем фильтр, если доступно
        cb(this.filter(days, filter))
    })
}