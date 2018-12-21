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

exports.addAuction = async auctionInfo => {
    const auctionNumber = auctionInfo[vars.FS_AUCTION_AUCTION_NUMBER] + '' // requires a string
    db.collection(vars.FS_COLLECTIONS_AUCTIONS.name).doc(auctionNumber).set(auctionInfo)
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