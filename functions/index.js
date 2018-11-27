const config = require('./config/config').get()
const express = require('express')
const cors = require('cors')({ origin: true })
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const utils = require('./utils')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

exports.shareable = module.shareable = {
    config: config,
    db: db,
    functions: functions,
    productPicturesBucket: {
        name: config.datastore.buckets.productPictures,
        bucket: admin.storage().bucket(config.datastore.buckets.productPictures)
    },
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
router.use('/users/', require('./api/users/users'))
exapp.use(router)
exapp.use(utils.tryCatchAsync)
exports.api = functions.https.onRequest(exapp)

const puppetApp = express()
const puppetRouter = express.Router()
const puppetOps = { memory: '2GB', timeoutSeconds: 60 }
puppetRouter.use('/puppeteering/', require('./puppeteering'))
puppetApp.use(puppetRouter)
exports.puppeteering = functions.runWith(puppetOps).https.onRequest(puppetApp)

exports.firestoreReactive = require('./firestore-reactive')

exports.app = require('./auth')

exports.resizeImages = require('./resize-images')

exports.cron = require('./pubsub/listeners')

exports.testFindAuctions = functions.https.onRequest(async (req, res) => {
    const csrf = 'ce7d59aa-1a43-48c3-9662-e43d738bb495'
    const cookie = 'JSESSIONID=A563C94331B2B754A5623FC143A32A3C;' +
        'AWSALB=ZZ5VEXYtk2xw4ZVPFaMxHYNYU6sav5tcvrrg6Owf9C83jCBWJtJLqw+M1045qNzAI6lSG7V8QuhlhV6rIxUyJXGKP7WsQpRd7E2BLcFjfmS8mdSbENoq9dktmjri'

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