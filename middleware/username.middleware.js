const common = require("../lib/common")

module.exports = (req, res, next) => {
  if (req.body.token) {
    var at = atob(req.body.token).split('#')
    if (at.length == 4) {
      req.body.auth = {
        login: at[0],
        passwordAES:
          JSON.stringify({
            ct: at[1],
            iv: at[2],
            s: at[3]
          })
      }
      req.body.login = at[0]
      req.body.passwordAES = JSON.stringify({
        ct: at[1],
        iv: at[2],
        s: at[3]
      })
    }
  }

  var login = (req.body.auth)
    ? req.body.auth.login
    : req.body.login
  if (!common.isValidUsername(login)) {
    res.send({ error: 'Неверный логин.' });
  } else next();
}