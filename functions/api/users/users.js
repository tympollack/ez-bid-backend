//    /api/users/

const routes = require('express').Router()

//    /
routes.use('/', require('./userInfo'))

// /user/userid/watching/itemid
// /user/userid/bids/bidid
// /user/userid/won/itemid



module.exports = routes


