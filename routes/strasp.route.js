const express = require('express')
const router = express.Router()
const straspController = require('../controllers/strasp.controller')
const usernameMiddleware = require('../middleware/username.middleware')


router.post('/', express.json(), usernameMiddleware, straspController)

module.exports = router