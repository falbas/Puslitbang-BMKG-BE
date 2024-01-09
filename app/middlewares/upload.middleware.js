const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const uploadFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'storage/')
    },
    filename: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        const e = new Error('Image file not valid')
        e.code = 'INVALID_IMAGE_FILE'
        cb(e, false)
      }
      cb(null, uuidv4() + file.originalname.match(/\.(jpg|jpeg|png)$/)[0])
    },
  }),
  limits: {
    fileSize: 2000000,
  },
}).single('image')

exports.upload = (req, res, next) => {
  uploadFile(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send({ message: 'file too large' })
    } else if (err?.code === 'INVALID_IMAGE_FILE') {
      return res.status(400).send({ message: 'invalid image file' })
    }
    next()
  })
}
