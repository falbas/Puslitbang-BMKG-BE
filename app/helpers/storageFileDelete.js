const fs = require('fs')

exports.storageFileDelete = (url) => {
  const directoryPath = process.cwd() + '/storage/'
  const fileName = url.slice(url.lastIndexOf('/') + 1, url.length)
  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      console.log(err)
    }
  })
}
