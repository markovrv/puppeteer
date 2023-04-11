const crypto = require("../lib/crypto")
const lsns = require("../lib/rasp")


module.exports = (req, res) => {
  var login = req.body.login
  var password = crypto.decrypt(req.body.passwordAES)
  var version = req.body.version
  var filter = req.body.filter

  if (version == "update") {
    res.send("OK")
    lsns.getRaspFromVyatsu({ login, password }, data => {
      lsns.raspAndDbConcat(login, data)
    }, console.log)
  } else if (version == "local") {
    lsns.getLessonsFromDB(login, filter, days => {
      res.send(days)
      lsns.getRaspFromVyatsu({ login, password }, data => {
        lsns.raspAndDbConcat(login, data)
      }, console.log)
    })
  } else if (version == "vyatsu") {
    lsns.getRaspFromVyatsu({ login, password }, days => {
      res.send(lsns.filter(days, filter))
    }, error => {
      res.status(500)
      res.send({ error });
    })
  } else {
    lsns.getRaspFromVyatsu({ login, password }, data => {
      lsns.raspAndDbConcat(login, data).then(() => {
        lsns.getLessonsFromDB(login, filter, days => {
          res.send(days)
        })
      })
    }, error => {
      res.status(500)
      res.send({ error })
    })
  }
}