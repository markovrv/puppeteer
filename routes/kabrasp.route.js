const express = require('express');
const router = express.Router()
const kabRaspController = require('../controllers/kabrasp.controller')

router.post('/', express.json(), kabRaspController)

module.exports = router