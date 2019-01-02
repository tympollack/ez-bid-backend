const fsFuncs = require('./firestore/fsFuncs')
const { db, functions, utils, vars } = module.parent.shareable
const firestore = functions.firestore

const collRef = db.collection(vars.FS_COLLECTIONS_INFO.name)

exports.onAuctionCreated = firestore
    .document(vars.FS_COLLECTIONS_AUCTIONS.id.path)
    .onCreate((snap, context) => {
        console.log('new auction: ', snap.id)

        return executeOnce(snap, context, t => {
            const docRef = collRef.doc(vars.FS_IT_AUCTION_STATS)
            return t
                .get(docRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_AUCTION_COUNT] || 0) + 1
                    t.update(docRef, { [vars.FS_AR_AUCTION_COUNT]: newCount })
                })
                .catch(e => { console.log('auction transaction failed:', e) })
        })
    })

exports.onBidCreated = firestore
    .document(vars.FS_COLLECTIONS_BIDS.id.path)
    .onCreate((snap, context) => {
        console.log('new bid: ', snap.id)

        const bid = snap.data()

        return executeOnce(snap, context, t => {
            const docRef = collRef.doc(vars.FS_IT_BID_STATS)
            return t
                .get(docRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_BID_COUNT] || 0) + 1
                    const newTotalBid = utils.roundTo((data[vars.FS_AR_TOTAL_BID_AMOUNT] || 0) + bid[vars.FS_BID_AMOUNT], 2)
                    const newAvgBid = utils.roundTo(newTotalBid / newCount, 2)
                    t.update(docRef, {
                        [vars.FS_AR_AVERAGE_BID]: newAvgBid,
                        [vars.FS_AR_BID_COUNT]: newCount,
                        [vars.FS_AR_TOTAL_BID_AMOUNT]: newTotalBid
                    })
                })
                .catch(e => { console.log('bid transaction failed:', e) })
        })
    })


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

        return executeOnce(snap, context, t => {
            const docRef = collRef.doc(vars.FS_IT_ITEM_STATS)
            return t
                .get(docRef)
                .then(doc => {
                    const data = doc.data()
                    const oldCount = data[vars.FS_AR_ITEM_COUNT] || 0
                    const newCount = oldCount + 1
                    console.log(`updating item count from ${oldCount} to ${newCount}`)
                    t.update(docRef, { [vars.FS_AR_ITEM_COUNT]: newCount })
                })
                .catch(e => { console.log('item transaction failed:', e) })
        })

        // todo - check if user is watching for new item or similar
    })

exports.onLocationCreated = firestore
    .document(vars.FS_COLLECTIONS_LOCATIONS.id.path)
    .onCreate((snap, context) => {
        console.log('new location: ', snap.id)

        return executeOnce(snap, context, t => {
            const docRef = collRef.doc(vars.FS_IT_LOCATION_STATS)
            return t
                .get(docRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_LOCATION_COUNT] || 0) + 1
                    t.update(docRef, { [vars.FS_AR_LOCATION_COUNT]: newCount })
                })
                .catch(e => { console.log('auction transaction failed:', e) })
        })

        // todo - notify users if a new location is in their area
    })

exports.onUserCreated = firestore
    .document(vars.FS_COLLECTIONS_USERS.id.path)
    .onCreate((snap, context) => {
        console.log('new user: ', snap.id)

        return executeOnce(snap, context, t => {
            const docRef = collRef.doc(vars.FS_IT_USER_STATS)
            return t
                .get(docRef)
                .then(doc => {
                    const data = doc.data()
                    const newCount = (data[vars.FS_AR_USER_COUNT] || 0) + 1
                    t.update(docRef, { [vars.FS_AR_USER_COUNT]: newCount })
                })
                .catch(e => { console.log('auction transaction failed:', e) })
        })
    })

/////////////////////////////////////////////////////////////////////

function executeOnce(change, context, task) {
    const eventRef = db.collection(vars.FS_COLLECTIONS_EVENTS.name).doc(context.eventId)
    return db.runTransaction(t =>
        t.get(eventRef)
            .then(docSnap => (docSnap.exists ? null : task(t)))
            .then(() => t.set(eventRef, {
                processed: true,
                processDate: new Date()
            }))
    )
}