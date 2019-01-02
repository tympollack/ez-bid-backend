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
    // bidInfos.forEach(info => {
    //     const docId = `${info[vars.FS_BID_ITEM_ID]}_${info[vars.FS_BID_BIDDER_ID]}_${info[vars.FS_BID_AMOUNT]}`
    //     collRef.doc(docId).set(info)
    // })

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
    let info = { [vars.FS_AR_TIME]: new Date() }
    const collName = vars.FS_COLLECTIONS_INFO.name
    vars.FS_INFO_TYPES.forEach(docId => {
        if (docId.indexOf('_STATS') === -1) return

        promises.push(new Promise(async resolve => {
            const statsObj = await this.fsGetObjectById(collName, docId)
            info = { ...info, ...statsObj }
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
                        .update({[vars.FS_AR_AUCTION_COUNT]: 0})
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