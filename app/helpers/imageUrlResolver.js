exports.imageUrlResolver = (image) => {
  return process.env.APP_URL + '/api/storage/' + image
}
