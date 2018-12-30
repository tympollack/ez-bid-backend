const db = require('../firestore/init')
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
    const counts = {}
    const collections = [
        vars.FS_COLLECTIONS_AUCTIONS,
        vars.FS_COLLECTIONS_BIDS,
        vars.FS_COLLECTIONS_ITEMS,
        vars.FS_COLLECTIONS_USERS
    ]

    const promises = []
    collections.forEach(collection => {
        promises.push(new Promise(async resolve => {
            const collectionName = collection.name
            const count = await this.countFSObjects(collectionName)
            counts[collectionName] = count
            console.log(`${count} ${collectionName} reported`)
            resolve()
        }))
    })
    await Promise.all(promises)

    const info = {
        [vars.FS_INFO_ADMIN_REPORT]: new Date(),
        [vars.FS_AR_FIRESTORE_OBJECT_COUNTS]: counts
    }

    if (shouldSave) {
        const doc = await this.fsGetDocById(vars.FS_COLLECTIONS_INFO.name, vars.FS_INFO_TYPES.dailyAdminReport)
        await doc.collection(vars.FS_INFO_TYPES.dailyAdminReport).add(info)
    }
    return info
}