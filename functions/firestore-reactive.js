const fsFuncs = require('./firestore/fsFuncs')
const { db, functions, utils, vars } = module.parent.shareable
const firestore = functions.firestore

// can also use (snap, context)

exports.onAuctionCreated = firestore
    .document(vars.FS_COLLECTIONS_AUCTIONS.id.path)
    .onCreate(async snap => {
        console.log('new auction: ', snap.id)

        const auction = snap.data()
        const auctionId = auction[vars.FS_AUCTION_AUCTION_NUMBER]

        try {
            await runAdminReportTransaction(adminData => {
                const newCount = (adminData[vars.FS_AR_AUCTION_COUNT] || 0) + 1
                return { [vars.FS_AR_AUCTION_COUNT]: newCount }
            })
            console.log('auction transaction succeeded', auctionId)
        } catch (e) {
            console.error('auction transaction failed', auctionId, e)
        }

        // try {
        //     await db.runTransaction(t => {
        //         const adminDocRef = getAdminReportDocRef()
        //         return t.get(adminDocRef).then(adminDoc => {
        //             const adminData = adminDoc.data() || {}
        //             const newCount = (adminData[vars.FS_AR_AUCTION_COUNT] || 0) + 1
        //             t.update(adminDocRef, { [vars.FS_AR_AUCTION_COUNT]: newCount })
        //         })
        //     })
        //     console.log('auction transaction succeeded', auctionId)
        // } catch (e) {
        //     console.error('auction transaction failed', auctionId, e)
        // }

        return Promise.resolve()
    })

exports.onBidCreated = firestore
    .document(vars.FS_COLLECTIONS_BIDS.id.path)
    .onCreate(async snap => {
        console.log('new bid: ', snap.id)

        const bid = snap.data()
        try {
            await db.runTransaction(async t => {
                const adminDocRef = getAdminReportDocRef()
                return t.get(adminDocRef).then(adminDoc => {
                    const adminData = adminDoc.data() || {}
                    const newCount = (adminData[vars.FS_AR_BID_COUNT] || 0) + 1
                    const newTotalBid = (adminData[vars.FS_AR_TOTAL_BID_AMOUNT] || 0) + bid[vars.FS_BID_AMOUNT]
                    const newAvgBid = utils.roundTo(newTotalBid / newCount, 2)
                    return t.update(getAdminReportDocRef(), {
                        [vars.FS_AR_AVERAGE_BID]: newAvgBid,
                        [vars.FS_AR_BID_COUNT]: newCount,
                        [vars.FS_AR_TOTAL_BID_AMOUNT]: newTotalBid
                    })
                })
            })
            console.log('bid transaction succeeded', snap.id)
        } catch (e) {
            console.error('bid transaction failed', e)
        }

        return Promise.resolve()
    })


exports.onItemCreated = firestore
    .document(vars.FS_COLLECTIONS_ITEMS.id.path)
    .onCreate(async snap => {
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
            await db.runTransaction(t => {
                const adminDocRef = getAdminReportDocRef()
                return t.get(adminDocRef).then(adminDoc => {
                    const adminData = adminDoc.data() || {}
                    const newCount = (adminData[vars.FS_AR_ITEM_COUNT] || 0) + 1
                    t.update(adminDocRef, { [vars.FS_AR_ITEM_COUNT]: newCount })
                })
            })
            console.log('item transaction succeeded', itemId)
        } catch (e) {
            console.error('item transaction failed', itemId, e)
        }

        try {
            await fsFuncs.addBids(bidInfos)
            console.log('bids created for item', itemId)
        } catch (e) {
            console.error('bid creation failed for item', itemId, e)
        }

        return Promise.resolve()

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
//     .document(vars.FS_COLLECTIONS_USERS.id.path)
//     .onCreate(async snap => {
//         console.log('new user: ', snap.id)
//
//         db.runTransaction(async t => {
//             const adminData = await getAdminReportData()
//             const newCount = adminData[vars.FS_AR_USER_COUNT] + 1
//             return t.update(getAdminReportDocRef(), { [vars.FS_AR_USER_COUNT]: newCount })
//         })
//     })

/////////////////////////////////////////////////////////////////////

function runAdminReportTransaction(func, errMsg) {
    return new Promise((resolve, reject) => {
        db.runTransaction(t => {
            const adminDocRef = db.collection(vars.FS_COLLECTIONS_INFO.name).doc(vars.FS_INFO_TYPES.dailyAdminReport)
            return t.get(adminDocRef).then(adminDoc => {
                const adminData = adminDoc.data() || {}
                const newObj = func(adminData)
                t.update(adminDocRef, newObj)
            })
        }).then(resolve, reject)
    })
}

function getAdminReportDocRef() {
    return db.collection(vars.FS_COLLECTIONS_INFO.name).doc(vars.FS_INFO_TYPES.dailyAdminReport)
}