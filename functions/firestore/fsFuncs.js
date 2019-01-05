const moment = require('moment')
const db = require('../firestore/init')
const utils = require('../utils')
const vars = require('../vars')

exports.fsGetObjectById = async (collectionName, id) => {
    const docRef = await this.fsGetDocById(collectionName, id + '')
    const doc = await docRef.get()
    return doc.data()
}

exports.fsGetDocById = async (collectionName, id) => {
    return await db.collection(collectionName).doc(id + '')
}

exports.getFsUserSession = async userId => {
    const user = await this.fsGetObjectById(vars.FS_COLLECTIONS_USERS.name, userId)
    if (!user) {
        return
    }

    return {
        userId: userId,
        bidnum: user[vars.FS_USER_BIDNUM],
        bidpw: user[vars.FS_USER_BIDPW],
        session: user[vars.FS_USER_SESSION]
    }
}

exports.findHighestGoodAuction = async () => {
    const auctionsSnap = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name)
        .orderBy(vars.FS_AUCTION_AUCTION_NUMBER, 'desc')
        .limit(1)
        .get()

    let ret = {}
    auctionsSnap.forEach(doc => {
        ret = doc.data()
    })
    return ret
}

exports.findHighestNonItemCrawledAuction = async() => {
    const auctionsSnap = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name)
        .where(vars.FS_AUCTION_ITEMS_CRAWLED, '==', false)
        .orderBy(vars.FS_AUCTION_AUCTION_NUMBER, 'desc')
        .limit(1)
        .get()

    let ret = {}
    auctionsSnap.forEach(doc => {
        ret = doc.data()
    })
    return ret
}

exports.getUnusedAuctionNumbersDoc = async () => {
    return await this.fsGetDocById(vars.FS_COLLECTIONS_INFO.name, vars.FS_INFO_TYPES.badAuctionNum)
}

exports.getUnusedAuctionNumbers = async () => {
    const docRef = await this.getUnusedAuctionNumbersDoc()
    const doc = await docRef.get()
    return (doc.data() || {})[vars.FS_INFO_VALUE]
}

exports.addUnusedAuctionNumber = async num => {
    const docRef = await this.getUnusedAuctionNumbersDoc()
    const doc = await docRef.get()
    const obj = doc.data()
    const badNums = obj ? obj[vars.FS_INFO_VALUE] : []
    console.log('for badnum', num)
    console.log('badnums before', badNums)
    if (badNums.indexOf(num) === -1) {
        badNums.push(num)
        docRef.set({ [vars.FS_INFO_VALUE]: badNums })
    }
    console.log('badnums after', badNums)
    return badNums
}

exports.setUnusedAuctionNumbers = async badNums => {
    const docRef = await this.getUnusedAuctionNumbersDoc()
    docRef.set({ [vars.FS_INFO_VALUE]: badNums })
}

exports.addAuctions = async auctionInfos => {
    const collRef = db.collection(vars.FS_COLLECTIONS_AUCTIONS.name)
    const batch = db.batch()
    auctionInfos.forEach(info => {
        const docRef = collRef.doc(info[vars.FS_AUCTION_AUCTION_NUMBER] + '')
        batch.set(docRef, info)
    })
    return await batch.commit()
}

exports.addItems = async itemInfos => {
    if (!itemInfos.length) return Promise.reject('No items to add.')
    const collRef = db.collection(vars.FS_COLLECTIONS_ITEMS.name)
    const batch = db.batch()
    itemInfos.forEach(info => {
        const docRef = collRef.doc(info[vars.FS_ITEM_ID] + '')
        batch.set(docRef, info)
    })
    return await batch.commit()
}

exports.addBids = async bidInfos => {
    if (!bidInfos.length) return Promise.reject('No bids to add.')
    const collRef = db.collection(vars.FS_COLLECTIONS_BIDS.name)

    const batch = db.batch()
    bidInfos.forEach(info => {
        const docId = `${info[vars.FS_BID_ITEM_ID]}_${info[vars.FS_BID_BIDDER_ID]}_${info[vars.FS_BID_AMOUNT]}`
        const docRef = collRef.doc(docId)
        batch.set(docRef, info)
    })
    return await batch.commit()
}

