const express = require('express')
const router = express.Router()
const straspController = require('../controllers/strasp.controller')


router.post('/', express.json(), straspController.getData)

module.exports = router