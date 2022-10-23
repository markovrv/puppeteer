const express = require('express');
const db = require("../lib/db")
const router = express.Router()


router.post('/changekab/cancel', express.json(), (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await db.users.find({login, apikey})
    if (docs.length > 0){
      var day  = req.body.day;
      var time = req.body.lesson.time
      var type = 0 // удаляем только замены кабинетов
      await db.changes.remove({login, day, time, type}, {})
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

router.post('/del', express.json(), (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await db.users.find({login, apikey})
    if (docs.length > 0){
      var day  = req.body.day;
      var time = req.body.lesson.time
      var lesson = req.body.lesson
      await db.changes.remove({login, day, time}, {})
      if (!lesson.copied && !lesson.deleted) {
        var type = 2 // флаг - удаление оригинального занятия
        var date = new Date();
        await db.changes.insert({login, type, day, time, lesson: { time, predm: '', type: '', kab: '', groups: [], deleted: true }, date})
      }
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

router.post('/changekab', express.json(), (req, res) => {
  (async()=>{
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    var docs = await db.users.find({login, apikey})
    if (docs.length > 0){
      if(!req.body.lesson.copied) req.body.lesson.oldkab = req.body.lesson.kab
      req.body.lesson.kab = req.body.newkab
      var type   = 0; // замена кабинета без копирования
      if(req.body.lesson.copied) type = 1; // копирование занятия
      if(!req.body.lesson.realcopy) {
        type = 3; // доставление занятия
        req.body.lesson.copied = false
      }
      var day    = req.body.day;
      var time   = req.body.lesson.time;
      var lesson = req.body.lesson;
      var date   = new Date();
      var rec = await db.changes.findOne({login, day, time, date})
      if (rec){
        await db.changes.update({_id: rec._id}, {lesson}, {});
      } else {
        await db.changes.insert({login, type, day, time, lesson, date})
      }
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

module.exports = router