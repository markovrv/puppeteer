const express = require('express')
const router = express.Router()
const issController = require('../controllers/iss.controller')
const usernameMiddleware = require('../middleware/username.middleware')
const browserMiddleware = require('../middleware/browser.middleware')
const isspageMiddleware = require('../middleware/isspage.middleware')

router.post(
  '/worklist', 
  express.json(), 
  usernameMiddleware, 
  browserMiddleware,
  isspageMiddleware,
  issController.worklist
)
router.post(
  '/worklist/lessons', 
  express.json(), 
  usernameMiddleware,  
  browserMiddleware,
  isspageMiddleware,
  issController.lessons
)
router.post(
  '/', 
  express.json(), 
  usernameMiddleware,  
  browserMiddleware,
  isspageMiddleware,
  issController.index
)

module.exports = router