exports.countFSObjects = async collectionName => {
    if (!collectionName) return Promise.reject('Need collection name.')
    const snap = await db.collection(collectionName).get()
    return snap.size
}

exports.generateFSReport = async shouldSave => {
    console.log('Generating firestore report.')

    const promises = []
    const info = { [vars.FS_AR_TIME]: new Date() }
    const collName = vars.FS_COLLECTIONS_INFO.name
    Object.values(vars.FS_INFO_TYPES).forEach(docId => {
        if (docId.indexOf('_STATS') === -1) return

        promises.push(new Promise(async resolve => {
            info[docId] = await this.fsGetObjectById(collName, docId)
            resolve()
        }))
    })
    await Promise.all(promises)

    if (shouldSave) {
        const doc = await this.fsGetDocById(vars.FS_COLLECTIONS_INFO.name, vars.FS_INFO_TYPES.dailyAdminReport)
        await doc.collection(vars.FS_INFO_TYPES.dailyAdminReport).add(info)
    }
    return info
}

exports.deleteCollection = async (collectionName, ownerDoc) => {
    const collRef = (ownerDoc || db).collection(collectionName)
    const snap = await collRef.get()

    const promises = []
    snap.forEach(doc => {
        promises.push(utils.newPromise(() => { return collRef.doc(doc.id).delete() }))
    })
    return await Promise.all(promises)
}

exports.deleteCollections = async (collectionNames, ownerDoc) => {
    const promises = []
    collectionNames.forEach(collectionName => {
        promises.push(utils.newPromise(() => {
            return this.deleteCollection(collectionName, ownerDoc)
                .then(() => { console.log(`collection ${collectionName} cleared`) })
        }))
    })
    return await Promise.all(promises)
}

exports.clearStats = async (statDocIds, deleteExistingReports) => {
    const infoCollRef = db.collection(vars.FS_COLLECTIONS_INFO.name)
    const promises = []

    if (deleteExistingReports)
        promises.push(utils.newPromise(async () => {
            const doc = await this.fsGetDocById(vars.FS_COLLECTIONS_INFO.name, vars.FS_IT_DAILY_ADMIN_REPORT)
            return this.deleteCollection(vars.FS_COLLECTIONS_DAILY_ADMIN_REPORT.name, doc)
                .then(() => { console.log('existing admin reports removed') })
        }))

    statDocIds.forEach(statDocId => {
        switch (statDocId) {
            case vars.FS_IT_AUCTION_STATS:
                promises.push(utils.newPromise(() => {
                    return infoCollRef
                        .doc(vars.FS_IT_AUCTION_STATS)
                        .update({
                            [vars.FS_AR_AUCTION_COUNT]: 0,
                            [vars.FS_AR_FAILED_GEOCODING]: []
                        })
                        .then(() => {
                            console.log(statDocId, 'reset')
                        })
                }))
                break

            case vars.FS_IT_BID_STATS:
                promises.push(utils.newPromise(() => {
                    return infoCollRef
                        .doc(vars.FS_IT_BID_STATS)
                        .update({
                            [vars.FS_AR_BID_COUNT]: 0,
                            [vars.FS_AR_AVERAGE_BID]: 0,
                            [vars.FS_AR_TOTAL_BID_AMOUNT]: 0
                        })
                        .then(() => {
                            console.log(statDocId, 'reset')
                        })
                }))
                break

            case vars.FS_IT_ITEM_STATS:
                promises.push(utils.newPromise(() => {
                    return infoCollRef
                        .doc(vars.FS_IT_ITEM_STATS)
                        .update({[vars.FS_AR_ITEM_COUNT]: 0})
                        .then(() => {
                            console.log(statDocId, 'reset')
                        })
                }))
                break

            case vars.FS_IT_LOCATION_STATS:
                promises.push(utils.newPromise(() => {
                    return infoCollRef
                        .doc(vars.FS_IT_LOCATION_STATS)
                        .update({[vars.FS_AR_LOCATION_COUNT]: 0})
                        .then(() => {
                            console.log(statDocId, 'reset')
                        })
                }))
                break

            case vars.FS_IT_USER_STATS:
                promises.push(utils.newPromise(() => {
                    return infoCollRef
                        .doc(vars.FS_IT_USER_STATS)
                        .update({[vars.FS_AR_USER_COUNT]: 0})
                        .then(() => {
                            console.log(statDocId, 'reset')
                        })
                }))
                break
        }
    })

    return await Promise.all(promises)
}

