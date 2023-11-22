const db = require('../configs/db.config')

exports.create = (req, res) => {
  const { title, text } = req.body
  const image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
  const author = req.auth.email
  const slug =
    req.body.slug || title.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-')

  db.query('SELECT * FROM posts WHERE slug = ?', [slug], (err, result) => {
    if (err) {
      res.status(500).send({ message: err.message })
      return
    }

    if (result.length > 0) {
      res.status(400).send({ message: 'slug is already taken' })
    } else {
      db.query(
        'INSERT INTO posts (title, text, image, author, slug) VALUES (?, ?, ?, ?, ?)',
        [title, text, image, author, slug],
        (err) => {
          if (err) {
            res.status(500).send({ message: err.message })
            return
          }

          res.status(201).send({
            message: 'create post successful',
          })
        }
      )
    }
  })
}

exports.readAll = (req, res) => {
  let { q = '', limit = '10', page = '1' } = req.query
  limit = parseInt(limit)
  page = parseInt(page)
  let offset = limit * page - limit

  db.query(
    'SELECT * FROM posts WHERE title LIKE ? ORDER BY created_at LIMIT ? OFFSET ?',
    [`%${q}%`, limit, offset],
    (err, result) => {
      if (err) {
        res.status(500).send({ message: err.message })
        return
      }

      res.send(result)
    }
  )
}