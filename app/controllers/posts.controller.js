const sqlPromise = require('../helpers/sqlPromise')
const { storageFileDelete } = require('../helpers/storageFileDelete')

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

exports.create = async (req, res) => {
  try {
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

    const query = await sqlPromise(
      'INSERT INTO posts (title, text, image, author, slug) VALUES (?, ?, ?, ?, ?)',
      [title, text, image, author, slug]
    )

    if (tags) {
      let sqlInsertPostTags = 'INSERT INTO post_tags (post_id, tag) VALUES'
      const sqlInsertpostTagsValues = []
      for (let tag of tags.split(',')) {
        await sqlPromise('INSERT INTO tags (name) VALUES (?)', tag).catch(
          () => {}
        )
        sqlInsertPostTags += ' (?, ?),'
        sqlInsertpostTagsValues.push(...[query.insertId, tag])
      }
      sqlInsertPostTags = sqlInsertPostTags.slice(0, -1)
      await sqlPromise(sqlInsertPostTags, sqlInsertpostTagsValues)
    }

    res.status(201).send({
      message: 'create post successful',
    })
  } catch (err) {
    console.log(err)

    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send({ message: 'slug is already taken' })
      return
    }

    res.status(500).send({ message: err.message })
  }
}

exports.readAll = async (req, res) => {
  try {
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
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.readById = async (req, res) => {
  try {
    const { id } = req.params

    const query = await sqlPromise(
      'SELECT posts.*, GROUP_CONCAT(post_tags.tag) AS tags FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id WHERE posts.id = ? GROUP BY post_tags.post_id',
      [id]
    )

    if (query.length === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    res.send(query[0])
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    let { title, text, slug, tags } = req.body
    let image = undefined
    let getPost = undefined

    if (req.file) {
      image = process.env.APP_URL + '/api/' + req.file.path.replace('\\', '/')
      getPost = await sqlPromise('SELECT image FROM posts WHERE id = ?', [id])
    }

    let sql = 'UPDATE posts SET'
    const updateValue = []
    if (title) (sql += ' title=?,'), updateValue.push(title)
    if (text) (sql += ' text=?,'), updateValue.push(text)
    if (slug) (sql += ' slug=?,'), updateValue.push(slug)
    if (image) (sql += ' image=?,'), updateValue.push(image)
    sql = sql.slice(0, -1)
    sql += ' WHERE id=?'
    updateValue.push(id)

    if (req.auth.role !== 'superadmin') {
      sql += ' AND author=?'
      updateValue.push(req.auth.email)
    }

    const query = await sqlPromise(sql, updateValue)

    if (query.affectedRows === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    storageFileDelete(getPost[0].image)

    if (tags) {
      await sqlPromise('DELETE FROM post_tags WHERE post_id = ?', [id])

      let sqlInsertTags = 'INSERT INTO tags (name) VALUES'
      const sqlInsertTagsValues = []
      let sqlInsertPostTags = 'INSERT INTO post_tags (post_id, tag) VALUES'
      const sqlInsertpostTagsValues = []
      tags.split(',').map((tag) => {
        sqlInsertTags += ' (?),'
        sqlInsertTagsValues.push(tag)
        sqlInsertPostTags += ' (?, ?),'
        sqlInsertpostTagsValues.push(...[id, tag])
      })
      sqlInsertTags = sqlInsertTags.slice(0, -1)
      sqlInsertPostTags = sqlInsertPostTags.slice(0, -1)
      // catch for ignore error duplicate tag name on table
      await sqlPromise(sqlInsertTags, sqlInsertTagsValues).catch((err) => {})
      await sqlPromise(sqlInsertPostTags, sqlInsertpostTagsValues)
    }

    res.send({
      message: 'post updated',
    })
  } catch (err) {
    console.log(err)

    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send({ message: 'slug is already taken' })
      return
    }

    res.status(500).send({ message: err.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params

    const getPost = await sqlPromise('SELECT image FROM posts WHERE id = ?', [
      id,
    ])

    let sql = 'DELETE FROM posts WHERE id = ?'
    const values = [id]

    if (req.auth.role !== 'superadmin') {
      sql += ' AND author=?'
      values.push(req.auth.email)
    }

    const query = await sqlPromise(sql, values)

    if (query.affectedRows === 0) {
      res.status(404).send({ message: 'post not found' })
      return
    }

    storageFileDelete(getPost[0].image)

    await sqlPromise('DELETE FROM post_tags WHERE post_id = ?', [id])

    res.send({
      message: 'post deleted',
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}