exports.resetAuctionsNotYetFullyCrawled = async () => {
    const auctionCollRef = db.collection(vars.FS_COLLECTIONS_AUCTIONS.name)
    const auctionRefs = await auctionCollRef
        .where(vars.FS_AUCTION_ITEMS_CRAWLED, '==', true)
        .get()

    const auctionsWithTooFewItems = []
    auctionRefs.forEach(doc => {
        const auction = doc.data()
        const auctionNumber = auction[vars.FS_AUCTION_AUCTION_NUMBER]
        const numItems = auction[vars.FS_AUCTION_NUM_ITEMS]
        const itemList = auction[vars.FS_AUCTION_ITEM_LIST]
        const len = itemList.length
        if (len < numItems) {
            auctionsWithTooFewItems.push({
                [vars.FS_AUCTION_AUCTION_NUMBER]: auctionNumber,
                [vars.FS_AUCTION_NUM_ITEMS]: numItems,
                [vars.FS_AUCTION_ITEM_LIST]: len
            })
            auctionCollRef.doc(doc.id).update({ [vars.FS_AUCTION_ITEMS_CRAWLED]: false })
        }
    })

    return {
        count: auctionsWithTooFewItems.length,
        results: auctionsWithTooFewItems
    }
}

exports.initLocationCollection = async () => {
    const promises = []
    const locCollRef = db.collection(vars.FS_COLLECTIONS_LOCATIONS.name)
    const locations = await locCollRef.get()
    const locAddresses = []

    locations.forEach(locDoc => {
        locAddresses.push(locDoc.data()[vars.FS_LOC_FTA_ADDRESS])
    })

    const auctions = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name).get()

    auctions.forEach(auctionDoc => {
        const auction = auctionDoc.data()
        const auctionAddress = auction[vars.FS_AUCTION_LOCATION_ADDRESS]

        if (locAddresses.indexOf(auctionAddress) === -1) {
            locAddresses.push(auctionAddress)
            promises.push(utils.newPromise(async () => {
                const resp = await utils.geocodeAddress(auctionAddress)
                const results = resp.json.results[0]
                const locId = results.place_id

                await locCollRef
                    .doc(locId)
                    .set({
                        [vars.FS_LOC_FTA_ADDRESS]: auctionAddress,
                        ...results
                    })
            }))
        }
    })

    return Promise.all(promises)
}

