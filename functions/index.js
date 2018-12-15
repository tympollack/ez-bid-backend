const config = require('./config/config').get()
const express = require('express')
const cors = require('cors')({ origin: true })
const cookieParser = require('cookie-parser')()
const admin = require('firebase-admin')
const functions = require('firebase-functions')
require('firebase')
require('firebase/firestore')

const fsFuncs = require('./firestore/fsFuncs')
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

exports.testFindAuctions = functions.https.onRequest(async (req, res) => {
    const csrf = 'eb382da8-7bdc-4e10-b965-b1e9d6a228bb'
    const cookie = 'JSESSIONID=BE52D99BE751BAEA92EEABFAD33AAEC2;' +
        'AWSALB=8Y4ir7TWFwf52HTLO5M4tpufLr/wlkj8lcVqr/JdNc9/dBuUc2QdGEFCsO0IeoMPWs8IcJa3qbffVHSTNecETV4TGlM5kz8zVl+jZsgMvJifSqciCXkSUWpZ9Rll'

    const baseUrl = 'https://www.bidfta.com/auctionDetails?idauctions='
    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'cookie': cookie,
            'x-csrf-token': csrf
        },
        redirect: 'follow',
    }

    const oops = 'Oops Something went wrong.'
    const ret = {
        goodNumbers: [],
        badNumbers: [],
        httpResponses: {}
    }

    const promises = []

    const auctionStart = 6000
    for (let i = 0, max = 100; i < max; i++) {
        const promise = new Promise(resolve => {
            cors(req, res, async () => {
                const auctionNumber = auctionStart + i
                const url = baseUrl + auctionNumber
                console.log('Calling auction', auctionNumber)
                await fetch(url, params)
                    .then(response => response.text().then(r => {
                        if (r.indexOf(oops) > -1) ret.badNumbers.push(auctionNumber)
                        else ret.goodNumbers.push(auctionNumber)
                    }))
                    .catch(error => {
                        ret.httpResponses[auctionNumber] = error
                    })
                resolve()
            })
        })
        promises.push(promise)
    }
    await Promise.all(promises)

    ret.goodNumbers.sort()
    ret.badNumbers.sort()

    res.status(200).json(ret)
})

/////////////////////////////////////////////////////////////////////

function addExpressMiddleware(app) {
    app.use(cors)
    app.use(cookieParser)
    if (process.env.NODE_ENV === 'production') app.use(utils.validateFirebaseIdToken)
}