const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')
const vars = require('./vars')

exports.onAuctionCreated = functions.firestore
    .document(vars.firestore.collections.auctions.fields.id.path)
    .onCreate((snap, context) => {
        const newValue = snap.data()
        console.log('new auction: ', newValue)
        // todo - go get all auction item info
    })


exports.onItemCreated = functions.firestore
    .document(vars.firestore.collections.items.fields.id.path)
    .onCreate((snap, context) => {
        const newValue = snap.data()
        console.log('new item: ', newValue)
        // todo - check if user is watching for new item or similar
    })

exports.onLocationCreated = functions.firestore
    .document(vars.firestore.collections.locations.fields.id.path)
    .onCreate((snap, context) => {
        const newValue = snap.data()
        console.log('new location: ', newValue)
        // todo - notify users if a new location is in their area
    })

exports.onUserCreated = functions.firestore
    .document(vars.firestore.collections.users.fields.id.path)
    .onCreate((snap, context) => {
        const newValue = snap.data()
        console.log('new user: ', newValue)
    })