require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000

const corsOption = {
  origin: '*',
}

app.use(cors(corsOption))
app.use(express.json())

app.get('/api', (req, res) => {
  res.send('Hello World!')
})

require('../app/routes/users.route')(app)

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
