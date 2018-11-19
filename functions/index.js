const express = require('express')
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })
exports.shareable = {
    db: db,
    functions: functions,
    url: 'http://localhost:5000/ezbidfta867/us-central1'
}
// db.enablePersistence().catch(error => {
//     if (error.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
    // } else if (error.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
    // }
// })

exports.test = functions.https.onRequest((req, res) => {
    res.status(200).send('poop')
})

// exports.processNewAuctions = functions.https.onRequest(async (req, res) => {
//         const maxPages = 2
//         let i = 1
//         let total = 0
//         let continueProcessing
//
//         do {
//             const url = auctionsUrl + i
//             continueProcessing = await fetch(url, params).then(response => response.json())
//                 .then(async d => {
//                     const auctionList = d.content
//                     const len = auctionList.length
//                     if (!len) return false
//
//                     total += len
//                     console.log('getAuctionList processing page', i)
//                     return await addAuctionListToFirestore(auctionList)
//                 })
//                 .catch(error => {
//                     console.log('error:', error)
//                     return false
//                 })
//             i++
//         } while (continueProcessing && i < maxPages)
//
//         console.log('getAuctionList processed', i, utils.pluralize('page', i), total, utils.pluralize('auction', total))
//
//         res.status(200).send(JSON.stringify({
//             totalPages: i,
//             totalAuctions: total
//         }))
// })

// function addAuctionListToFirestore(auctionList) {
//     const batchSize = auctionList.length
//     console.log('addAuctionListToFirestore adding', batchSize, utils.pluralize('auction', batchSize))
//
// }

const exapp = express()
const router = express.Router()
router.use('/auctions/', require('./api/auctions/auctions'))
router.use('/items/', require('./api/items/items'))
router.use('/users/', require('./api/users/users'))
exapp.use(router)
exports.api = functions.https.onRequest(exapp)

const puppetApp = express()
const puppetRouter = express.Router()
const puppetOps = { memory: '2GB', timeoutSeconds: 60 }
puppetRouter.use('/puppeteering/', require('./puppeteering'))
puppetApp.use(puppetRouter)
exports.puppeteering = functions.runWith(puppetOps).https.onRequest(puppetApp)

exports.firestoreReactive = require('./firestore-reactive')