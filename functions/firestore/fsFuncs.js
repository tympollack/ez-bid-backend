const db = require('../firestore/init')
const vars = require('../vars')

exports.fsGetObjectById = async (collectionName, id) => {
    // return new Promise(async resolve => {
    //     const doc = await db.collection(collectionName).doc(id).get()
    //     resolve(doc.data())
    // })
    const doc = await db.collection(collectionName).doc(id).get()
    return doc.data()
}

exports.fsGetDocById = (collectionName, id) => {
    // return new Promise(async resolve => {
    //     resolve(await db.collection(collectionName).doc(id))
    // })
}

exports.getFsUserSession = async userId => {
    const user = await this.fsGetObjectById(vars.FS_COLLECTIONS_USERS.name, userId)
    if (!user) {
        return
    }

    return {
        userId: userId,
        bidnum: user[vars.FS_USER_BIDNUM_NAME],
        bidpw: user[vars.FS_USER_BIDPW_NAME],
        session: user[vars.FS_USER_SESSION_NAME]
    }
}

exports.findHighestGoodAuction = async () => {
    const auctionsSnap = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name)
        .orderBy(vars.FS_AUCTION_AUCTION_NUMBER_NAME, 'desc')
        .limit(1)
        .get()

    let ret = {}
    auctionsSnap.forEach(doc => {
        ret = doc.data()
    })
    return ret
}

exports.getUnusedAuctionNumbers = async () => {
    const badSnap = await db.collection(vars.FS_COLLECTIONS_INFO.name)
        .where(vars.FS_INFO_TYPES.badAuctionNum, '>', 0)
        .get()

    const badNums = []
    badSnap.forEach(doc => {
        badNums.push(doc.data()[vars.FS_INFO_TYPES.badAuctionNum])
    })
    return badNums
}

exports.addUnusedAuctionNumber = async num => {
    db.collection(vars.FS_COLLECTIONS_INFO.name).add({
        [vars.FS_INFO_TYPE_NAME]: vars.FS_INFO_TYPES.badAuctionNum,
        [vars.FS_INFO_VALUE_NAME]: num
    })
}

exports.addNewAuction = async auctionInfo => {
    const auctionNumber = auctionInfo[vars.FS_AUCTION_AUCTION_NUMBER_NAME] + '' // requires a string
    db.collection(vars.FS_COLLECTIONS_AUCTIONS.name).doc(auctionNumber).set(auctionInfo)
}