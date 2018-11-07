const express = require('express')
const cors = require('cors')({ origin: true })
const fetch = require('node-fetch')

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const utils = require('./utils')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })
exports.db = db
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
exports.api = {
    auction: require('./api/auction'),
    item: require('./api/item'),
    user: require('./api/user'),
}
exports.firestoreReactive = require('./firestoreReactive')


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////   HELPERS   ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

exports.test = functions.https.onRequest((req, res) => {
    res.status(200).send('poop')
})

exports.testBeta = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const url = 'https://beta.bidfta.com/bidfta/getUpdateItems'
        const params = {
            _csrf: '9283accd-8f81-43d8-abc4-b3fea7e4487d',
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'cookie': 'JSESSIONID=33550E49F4F44FC10A9BCB6ECA5925A5',
                'x-csrf-token': '9283accd-8f81-43d8-abc4-b3fea7e4487d',
                'x-requested-with': 'XMLHttpRequest'
            },
            redirect: 'follow',
            referrer: 'no-referrer',
            // body: {'idBidders':'5195','idItems':[108844],'idauctions':0}
            body: JSON.stringify({'idBidders':'5195','idItems':[108844],'idauctions':0})
        }

        fetch(url, params).then(response => {
            const contentType = response.headers.get("content-type")
            if(contentType && contentType.includes("application/json")) {
                const ret = JSON.stringify(response.json())
                console.log('json', ret)
                return ret
            }
            const ret = response.text()
            console.log('text', ret)
            return ret
        })
                .then(d => {
                    res.status(200).send(d)
                })
            .catch(error => {
                console.log('error:', error)
                res.status(200).send(error)
            })
        // fetch(url, params).then(response => res.status(200).send(response))
    })
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
                .then(async d => {
                    const auctionList = d.content
                    const len = auctionList.length
                    if (!len) return false

                    total += len
                    console.log('getAuctionList processing page', i)
                    return await addAuctionListToFirestore(auctionList)
                })
                .catch(error => {
                    console.log('error:', error)
                    return false
                })
            i++
        } while (continueProcessing && i < maxPages)

        console.log('getAuctionList processed', i, utils.pluralize('page', i), total, utils.pluralize('auction', total))

        res.status(200).send(JSON.stringify({
            totalPages: i,
            totalAuctions: total
        }))
    })
})

function addAuctionListToFirestore(auctionList) {
    const batchSize = auctionList.length
    console.log('addAuctionListToFirestore adding', batchSize, utils.pluralize('auction', batchSize))

}