const express = require('express');
const router = express.Router()
const kr = require('../lib/kabrasp')

router.post('/', express.json(), (req, res) => {
  kr.getFilename(req.body.kab, req.body.date).then(name => {
    kr.getRasp(name, req.body.kab).then(data => {
      res.send(data)
    }).catch(console.log)
  }).catch(console.log) 
})

module.exports = router