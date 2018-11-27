//    /api/users/
const routes = require('express').Router()

routes.use('/', require('./userInfo'))

// /users/userid/watching/itemid
// /users/userid/bids/bidid
// /users/userid/won/itemid

module.exports = routes