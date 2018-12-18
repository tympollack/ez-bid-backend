const config = require('./config/config').get()
const express = require('express')
const cors = require('cors')({ origin: true })
const cookieParser = require('cookie-parser')()
const admin = require('firebase-admin')
const functions = require('firebase-functions')
require('firebase')
require('firebase/firestore')

const utils = require('./utils')
const vars = require('./vars')

const db = require('./firestore/init')

module.shareable = {
    admin: admin,
    config: config,
    cors: cors,
    db: db,
    functions: functions,
    url: config.url.base + config.url.apiPath,
    utils: utils,
    vars: vars
}

const puppeteer = module.shareable.puppeteer = require('./puppeteering/puppeteering')

exports.test = functions.https.onRequest(async (req, res) => {
    res.send('poop')
})

const adminApp = express()
addExpressMiddleware(adminApp)
const adminRouter = express.Router()
adminRouter.use('/', require('./admin/admin'))
adminApp.use(utils.tryCatchAsync)
adminApp.use(adminRouter) // must be after others
exports.admin = functions.https.onRequest(adminApp)

const apiApp = express()
addExpressMiddleware(apiApp)
const apiRouter = express.Router()
apiRouter.use('/auctions/', require('./api/auctions/auctions'))
apiRouter.use('/items/', require('./api/items/items'))
apiRouter.use('/locations/', require('./api/locations/locations'))
apiRouter.use('/users/', require('./api/users/users'))
apiApp.use(utils.tryCatchAsync)
apiApp.use(apiRouter) // must be after others
exports.api = functions.https.onRequest(apiApp)

const puppetApp = express()
addExpressMiddleware(puppetApp)
const puppetRouter = express.Router()
puppetRouter.use('/', puppeteer)
puppetApp.use(puppetRouter) // must be after others
exports.puppeteering = functions.runWith(config.puppeteer.opts).https.onRequest(puppetApp)

const ftaApp = express()
addExpressMiddleware(ftaApp)
const ftaRouter = express.Router()
ftaRouter.use('/', require('./bidfta-api/bidfta-api'))
ftaApp.use(cors)
ftaApp.use(utils.tryCatchAsync)
ftaApp.use(ftaRouter) // must be after others
exports.bidfta = functions.https.onRequest(ftaApp)

exports.firestoreReactive = require('./firestore-reactive')

exports.resizeImages = require('./resize-images')

exports.pubsub = require('./pubsub/listeners')

/////////////////////////////////////////////////////////////////////

function addExpressMiddleware(app) {
    app.use(cors)
    app.use(cookieParser)
    if (process.env.NODE_ENV === 'production') app.use(utils.validateFirebaseIdToken)
}