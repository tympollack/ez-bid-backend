const app = require('express')()
const admin = require('firebase-admin')
const functions = require('firebase-functions')
require('firebase/firestore')

admin.initializeApp({
    credential: admin.credential.applicationDefault()
})
const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

app.get('/', async (req, res) => {
    const snap = await db.collection('events').get()
    const itemCount = snap.size
    res.send(itemCount + '')
})

// app.get('/getAuctionFromFirestore', (req, res) => {
//     console.log('/getAuctionFromFirestore', req.body)
//
//     const url = 'https://firestore.googleapis.com/v1beta1/projects/ezbidfta867/databases/(default)/documents/auctions/FGMERJhph1thuJteidDy'
//     const params = {
//         method: 'GET',
//         mode: 'no-cors',
//         cache: 'no-cache',
//         credentials: 'same-origin',
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         redirect: 'follow',
//         referrer: 'no-referrer',
//     }
//
//     fetch(url, params).then(response => response.json())
//         .then(d => res.status(200).send(d))
//         .catch(error => console.log('error:', error))
//     //
//     // fetch(url, params).then(response => res.status(200).send(response))
// })

app.listen(3000)