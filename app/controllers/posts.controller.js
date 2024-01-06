const db = require('../configs/db.config')
const sqlPromise = require('../helpers/sqlPromise')

const POSTS_ORDER_KEY = {
  title: 'posts.title',
  author: 'posts.author',
  created_at: 'posts.created_at',
  updated_at: 'posts.updated_at',
}

const POSTS_SORT_KEY = {
  asc: 'ASC',
  desc: 'DESC',
}

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

exports.readAll = async (req, res) => {
  let {
    q = '',
    limit = '10',
    page = '1',
    tags,
    slug,
    order = 'created_at',
    sort = 'asc',
    author = '',
  } = req.query
  limit = parseInt(limit)
  page = parseInt(page)
  let offset = limit * page - limit

  try {
    // read by slug
    if (slug) {
      const sql =
        'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE posts.slug = ? GROUP BY post_tags.post_id'
      const result = await sqlPromise(sql, [slug])

      if (result.length === 0) {
        res.status(404).send({ message: 'post not found' })
        return
      }

      res.send(result[0])

      return
    }

    // read by query
    let sql = ''
    let sqlCount = ''
    const values = []

    sqlCount = 'SELECT COUNT(*) AS total_posts FROM posts WHERE title LIKE ?'
    sql =
      'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE title LIKE ?'
    values.push(`%${q}%`)

    // search with tags
    if (tags) {
      sqlCount =
        'SELECT COUNT(*) AS total_posts FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE title LIKE ?'

      const tagValues = []
      tags.split(',').map((tag) => {
        tagValues.push(tag)
      })

      sqlCount += ' AND ('
      for (let i = 0; i < tagValues.length; i++) {
        if (i > 0) sqlCount += ' OR'
        sqlCount += ' post_tags.tag = ?'
      }
      sqlCount += ' )'

      sql += ' AND ('
      for (let i = 0; i < tagValues.length; i++) {
        if (i > 0) sql += ' OR'
        sql += ' post_tags.tag = ?'
      }
      sql += ' )'

      values.push(...tagValues)
    }

    if (author !== '') {
      sqlCount += ' AND author = ?'
      sql += ' AND author = ?'
      values.push(author)
    }

    sql += ' GROUP BY posts.id'
    sql += ' ORDER BY ' + (POSTS_ORDER_KEY[order] || 'posts.created_at')
    sql += ' ' + (POSTS_SORT_KEY[sort] || 'ASC')
    sql += ' LIMIT ? OFFSET ?'
    values.push(...[limit, offset])

    const postsCount = await sqlPromise(sqlCount, values)
    const postsRead = await sqlPromise(sql, values)

    res.send({
      page: page,
      limit: limit,
      total_pages: Math.ceil(postsCount[0].total_posts / limit),
      total_posts: postsCount[0].total_posts,
      data: postsRead,
    })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
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
  sql += ' WHERE id=?'
  updateValue.push(id)

  if (req.auth.role !== 'superadmin') {
    sql += ' AND author=?'
    updateValue.push(req.auth.email)
  }

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

  let sql = 'DELETE FROM posts WHERE id = ?'
  const values = [id]

  if (req.auth.role !== 'superadmin') {
    sql += ' AND author=?'
    updateValue.push(req.auth.email)
  }

  db.query(sql, values, (err, result) => {
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
