const config = require('./config/config').get()
const express = require('express')
const cors = require('cors')({ origin: true })
const cookieParser = require('cookie-parser')()
const admin = require('firebase-admin')
const functions = require('firebase-functions')
require('firebase')
require('firebase/firestore')

const utils = require('./utils')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

module.shareable = {
    admin: admin,
    config: config,
    cors: cors,
    db: db,
    functions: functions,
    url: config.url.base + config.url.apiPath,
    utils: utils
}

const puppeteer = module.shareable.puppeteer = require('./puppeteering/puppeteering')

exports.test = functions.https.onRequest(async (req, res) => {
    // res.send('poop')

    const { findAuctionsAmount, topics } = config.pubsub
    const fsCollections = config.firestore.collections
    const fsInfoCollection = fsCollections.info
    const fsAuctionsCollection = fsCollections.auctions
    const fsAuctionFields = fsAuctionsCollection.fields
    const auctionDetailsConfig = config.bidApiUrls.auctionDetails
    const goodNums = fsInfoCollection.docs.goodAuctionNumbers.fields.nums.name
    const badNums = fsInfoCollection.docs.badAuctionNumbers.fields.nums.name
    const puppetFuncs = require('./puppeteering/puppetFuncs')

    console.log('Finding new auctions...')

    // get highest auction number
    let auctionStart = 0
    const snap = await db.collection(fsAuctionsCollection.name)
        .orderBy(fsAuctionFields.auctionNumber.name, 'desc')
        .limit(1)
        .get()

    snap.forEach(doc => {
        auctionStart = doc.data().auctionNumber || 0
    })

    // get session info
    let opts = await puppetFuncs.getFsUserSession(db, config.firestore.serviceAccount.userId)
    if (!opts) return

    opts.db = db
    if (!puppetFuncs.isValidSession(opts.session)) {
        await puppetFuncs.puppetAction(opts)
        Object.assign(opts, await puppetFuncs.getFsUserSession(db, config.firestore.serviceAccount.userId))
    }

    // call out to find valid auctions
    const baseUrl = `${auctionDetailsConfig.url}?${auctionDetailsConfig.params.auctionId}=`
    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'cookie': opts.cookie,
            'x-csrf-token': opts.csrf
        },
        redirect: 'follow',
    }

    const oops = 'Oops Something went wrong.'
    const goodNumbers = []
    const badNumbers = []

    const promises = []
    for (let i = 0, max = findAuctionsAmount; i < max; i++) {
        const promise = new Promise(async resolve => {
            // cors({}, {}, async () => {
                const auctionNumber = auctionStart + i
                const url = baseUrl + auctionNumber
                console.log('Calling auction', auctionNumber)
                await fetch(url, params)
                    .then(response => response.text().then(r => {
                        if (r.indexOf(oops) > -1) badNumbers.push(auctionNumber)
                        else goodNumbers.push(auctionNumber)
                    }))
                    .catch(error => {
                        console.log(error)
                    })
                resolve()
            // })
        })
        promises.push(promise)
    }
    await Promise.all(promises)

    // save
    const goodSaveDoc = db.collection(fsInfoCollection.name).doc(fsInfoCollection.docs.goodAuctionNumbers.name)
    const badSaveDoc = db.collection(fsInfoCollection.name).doc(fsInfoCollection.docs.badAuctionNumbers.name)
    goodSaveDoc.set({ [goodNums]: (goodSaveDoc.get()[goodNumbers] || []).concat(goodNumbers).sort() })
    badSaveDoc.set({ [badNums]: (badSaveDoc.get()[badNumbers] || []).concat(badNumbers).sort() })

    // crawl auctions
    const now = new Date()
    for (let i = 0, len = goodNumbers.length; i < len; i++) {
        const num = goodNumbers[i]
        const auctionInfo = await puppetFuncs.crawlAuctionInfo(num, opts)
        if (!auctionInfo.hasOwnProperty('name')) {
            console.log('Unable to crawl auction at this time.', num)
            return
        }
        auctionInfo[fsAuctionFields.addDate] = now
        auctionInfo[fsAuctionFields.auctionNumber] = num
        auctionInfo[fsAuctionFields.itemList] = []
        auctionInfo[fsAuctionFields.itemsCrawled] = false
        auctionInfo[fsAuctionFields.sanitized] = false
        await db.collection(fsAuctionsCollection.name).doc(num).set(auctionInfo)
    }
    // goodNumbers.forEach(async num => {
    //     const auctionInfo = await puppetFuncs.crawlAuctionInfo(num, opts)
    //     if (!auctionInfo.hasOwnProperty('name')) {
    //         console.log('Unable to crawl auction at this time.', num)
    //         return
    //     }
    //     auctionInfo[fsAuctionFields.addDate] = now
    //     auctionInfo[fsAuctionFields.auctionNumber] = num
    //     auctionInfo[fsAuctionFields.itemList] = []
    //     auctionInfo[fsAuctionFields.itemsCrawled] = false
    //     auctionInfo[fsAuctionFields.sanitized] = false
    //     await db.collection(fsAuctionsCollection.name).doc(num).set(auctionInfo)
    // })
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