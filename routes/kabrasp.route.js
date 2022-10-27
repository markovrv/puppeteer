const express = require('express');
const router = express.Router()
const kr = require('../lib/kabrasp')

router.post('/', express.json(), (req, res) => {
  kr.getFilename(req.body.kab, req.body.date).then(rasplist => {
    kr.getRasp(rasplist.url, req.body.kab).then(data => {
      data.corps = rasplist.corps
      res.send(data)
    }).catch(console.log)
  }).catch(console.log) 
})

module.exports = router