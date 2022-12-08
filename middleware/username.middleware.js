const common = require("../lib/common")

module.exports = (req, res, next) => {
  var login = (req.body.auth)
    ? req.body.auth.login
    : req.body.login
  if(!common.isValidUsername(login)) {
    res.send({error: 'Неверный логин.'});
  } else next();
}