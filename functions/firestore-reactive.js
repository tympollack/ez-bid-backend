const fsFuncs = require('./firestore/fsFuncs')
const { functions, vars } = module.parent.shareable
const firestore = functions.firestore

// exports.onAuctionCreated = firestore
//     .document(collections.auctions.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new auction: ', newValue)
//     })


exports.onItemCreated = firestore
    .document(vars.FS_FIELDS_ITEM.id.path)
    .onCreate((snap, context) => {
        console.log('new test item: ', snap.id)

        const item = snap.data()
        const itemId = item.id
        const bidInfos = []
        const bids = item[vars.FS_ITEM_BIDS]
        const auctionId = item[vars.FS_ITEM_AUCTION_ID]
        console.log(bids)
        bids.forEach(bid => {
            bidInfos.push({
                [vars.FS_BID_AMOUNT]: bid.bidAmount,
                [vars.FS_BID_BIDDER_ID]: bid.bidderId,
                [vars.FS_BID_DATE]: bid.bidDate,
                [vars.FS_BID_ITEM_ID]: itemId,
                [vars.FS_BID_AUCTION_ID]: auctionId,
            })
        })

        fsFuncs.addBids(bidInfos)
            .then(() => { console.log('bids created for item', itemId) })
            .catch(e => { console.log('bid creation failed for item', itemId, e)})

        // todo - check if user is watching for new item or similar
    })

// exports.onLocationCreated = firestore
//     .document(collections.locations.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new location: ', newValue)
//         // todo - notify users if a new location is in their area
//     })

// exports.onUserCreated = firestore
//     .document(collections.users.fields.id.path)
//     .onCreate((snap, context) => {
//         const newValue = snap.data()
//         console.log('new user: ', newValue)
//     })