const db = require('../configs/db.config')

exports.create = (req, res) => {
  const { title, text, tags } = req.body
  const image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
  const author = req.auth.email
  const slug =
    req.body.slug || title.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-')

  // check slug
  db.query('SELECT * FROM posts WHERE slug = ?', [slug], (err, result) => {
    if (err) {
      res.status(500).send({ message: err.message })
      return
    }

    if (result.length > 0) {
      res.status(400).send({ message: 'slug is already taken' })
      return
    }

    // insert post
    db.query(
      'INSERT INTO posts (title, text, image, author, slug) VALUES (?, ?, ?, ?, ?)',
      [title, text, image, author, slug],
      (err, result) => {
        if (err) {
          res.status(500).send({ message: err.message })
          return
        }

        tags.split(',').map((tag) => {
          // check tag
          db.query(
            'SELECT * FROM tags WHERE name = ?',
            [tag],
            (err, result) => {
              // insert tag if not in database
              if (result.length === 0) {
                db.query('INSERT INTO tags (name) VALUES (?)', [tag])
              }
            }
          )
          // insert post tag relation
          db.query('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [
            result.insertId,
            tag,
          ])
        })

        res.status(201).send({
          message: 'create post successful',
        })
      }
    )
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

exports.readBySlug = (req, res) => {
  const { slug } = req.params

  db.query('SELECT * FROM posts WHERE slug = ?', [slug], (err, result) => {
    if (err) {
      res.status(500).send({ message: err.message })
      return
    }

    res.send(result)
  })
}

exports.update = (req, res) => {
  const { id } = req.params
  let { title, text, slug } = req.body
  let image = undefined
  if (req.file) {
    image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
  }

  db.query('SELECT * FROM posts WHERE id = ?', [id], (err, result) => {
    if (result.length === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    title = title ? title : result[0].title
    text = text ? text : result[0].text
    image = image ? image : result[0].image
    slug = slug ? slug : result[0].slug

    db.query('SELECT * FROM posts WHERE slug = ?', [slug], (err, result) => {
      if (result.length > 0) {
        if (parseInt(result[0].id) !== parseInt(id)) {
          res.status(400).send({ message: 'slug is already use' })
          return
        }
      }

      db.query(
        'UPDATE posts SET title=?, text=?, image=?, slug=? WHERE id=?',
        [title, text, image, slug, id],
        (err) => {
          if (err) {
            res.status(500).send({ message: err.message })
            return
          }

          res.send({
            message: 'post updated',
          })
        }
      )
    })
  })
}

exports.delete = (req, res) => {
  const { id } = req.params

  db.query('DELETE FROM posts WHERE id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).send({ message: err.message })
      return
    }

    if (result.length === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    res.send({
      message: 'post deleted',
    })
  })
}
