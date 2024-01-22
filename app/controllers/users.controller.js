const { createHmac } = require('node:crypto')
const jwt = require('jsonwebtoken')
const sqlPromise = require('../helpers/sqlPromise')

const USERS_ORDER_KEY = {
  email: 'users.email',
  name: 'users.name',
  created_at: 'users.created_at',
  updated_at: 'users.updated_at',
}

const USERS_SORT_KEY = {
  asc: 'ASC',
  desc: 'DESC',
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body
    const role = 'admin'

    if (req.auth.role !== 'superadmin') {
      res.status(401).send({ message: 'permission denied' })
      return
    }

    if (!email || !password || !name) {
      res.status(400).send({ message: 'all input is required' })
      return
    }

    const encpass = createHmac('sha256', process.env.KEY_PASS)
      .update(password)
      .digest('hex')

    const query = await sqlPromise(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, encpass, name, role]
    )

    console.log(query)

    res.status(200).send({ message: 'register successful' })
  } catch (err) {
    console.log(err)

    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send({ message: 'email is already taken' })
      return
    }

    res.status(500).send({ message: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).send({ message: 'all input is required' })
      return
    }

    const encpass = createHmac('sha256', process.env.KEY_PASS)
      .update(password)
      .digest('hex')

    const query = await sqlPromise(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, encpass]
    )

    if (query.length === 0) {
      res.status(401).send({ message: 'email or password is wrong' })
      return
    }

    const token = jwt.sign(
      { email: query[0].email, role: query[0].role },
      process.env.TOKEN_KEY,
      {
        expiresIn: process.env.TOKEN_EXP,
      }
    )

    res.send({
      message: 'login successful',
      token: token,
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.verify = (req, res) => {
  try {
    res.send({
      message: 'authorized',
      ...req.auth,
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.readAll = async (req, res) => {
  try {
    let {
      q = '',
      limit = '10',
      page = '1',
      order = 'created_at',
      sort = 'asc',
    } = req.query
    limit = parseInt(limit)
    page = parseInt(page)
    let offset = limit * page - limit

    if (req.auth.role !== 'superadmin') {
      res.status(401).send({ message: 'permission denied' })
      return
    }

    // read by query
    let sql = ''
    let sqlCount = ''
    const values = []

    sqlCount = 'SELECT COUNT(email) AS total FROM users WHERE email LIKE ?'
    sql =
      'SELECT email, name, role, created_at, updated_at FROM users WHERE email LIKE ?'
    values.push(`%${q}%`)

    sql += ' ORDER BY ' + (USERS_ORDER_KEY[order] || 'users.created_at')
    sql += ' ' + (USERS_SORT_KEY[sort] || 'ASC')
    sql += ' LIMIT ? OFFSET ?'
    values.push(...[limit, offset])

    const usersCount = await sqlPromise(sqlCount, values)
    const usersRead = await sqlPromise(sql, values)

    res.send({
      page: page,
      limit: limit,
      total_pages: Math.ceil(usersCount[0].total / limit),
      total: usersCount[0].total,
      data: usersRead,
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, password } = req.body
    const email = req.auth.email

    if (name || password) {
      let sql = 'UPDATE users SET'

      const updateValue = []
      if (name) (sql += ' name=?,'), updateValue.push(name)
      if (password) {
        const encpass = createHmac('sha256', process.env.KEY_PASS)
          .update(password)
          .digest('hex')
        sql += ' password=?,'
        updateValue.push(encpass)
      }
      sql = sql.slice(0, -1)
      sql += ' WHERE email=?'
      updateValue.push(email)

      await sqlPromise(sql, updateValue)
    }

    res.send({
      message: 'user updated',
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { email } = req.params

    if (req.auth.role !== 'superadmin') {
      res.status(401).send({ message: 'permission denied' })
      return
    }

    const query = await sqlPromise(
      'DELETE FROM users WHERE email = ? AND role = "admin"',
      [email]
    )

    if (query.affectedRows === 0) {
      res.status(404).send({ message: 'user not found' })
      return
    }

    res.send({
      message: 'user deleted',
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}

exports.info = async (req, res) => {
  try {
    const query = await sqlPromise('SELECT * FROM users WHERE email = ?', [
      req.auth.email,
    ])

    if (query.length === 0) {
      res.status(404).send({ message: 'user not found' })
      return
    }

    res.send({
      data: {
        ...query[0],
        password: undefined,
      },
    })
  } catch (err) {
    console.log(err)

    res.status(500).send({ message: err.message })
  }
}
