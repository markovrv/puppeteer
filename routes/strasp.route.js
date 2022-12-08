const express = require('express')
const router = express.Router()
const straspController = require('../controllers/strasp.controller')
const usernameMiddleware = require('../middleware/username.middleware')
const browserMiddleware = require('../middleware/browser.middleware')
const lkpgeMiddleware = require('../middleware/lkpage.middleware')

router.post(
    '/', 
    express.json(), 
    usernameMiddleware, 
    browserMiddleware,
    lkpgeMiddleware,
    straspController
)

module.exports = router