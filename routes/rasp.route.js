const express = require('express');
const crypto = require("../lib/crypto")
const db = require("../lib/db")
const lsns = require("../lib/rasp")
const common = require("../lib/common")
const router = express.Router()


router.post('/', express.json(), (req, res) => {
  if(!common.isValidUsername(req.body.login)) {
    res.status(500);
    return res.send('Login is bad');
  }
  (async (login, password) => {
    // получаем расписание из ЛК
    var data = await lsns.getRaspData(login, password)
    if (data.error) {
      res.status(500);
      return res.send({'error': data.error});
    }
    // return res.send(data)
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