const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const fetch = require('node-fetch')

admin.initializeApp(functions.config().firebase)

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        res.status(200).send(JSON.stringify('hello world'))
    })
})

exports.getAuctionList = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        console.log(req.body)

        // const url = 'http://bidfta.bidqt.com/BidFTA/services/invoices/WlAuctions/filter?page=1&size=250&sort=endDateTime%20asc'
        const url = 'http://bidfta.bidqt.com/BidFTA/services/invoices/WlAuctions/filter?'

        const data = {
            // q: 'showTimeRemaining=0'
        }

        const params = {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            redirect: 'follow',
            referrer: 'no-referrer',
            body: JSON.stringify(data)
        }

        fetch(url, params).then(response => response.json())
            .then(d => res.status(200).send(d))
            .catch(error => console.log('error:', error));
    })
})