const r = require('express').Router()
const posts = require('../controllers/posts.controller')
const { auth } = require('../middlewares/auth.middleware')
const { upload } = require('../middlewares/upload.middleware')

module.exports = (app) => {
  r.post('/', auth, upload.single('image'), posts.create)
  r.get('/', posts.readAll)
  r.get('/:id', posts.readById)
  r.put('/:id', auth, upload.single('image'), posts.update)
  r.delete('/:id', auth, posts.delete)

  app.use('/api/posts', r)
}
