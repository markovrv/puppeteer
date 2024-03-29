const express = require('express');
const db = require("../lib/db")
const router = express.Router()


// router.post('/changekab/cancel', express.json(), (req, res) => {
//   (async()=>{
//     var login  = req.body.login;
//     var apikey = req.body.passwordAES.MD5();
//     var docs = await db.users.find({login, apikey})
//     if (docs.length > 0){
//       var day  = req.body.day;
//       var time = req.body.lesson.time
//       var type = 0 // удаляем только замены кабинетов
//       await db.changes.remove({login, day, time, type}, {})
//       res.send({status: 'OK'})
//     } else res.sendStatus(401)
//   })()
// })

router.post('/del', express.json(), (req, res) => {
  (async()=>{
    const login = req.body.login;
    const apikey = req.body.passwordAES.MD5();

    var users = await db.users.find({login, apikey})
    if (users.length > 0){
      var day = req.body.day;
      var time = req.body.lesson.time
      await db.lessons.removeOne({ login, day, time }, {})
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

// router.post('/del/all/local', express.json(), (req, res) => {
//   (async()=>{
//     var login  = req.body.login;
//     var apikey = req.body.passwordAES.MD5();
//     var docs = await db.users.find({login, apikey})
//     if (docs.length > 0){
//       await db.changes.remove({login}, {multi: true})
//       await db.lessons.remove({login}, {multi: true})
//       res.send({status: 'OK'})
//     } else res.sendStatus(401)
//   })()
// })

// router.post('/changekab', express.json(), (req, res) => {
//   (async()=>{
//     var login  = req.body.login;
//     var apikey = req.body.passwordAES.MD5();
//     var docs = await db.users.find({login, apikey})
//     if (docs.length > 0){
//       if(!req.body.lesson.copied) req.body.lesson.oldkab = req.body.lesson.kab
//       req.body.lesson.kab = req.body.newkab
//       var type   = 0; // замена кабинета без копирования
//       if(req.body.lesson.copied) type = 1; // копирование занятия
//       if(!req.body.lesson.realcopy) {
//         type = 3; // доставление занятия
//         req.body.lesson.copied = false
//       }
//       var day    = req.body.day;
//       var time   = req.body.lesson.time;
//       var lesson = req.body.lesson;
//       var date   = new Date();
//       var rec = await db.changes.findOne({login, day, time})
//       if (rec){
//         await db.changes.update({_id: rec._id}, {lesson}, {});
//       } else {
//         await db.changes.insert({login, type, day, time, lesson, date})
//       }
//       res.send({status: 'OK'})
//     } else res.sendStatus(401)
//   })()
// })

// router.post('/add/lesson', express.json(), (req, res) => {
//   (async()=>{
//     var login  = req.body.login;
//     var apikey = req.body.passwordAES.MD5();
//     var docs = await db.users.find({login, apikey})
//     if (docs.length > 0){
//       var type   = 10; // защищенная запись (в журнале)
//       var day    = req.body.day;
//       var time   = req.body.lesson.time;
//       var lesson = req.body.lesson;
//       var date   = new Date();
//       var rec = await db.changes.findOne({login, day, time})
//       if (rec){
//         await db.changes.update({_id: rec._id}, {lesson}, {});
//       } else {
//         await db.changes.insert({login, type, day, time, lesson, date})
//       }
//       res.send({status: 'OK'})
//     } else res.sendStatus(401)
//   })()
// })

router.post('/self/lesson/multi', express.json(), (req, res) => {
  (async()=>{
    const login = req.body.login;
    const apikey = req.body.passwordAES.MD5();
    const type = 100; // наивысший приоритет - собственная запись, нестираемая
    const date = new Date();
    var lessons = req.body.lessons

    var users = await db.users.find({login, apikey})
    if (users.length > 0){
      var i = 0
      const count = lessons.length
      while(i < count) {
        var day = lessons[i].day;
        var time = lessons[i].time;
        var lesson = lessons[i];
        var rec = await db.lessons.findOne({ login, day, time })
        if (rec){
          await db.lessons.update({ _id: rec._id }, { login, type, day, time, lesson, date }, {});
        } else {
          await db.lessons.insert({ login, type, day, time, lesson, date })
        }
        i++
      }
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

router.post('/self/lesson', express.json(), (req, res) => {
  (async()=>{
    const login = req.body.login;
    const apikey = req.body.passwordAES.MD5();
    const type = 100; // наивысший приоритет - собственная запись, нестираемая
    const date = new Date();

    var users = await db.users.find({login, apikey})
    if (users.length > 0){
      var day = req.body.day;
      var time = req.body.lesson.time;
      var lesson = req.body.lesson;
      var rec = await db.lessons.findOne({login, day, time})
      if (rec){
        await db.lessons.update({_id: rec._id}, {login, type, day, time, lesson, date}, {});
      } else {
        await db.lessons.insert({login, type, day, time, lesson, date})
      }
      res.send({status: 'OK'})
    } else res.sendStatus(401)
  })()
})

// Временный маршрут для миграции на новую БД
router.get('/migrate', (req, res) => {
  db.lessons.count().then(data => {
    if (data.cnt > 0) return res.send('DB is not empty!')
    db.lessonsOld.find({}).then(docs => {
      docs.forEach(doc => { 
        if (doc.lesson.predm != '') db.lessons.insert(doc);
      });
      res.send("OK");
    });
  })
})

module.exports = router