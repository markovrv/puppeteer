const express = require('express');
const crypto = require("../lib/crypto")
const db = require("../lib/db")
const common = require("../lib/common")
const router = express.Router()

router.post('/login', express.json(), (req, res) => {
  (async () => {
    if(!common.isValidUsername(req.body.login)) return res.send({error: 'Неверный логин.'});
    if(!common.isValidPassword(req.body.text)) return res.send({error: 'Неверный пароль.'});
    var login = req.body.login;
    var message = req.body.text;
    var encrypted = crypto.encrypt(message)
    var encrypted_json_str = encrypted.toString();
    var apikey = encrypted_json_str.MD5();
    var date = new Date();
    await db.users.insert({login, apikey, date})
    res.send({encrypted_json_str});
  })()
})

router.post('/logout', express.json(), (req, res) => {
  (async()=>{
    if(!common.isValidUsername(req.body.login)) return res.send({status: 'Bad login'});
    var login  = req.body.login;
    var apikey = req.body.passwordAES.MD5();
    await db.users.remove({login, apikey}, {})
    res.send({status: 'OK'});
  })()
})

module.exports = router