const r = require('express').Router()
const users = require('../controllers/users.controller')
const { auth } = require('../middlewares/auth.middleware')

module.exports = (app) => {
  r.post('/register', users.register)
  r.post('/login', users.login)
  r.get('/verify', auth, users.verify)

  app.use('/api/users', r)
}
