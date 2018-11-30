const config = require('./config/config').get()
const express = require('express')
const cors = require('cors')({ origin: true })
const cookieParser = require('cookie-parser')()
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const utils = require('./utils')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

module.shareable = {
    admin: admin,
    config: config,
    db: db,
    functions: functions,
    url: config.url.base + config.url.apiPath,
    utils: utils
}

exports.test = functions.https.onRequest((req, res) => {
    res.status(200).send('poop')
})

const exapp = express()
const router = express.Router()
router.use('/auctions/', require('./api/auctions/auctions'))
router.use('/items/', require('./api/items/items'))
router.use('/locations/', require('./api/locations/locations'))
router.use('/users/', require('./api/users/users'))
exapp.use(cors)
exapp.use(cookieParser)
// exapp.use(utils.validateFirebaseIdToken)
exapp.use(utils.tryCatchAsync)
exapp.use(router) // must be after others
exports.api = functions.https.onRequest(exapp)

const puppetApp = express()
const puppetRouter = express.Router()
const puppetOps = { memory: '2GB', timeoutSeconds: 60 }
puppetRouter.use('/puppeteering/', require('./puppeteering'))
puppetApp.use(cors)
puppetApp.use(cookieParser)
// puppetApp.use(utils.validateFirebaseIdToken)
puppetApp.use(puppetRouter) // must be after others
exports.puppeteering = functions.runWith(puppetOps).https.onRequest(puppetApp)

exports.firestoreReactive = require('./firestore-reactive')

exports.resizeImages = require('./resize-images')

exports.cron = require('./pubsub/listeners')

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
        errors: {}
    }

    const promises = []

    const auctionStart = 6000
    for (let i = 0, max = 1000; i < max; i++) {
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
                        ret.errors[auctionNumber] = error
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