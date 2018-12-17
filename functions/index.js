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
    // res.send('poop')
    const fsFuncs = require('./firestore/fsFuncs')
    const puppetFuncs = require('./puppeteering/puppetFuncs')
    console.log('Finding new auctions...')

    // get session info
    console.log('getting user session from firestore')
    let opts = await await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        console.log('failed getting user session')
        res.json(opts)
        return
    }

    opts.db = db
    opts.skipLogin = true
    if (!utils.isValidSession(opts.session)) {
        console.log('invalid session, renewing session')
        await puppetFuncs.puppetAction(opts)
        Object.assign(opts, await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID))
    }

    console.log('preparing crawl for auctions')
    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
    const highestGoodAuctionNum = highestGoodAuction[vars.FS_AUCTION_AUCTION_NUMBER]
    const badAuctionNums = await fsFuncs.getUnusedAuctionNumbers()
    const highestBadAuctionNum = badAuctionNums.sort((a, b) => { return b - a })[0]
    const isHighestBadNumberTooHigh = highestBadAuctionNum > highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT
    const isHighestGoodAuctionTooOld = highestGoodAuction[vars.FS_AUCTION_END_DATE]._seconds * 1000 < new Date()
    const startNum = (isHighestBadNumberTooHigh && isHighestGoodAuctionTooOld) ? highestBadAuctionNum : highestGoodAuctionNum

    const auctionNumsToGet = []
    for (let i = 1, len = vars.PS_FIND_AUCTIONS_AMOUNT; i <= len; i++) {
        auctionNumsToGet.push(startNum + i)
    }

    const auctionInfos = await puppetFuncs.crawlAuctionInfo(auctionNumsToGet, opts)
    auctionInfos.forEach(info => {
        const num = info[vars.FS_AUCTION_AUCTION_NUMBER]
        if (info.error) {
            console.log('Unable to crawl auction at this time.', , info.error)
            return
        }
        if (!info.name) {
            console.log('bad auction num', num)
            if (badAuctionNums.indexOf(num) === -1) {
                fsFuncs.addUnusedAuctionNumber(num)
                badAuctionNums.push(num)
            }
        }
        info[vars.FS_AUCTION_ADD_DATE] = new Date()
        info[vars.FS_AUCTION_AUCTION_NUMBER] = num
        info[vars.FS_AUCTION_ITEM_LIST] = []
        info[vars.FS_AUCTION_ITEMS_CRAWLED] = false
        info[vars.FS_AUCTION_SANITIZED] = false
        fsFuncs.addNewAuction(info)
        console.log('auctionInfo set for', num)
    })

    res.json(auctionInfos)
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