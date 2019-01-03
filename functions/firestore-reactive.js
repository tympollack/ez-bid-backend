const fsFuncs = require('./firestore/fsFuncs')
const { db, functions, utils, vars } = module.parent.shareable
const firestore = functions.firestore

const infoCollRef = db.collection(vars.FS_COLLECTIONS_INFO.name)
const auctionStatsRef = infoCollRef.doc(vars.FS_IT_AUCTION_STATS)
const bidStatsRef = infoCollRef.doc(vars.FS_IT_BID_STATS)
const itemStatsRef = infoCollRef.doc(vars.FS_IT_ITEM_STATS)
const locStatsRef = infoCollRef.doc(vars.FS_IT_LOCATION_STATS)
const userStatsRef = infoCollRef.doc(vars.FS_IT_USER_STATS)

const locCollRef = db.collection(vars.FS_COLLECTIONS_LOCATIONS.name)

exports.onAuctionCreated = firestore
    .document(vars.FS_COLLECTIONS_AUCTIONS.id.path)
    .onCreate((snap, context) => {
        console.log('new auction: ', snap.id)

        return executeOnce('auction created', snap, context, async t => {
            const promises = []
            const auction = snap.data()
            const auctionId = auction[vars.FS_AUCTION_AUCTION_NUMBER]
            const auctionAddress = auction[vars.FS_AUCTION_LOCATION_ADDRESS]
            let geocodeError

            const potLocRef = await locCollRef.where(vars.FS_LOC_FTA_ADDRESS, '==', auctionAddress).get()
            let potLocExists = false
            potLocRef.forEach(() => { potLocExists = true })
            if (!potLocExists) {
                console.log('should not get here!!!')
                try {
                    const resp = await utils.geocodeAddress(auctionAddress)
                    const results = resp.json.results[0]
                    const locDocRef = locCollRef.doc(results.place_id)

                    promises.push(
                        t.get(locDocRef)
                            .then(() => {
                                t.set(locDocRef, {
                                    [vars.FS_LOC_FTA_ADDRESS]: auctionAddress,
                                    ...results
                                })
                            })
                            .catch(e => {
                                console.log('auction transaction failed:', e)
                            })
                    )
                } catch (e) {
                    console.log(e)
                    geocodeError = e
                }
            }

            promises.push(
                t.get(auctionStatsRef)
                    .then(doc => {
                        const data = doc.data()
                        const newCount = (data[vars.FS_AR_AUCTION_COUNT] || 0) + 1
                        const newErrorList = (data[vars.FS_AR_FAILED_GEOCODING] || [])

                        if (geocodeError) newErrorList.push({auctionId: auctionId, message: geocodeError.message})

                        t.update(auctionStatsRef, {
                            [vars.FS_AR_AUCTION_COUNT]: newCount,
                            [vars.FS_AR_FAILED_GEOCODING]: newErrorList
                        })
                    })
                    .catch(e => {
                        console.log('auction transaction failed:', e)
                    })
            )

            return Promise.all(promises)
        })
    })

// exports.onBidCreated = firestore
//     .document(vars.FS_COLLECTIONS_BIDS.id.path)
//     .onCreate((snap, context) => {
//         console.log('new bid: ', snap.id)
//
//         const bid = snap.data()
//
//         return executeOnce('bid created', snap, context, t => {
//             return t
//                 .get(bidStatsRef)
//                 .then(doc => {
//                     const data = doc.data()
//                     const newCount = (data[vars.FS_AR_BID_COUNT] || 0) + 1
//                     const newTotalBid = utils.roundTo((data[vars.FS_AR_TOTAL_BID_AMOUNT] || 0) + bid[vars.FS_BID_AMOUNT], 2)
//                     const newAvgBid = utils.roundTo(newTotalBid / newCount, 2)
//                     t.update(bidStatsRef, {
//                         [vars.FS_AR_AVERAGE_BID]: newAvgBid,
//                         [vars.FS_AR_BID_COUNT]: newCount,
//                         [vars.FS_AR_TOTAL_BID_AMOUNT]: newTotalBid
//                     })
//                 })
//                 .catch(e => {
//                     console.log('bid transaction failed:', e)
//                 })
//         })
//     })


exports.onItemCreated = firestore
    .document(vars.FS_COLLECTIONS_ITEMS.id.path)
    .onCreate(async (snap, context) => {
        console.log('new item: ', snap.id)

        const item = snap.data()
        const itemId = item.id
        const bidInfos = []
        const bids = item[vars.FS_ITEM_BIDS]
        const auctionId = item[vars.FS_ITEM_AUCTION_ID]
        bids.forEach(bid => {
            bidInfos.push({
                [vars.FS_BID_AMOUNT]: bid.bidAmount,
                [vars.FS_BID_BIDDER_ID]: bid.bidderId,
                [vars.FS_BID_DATE]: bid.bidDate,
                [vars.FS_BID_ITEM_ID]: itemId,
                [vars.FS_BID_AUCTION_ID]: auctionId,
            })
        })

        try {
            await fsFuncs.addBids(bidInfos)
            console.log('bids created for item', itemId)
        } catch (e) {
            console.error('bid creation failed for item', itemId, e)
        }

        return executeOnce('item created', snap, context, t => {
            return t
                .get(itemStatsRef)
                .then(doc => {
                    const data = doc.data()
                    const oldCount = data[vars.FS_AR_ITEM_COUNT] || 0
                    const newCount = oldCount + 1
                    console.log(`updating item count from ${oldCount} to ${newCount}`)
                    t.update(itemStatsRef, {[vars.FS_AR_ITEM_COUNT]: newCount})
                })
                .catch(e => {
                    console.log('item transaction failed:', e)
                })
        })

        // todo - check if user is watching for new item or similar
    })

exports.onLocationCreated = firestore
    .document(vars.FS_COLLECTIONS_LOCATIONS.id.path)
    .onCreate((snap, context) => {
        console.log('new location: ', snap.id)

        return executeOnce('location created', snap, context, t => {
            return t
                .get(locStatsRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_LOCATION_COUNT] || 0) + 1
                    t.update(locStatsRef, {[vars.FS_AR_LOCATION_COUNT]: newCount})
                })
                .catch(e => {
                    console.log('auction transaction failed:', e)
                })
        })

        // todo - notify users if a new location is in their area
    })

exports.onUserCreated = firestore
    .document(vars.FS_COLLECTIONS_USERS.id.path)
    .onCreate((snap, context) => {
        console.log('new user: ', snap.id)

        return executeOnce('user created', snap, context, t => {
            return t
                .get(userStatsRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_USER_COUNT] || 0) + 1
                    t.update(userStatsRef, {[vars.FS_AR_USER_COUNT]: newCount})
                })
                .catch(e => {
                    console.log('auction transaction failed:', e)
                })
        })
    })

/////////////////////////////////////////////////////////////////////

function executeOnce(type, change, context, task) {
    const eventRef = db.collection(vars.FS_COLLECTIONS_EVENTS.name).doc(context.eventId)
    return db.runTransaction(t =>
        t.get(eventRef)
            .then(docSnap => (docSnap.exists ? null : task(t)))
            .then(() => t.set(eventRef, {
                type: type,
                processDate: new Date(),
                processed: true
            }))
    )
}