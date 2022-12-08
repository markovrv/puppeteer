const express = require('express')
const router = express.Router()
const usernameMiddleware = require('../middleware/username.middleware')
const userpassMiddleware = require('../middleware/userpass.middleware')
const userController = require('../controllers/user.controller')

router.post('/login', express.json(), usernameMiddleware, userpassMiddleware, userController.login)
router.post('/logout', express.json(), usernameMiddleware, userController.logout)

module.exports = router