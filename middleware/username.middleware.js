const common = require("../lib/common")

module.exports = (req, res, next) => {
  if(!common.isValidUsername(req.body.login)) {
    res.send({error: 'Неверный логин.'});
  } else next();
}