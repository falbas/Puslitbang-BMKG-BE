const db = require('../configs/db.config')
crypto = require('node:crypto')
const jwt = require('jsonwebtoken')

exports.register = (req, res) => {
  const { email, password, name } = req.body
  const role = 'admin'

  if (!email || !password || !name) {
    res.status(400).send({ message: 'all input is required' })
    return
  }

  db.query(
    'SELECT email FROM users WHERE email = ?',
    [email],
    (err, result) => {
      if (err) {
        res.status(500).send({ message: err.message })
        return
      }

      if (result.length > 0) {
        res.status(400).send({ message: 'email has already taken' })
        return
      } else {
        const encpass = crypto
          .createHmac('sha256', process.env.KEY_PASS)
          .update(password)
          .digest('hex')

        db.query(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          [email, encpass, name, role],
          (err) => {
            if (err) {
              res.status(500).send({ message: err.message })
              return
            }

            res.status(201).send({
              message: 'register successful',
            })
          }
        )
      }
    }
  )
}

exports.login = (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).send({ message: 'all input is required' })
    return
  }

  const encpass = crypto
    .createHmac('sha256', process.env.KEY_PASS)
    .update(password)
    .digest('hex')

  db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, encpass],
    (err, result) => {
      if (err) {
        res.status(500).send({ message: err.message })
        return
      }

      if (result.length === 0) {
        res.status(404).send({ message: 'user does not exist' })
        return
      }

      const token = jwt.sign(
        { email: result[0].email, role: result[0].role },
        process.env.TOKEN_KEY,
        {
          expiresIn: process.env.TOKEN_EXP,
        }
      )

      res.send({
        message: 'login successful',
        token: token,
      })
    }
  )
}
