module.exports = (app) => {
  const users = require('../controllers/users.controller')
  const r = require('express').Router()

  r.post('/register', users.register)
  r.post('/login', users.login)

  app.use('/api/users', r)
}