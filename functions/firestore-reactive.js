// const shareable = module.parent.shareable
// const firestore = shareable.functions.firestore
// const collections = shareable.config.firestore.collections
//
// exports.onAuctionCreated = firestore
//     .document(collections.auctions.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new auction: ', newValue)
//         // todo - go get all auction.js item info
//     })
//
//
// exports.onItemCreated = firestore
//     .document(collections.items.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new item: ', newValue)
//         // todo - check if user is watching for new item or similar
//     })
//
// exports.onLocationCreated = firestore
//     .document(collections.locations.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new location: ', newValue)
//         // todo - notify users if a new location is in their area
//     })
//
// exports.onUserCreated = firestore
//     .document(collections.users.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new user: ', newValue)
//     })
//
// exports.onUserDeleted = firestore
//     .document(collections.users.fields.id.path)
//     .onDelete((snap, context) => {
//         console.log('deleted user', snap.id, snap.data())
//     })