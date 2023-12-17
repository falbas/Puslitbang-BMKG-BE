const r = require('express').Router()
const users = require('../controllers/users.controller')
const { auth } = require('../middlewares/auth.middleware')

module.exports = (app) => {
  r.post('/register', auth, users.register)
  r.post('/login', users.login)
  r.get('/verify', auth, users.verify)
  r.put('/', auth, users.update)
  r.delete('/:email', auth, users.delete)

  app.use('/api/users', r)
}
