const db = require('../configs/db.config')

exports.create = (req, res) => {
  const { title, text, tags } = req.body

  if (!title || !text) {
    res.status(400).send({ message: 'title and text is required' })
    return
  }

  let image = undefined
  if (req.file) {
    image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
  }
  const author = req.auth.email
  const slug =
    req.body.slug || title.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-')

  db.query(
    'INSERT INTO posts (title, text, image, author, slug) VALUES (?, ?, ?, ?, ?)',
    [title, text, image, author, slug],
    (err, result) => {
      if (err) {
        if (err.message.includes("'slug'")) {
          res.status(400).send({ message: 'slug is already taken' })
          return
        }

        res.status(500).send({ message: err.message })
        return
      }

      if (tags) {
        tags.split(',').map((tag) => {
          db.query(
            'INSERT INTO tags (name) VALUES (?)',
            [tag],
            (err, result) => {}
          )
          db.query('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [
            result.insertId,
            tag,
          ])
        })
      }

      res.status(201).send({
        message: 'create post successful',
      })
    }
  )
}

exports.readAll = (req, res) => {
  let { q = '', limit = '10', page = '1', tags, slug } = req.query
  limit = parseInt(limit)
  page = parseInt(page)
  let offset = limit * page - limit

  // read by slug
  if (slug) {
    db.query(
      'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE posts.slug = ? GROUP BY post_tags.post_id',
      [slug],
      (err, result) => {
        if (err) {
          res.status(500).send({ message: err.message })
          return
        }

        res.send(result[0])
      }
    )
    return
  }

  // read by tags
  if (tags) {
    let sql =
      'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts JOIN post_tags ON posts.id = post_tags.post_id WHERE'
    const tagValue = []
    tags.split(',').map((tag) => {
      if (tagValue.length > 0) sql += ' OR'
      sql += ' post_tags.tag = ?'
      tagValue.push(tag)
    })
    sql += ' GROUP BY posts.id ORDER BY created_at LIMIT ? OFFSET ?'

    db.query(sql, [...tagValue, limit, offset], (err, result) => {
      if (err) {
        res.status(500).send({ message: err.message })
        return
      }

      res.send(result)
    })
    return
  }

  // read by query
  db.query(
    'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE title LIKE ? GROUP BY post_tags.post_id ORDER BY created_at LIMIT ? OFFSET ?',
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

exports.readById = (req, res) => {
  const { id } = req.params

  db.query(
    'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE posts.id = ? GROUP BY post_tags.post_id',
    [id],
    (err, result) => {
      if (err) {
        res.status(500).send({ message: err.message })
        return
      }

      if (result.length === 0) {
        res.status(404).send({ message: 'post not found' })
        return
      }

      res.send(result[0])
    }
  )
}

exports.update = (req, res) => {
  const { id } = req.params
  let { title, text, slug, tags } = req.body
  let image = undefined
  if (req.file) {
    image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
  }

  let sql = 'UPDATE posts SET'
  const updateValue = []
  if (title) (sql += ' title=?,'), updateValue.push(title)
  if (text) (sql += ' text=?,'), updateValue.push(text)
  if (slug) (sql += ' slug=?,'), updateValue.push(slug)
  if (image) (sql += ' image=?,'), updateValue.push(image)
  sql = sql.replace(/,(?=[^,]*$)/, '')
  ;(sql += ' WHERE id=?'), updateValue.push(id)

  db.query(sql, updateValue, (err, result) => {
    if (err) {
      if (err.message.includes("'slug'")) {
        res.status(400).send({ message: 'slug is already taken' })
        return
      }

      res.status(500).send({ message: err.message })
      return
    }

    if (result.affectedRows === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    if (tags) {
      db.query('DELETE FROM post_tags WHERE post_id = ?', [id])
      tags.split(',').map((tag) => {
        db.query(
          'INSERT INTO tags (name) VALUES (?)',
          [tag],
          (err, result) => {}
        )
        db.query('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [
          id,
          tag,
        ])
      })
    }

    res.send({
      message: 'post updated',
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

    if (result.affectedRows === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    db.query('DELETE FROM post_tags WHERE post_id = ?', [id])

    res.send({
      message: 'post deleted',
    })
  })
}