exports.initBidCollection = async () => {
    const promises = []
    const itemCollRef = db.collection(vars.FS_COLLECTIONS_ITEMS.name)
    const limit = 25
    let numItems = 0, numBids = 0, totalBid = 0
    const oldStats = await this.fsGetObjectById(vars.FS_COLLECTIONS_INFO.name, vars.FS_IT_BID_STATS)
    const startingAuction = oldStats.lastAuctionId + 1
    const endingAuction = startingAuction + limit - 1

    console.log(`processing items for auctions ${startingAuction} - ${endingAuction}`)
    for (let auctionId = startingAuction; auctionId <= endingAuction; auctionId++) {
        promises.push(utils.newPromise(async () => {
            const items = await itemCollRef
                .where(vars.FS_ITEM_AUCTION_ID, '==', auctionId)
                .get()

            items.forEach(itemDoc => {
                numItems++
                const item = itemDoc.data()
                const itemId = item.id
                const bidInfos = []
                const bids = item[vars.FS_ITEM_BIDS]
                bids.forEach(bid => {
                    const amt = bid.bidAmount
                    numBids++
                    totalBid += amt
                    bidInfos.push({
                        [vars.FS_BID_AMOUNT]: amt,
                        [vars.FS_BID_BIDDER_ID]: bid.bidderId,
                        [vars.FS_BID_DATE]: bid.bidDate,
                        [vars.FS_BID_ITEM_ID]: itemId,
                        [vars.FS_BID_AUCTION_ID]: auctionId,
                    })
                })

                promises.push(utils.newPromise(() => {
                    return this.addBids(bidInfos)
                        .catch(e => {
                            if (e !== 'No bids to add.') console.log(e)
                        })
                }))
            })
            return Promise.resolve()
        }))
    }

    await Promise.all(promises)

    console.log(`added ${numBids} new bids from ${numItems} items in ${limit} auctions`)
    const newNumBids = oldStats[vars.FS_AR_BID_COUNT] + numBids
    const newBidTotal = utils.roundTo(oldStats[vars.FS_AR_TOTAL_BID_AMOUNT] + totalBid, 2)
    const stats = {
        [vars.FS_AR_BID_COUNT]: newNumBids,
        [vars.FS_AR_TOTAL_BID_AMOUNT]: newBidTotal,
        [vars.FS_AR_AVERAGE_BID]: utils.roundTo(newBidTotal / newNumBids, 2),
        lastAuctionId: endingAuction
    }
    await db.collection(vars.FS_COLLECTIONS_INFO.name)
        .doc(vars.FS_IT_BID_STATS)
        .set(stats)

    return stats
}

exports.changeAllBidAmountsToNumbers = async () => {
    const promises = []
    const itemCollRef = db.collection(vars.FS_COLLECTIONS_ITEMS.name)
    const auctions = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name).get()
    let numNum = 0, numStr = 0
    const stringList = []

    auctions.forEach(auctionDoc => {
        promises.push(utils.newPromise(async() => {
            const auction = auctionDoc.data()

            const items = await itemCollRef
                .where(vars.FS_ITEM_AUCTION_ID, '==', auction[vars.FS_AUCTION_AUCTION_NUMBER])
                .get()

            items.forEach(itemDoc => {
                const item = itemDoc.data()
                const itemId = item.id
                const bids = item[vars.FS_ITEM_BIDS]
                const auctionId = item[vars.FS_ITEM_AUCTION_ID]
                let shouldUpdate = false
                bids.forEach(bid => {
                    const amt = bid.bidAmount
                    const t = typeof amt
                    if (t !== 'number'){
                        const dateAdded = new Date(item[vars.FS_ITEM_ADD_DATE]._seconds * 1000)
                        stringList.push(`${t} ${auctionId} ${itemId} ${amt} ${dateAdded}`)
                        numStr++
                        shouldUpdate = true
                        bid.bidAmount = parseFloat(amt)
                    } else numNum++
                })

                if (shouldUpdate) promises.push(utils.newPromise(() => {
                    return itemCollRef.doc(itemDoc.id).update({ [vars.FS_ITEM_BIDS]: bids })
                }))
            })
        }))
    })

    await Promise.all(promises)

    return {
        numNum: numNum,
        numStr: numStr,
        stringList: stringList
    }
}

exports.removeOldEvents = async () => {
    const mo = moment().subtract(60, 'minutes')
    const time = new Date(mo)
    const collRef = db.collection(vars.FS_COLLECTIONS_EVENTS.name)
    const snap = await collRef
        .where('processDate', '<', time)
        .get()

    const promises = []
    snap.forEach(doc => {
        promises.push(utils.newPromise(() => { return collRef.doc(doc.id).delete() }))
    })
    await Promise.all(promises)
    const message = `${promises.length} events deleted`
    console.log(message)
    return message
}

exports.getMaxNumberOfBids = async () => {
    const snap = await db.collection(vars.FS_COLLECTIONS_ITEMS.name).get()
    let maxBidSize = 0
    snap.forEach(doc => {
        const item = doc.data()
        const bids = item[vars.FS_ITEM_BIDS]
        const len = bids.length
        if (len > maxBidSize) maxBidSize = len
    })
    return maxBidSize
}