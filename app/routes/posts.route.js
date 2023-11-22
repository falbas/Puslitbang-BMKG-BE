const r = require('express').Router()
const posts = require('../controllers/posts.controller')
const { auth } = require('../middlewares/auth.middleware')
const { upload } = require('../middlewares/upload.middleware')

module.exports = (app) => {
  r.post('/', auth, upload.single('image'), posts.create)

  app.use('/api/posts', r)
}
