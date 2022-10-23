const express = require('express');
const crypto = require("../lib/crypto")
const db = require("../lib/db")
const lsns = require("../lib/rasp")
const router = express.Router()


router.post('/', express.json(), (req, res) => {
  (async (login, password) => {
    // получаем расписание из ЛК
    var data = await lsns.getRaspData(login, password)
    // объединяем расписание с данными из локальной БД
    await lsns.raspAndDbConcat(login, data)
    // выгружаем все занятия из БД
    var docs = await db.lessons.find({login})
    // сортируем по дням и по времени
    docs.sort(lsns.asc)
    // преобразуем в вид День - Занятия и отправляем клиенту
    res.send(lsns.map(docs))
  })(req.body.login, crypto.decrypt(req.body.passwordAES))
})

module.exports = router