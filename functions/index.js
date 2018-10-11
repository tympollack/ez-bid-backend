const express = require('express')
const cors = require('cors')({ origin: true })
const fetch = require('node-fetch')

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

admin.initializeApp(functions.config().firebase)

const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })
// db.enablePersistence().catch(error => {
//     if (error.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
    // } else if (error.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
    // }
// })

exports.puppeteering = require('./puppeteering')
exports.firestoreReactive = require('./firestoreReactive')


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////   HELPERS   ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

const app = express()
app.use(cors)

app.get('/:id', (req, res) => res.send('got test ' + req.params.id))
app.post('/', (req, res) => res.send('posted'))

exports.user = functions.https.onRequest(app)

exports.test = functions.https.onRequest((req, res) => {
    res.status(200).send('poop')
})

// exports.user = functions.https.onRequest((req, res) => {
    // // console.log(req)
    //
    // switch(req.method) {
    //     case 'GET':
    //         user__get()
    //         res.status(200).send(req.url)
    //         break
    //     case 'POST':
    //         res.status(200).send('posted')
    //         break
    //     default:
    //         res.status(404).send()
    // }
    // const username = 'testfoo'
    // const userDoc = db.collection('users').doc(username)
    // userDoc.get().then(user => {
    //     if (user.exists) {
    //         const error = 'User already exists: ' + username
    //         console.error('testAddtoFirestore user already exists', error)
    //         res.status(200).send(error)
    //         return
    //     }
    //
    //     userDoc.set({
    //         id: username,
    //         name: 'poop'
    //     }).then(docRef => {
    //         console.log('testAddToFirestore document written with id', docRef)
    //         res.status(200).send(JSON.stringify(docRef))
    //     }).catch(error => {
    //         console.error('testAddToFirestore error adding document', error)
    //         res.status(200).send('Error adding user ' + username)
    //     })
    // })
// })



///////////////////////////////////////////////////////////////////////////////////
/////////////////////   OUTSIDE INTERACTION   /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

// const data = {
//     q: 'showTimeRemaining=0'
// }

exports.processNewAuctions = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        console.log(req.body)

        const auctionsUrl = 'http://bidfta.bidqt.com/BidFTA/services/invoices/WlAuctions/filter?sort=createdTs%20desc&size=2&page='
        const params = {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            redirect: 'follow',
            referrer: 'no-referrer'
        }

        const maxPages = 2
        let i = 1
        let total = 0
        let continueProcessing

        do {
            const url = auctionsUrl + i
            continueProcessing = await fetch(url, params).then(response => response.json())
                .then(d => {
                    const auctionList = d.content
                    if (!auctionList.length) return false

                    total += auctionList.length
                    console.log('getAuctionList processing page', i)
                    addAuctionListToFirestore(auctionList)
                    return true
                })
                .catch(error => {
                    console.log('error:', error)
                    return false
                })
            i++
        } while (continueProcessing && i < maxPages)

        console.log('getAuctionList processed', i, plural('page', i), total, plural('auction', total))

        res.status(200).send(JSON.stringify({
            totalPages: i,
            totalAuctions: total
        }))
    })
})

function plural(noun, count) {
    return count === 1 ? noun : (noun + 's')
}

function addAuctionListToFirestore(auctionList) {
    const batchSize = auctionList.length
    console.log('addAuctionListToFirestore adding', batchSize, plural('auction', batchSize))

}