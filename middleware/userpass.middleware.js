const common = require("../lib/common")

module.exports = (req, res, next) => {
  if(!common.isValidPassword(req.body.text)) {
    res.send({error: 'Неверный пароль.'});
  } else next()
}