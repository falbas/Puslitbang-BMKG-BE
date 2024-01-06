const multer = require('multer')

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
      cb(null, Date.now() + '-' + file.originalname)
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
