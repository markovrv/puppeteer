const express = require('express');
const router = express.Router()
const raspController = require('../controllers/rasp.controller')
const usernameMiddleware = require('../middleware/username.middleware')


router.post('/', express.json(), usernameMiddleware, raspController)

module.exports = router