module.exports = (app) => {
  const users = require('../controllers/users.controller')
  const r = require('express').Router()

  r.post('/', users.register)

  app.use('/api/users', r)
}