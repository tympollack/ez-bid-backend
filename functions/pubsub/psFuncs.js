const moment = require('moment')
const db = require('../firestore/init')
const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const vars = require('../vars')

exports.findNewAuctions = async () => {
    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
    const lastAuctionMoment = (highestGoodAuction[vars.FS_AUCTION_ADD_DATE] || {})._seconds * 1000

    const progModConfig = await fsFuncs.fsGetObjectById(vars.FS_COLLECTIONS_INFO.name, vars.FS_INFO_TYPES.progModConfig)
    const lastMinutesAgo = (progModConfig || {})[vars.FS_PMC_MINUTES_AGO] || vars.PS_BASE_MINUTES_AGO

    const lastMomentAgo = moment().subtract(lastMinutesAgo, 'minutes')
    const wasLastAuctionLongAgo = lastAuctionMoment < lastMomentAgo

    const newTestMinutesAgo = wasLastAuctionLongAgo ? lastMinutesAgo * 2 : vars.PS_BASE_MINUTES_AGO
    const docRef = await db.collection(vars.FS_COLLECTIONS_INFO.name).doc(vars.FS_INFO_TYPES.progModConfig)
    docRef.update({ [vars.FS_PMC_MINUTES_AGO]: newTestMinutesAgo })

    if (wasLastAuctionLongAgo) {
        console.log(`last auction was added more than ${lastMinutesAgo} minutes ago`)
        return
    }

    console.log('getting user session from firestore')
    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        console.log('failed getting user session')
        res.status(500).json(opts)
        return
    }
    opts.db = db
    opts.skipLogin = true

    console.log('preparing crawl for auctions')
    const highestGoodAuctionNum = highestGoodAuction[vars.FS_AUCTION_AUCTION_NUMBER] || 0
    const badAuctionNums = await fsFuncs.getUnusedAuctionNumbers() || []
    const highestBadAuctionNum = badAuctionNums.sort((a, b) => { return b - a })[0]
    const isHighestBadNumberTooHigh = highestBadAuctionNum >= highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT
    const isHighestGoodAuctionTooOld = (highestGoodAuction[vars.FS_AUCTION_END_DATE] || {})._seconds * 1000 < new Date()
    const startNum = (isHighestBadNumberTooHigh && isHighestGoodAuctionTooOld) ? highestBadAuctionNum : highestGoodAuctionNum

    const auctionNumsToGet = []
    let i = 1
    while (auctionNumsToGet.length < vars.PS_FIND_AUCTIONS_AMOUNT) {
        const testNum = startNum + i
        auctionNumsToGet.push(testNum)
        i++
    }

    const auctionInfos = await puppetFuncs.crawlAuctionInfo(auctionNumsToGet, opts)
    const goodInfos = []
    let shouldUpdateBadNums = false
    auctionInfos.forEach(info => {
        const num = info[vars.FS_AUCTION_AUCTION_NUMBER]
        if (info.error) {
            console.log('Unable to crawl auction at this time.', num || '', info.error)
            return
        }
        const idx = badAuctionNums.indexOf(num)
        if (!info.name) {
            console.log('bad auction num', num)
            if (idx === -1) {
                badAuctionNums.push(num)
                shouldUpdateBadNums = true
            }
            return
        }

        if (idx > -1) {
            badAuctionNums.splice(idx, 1)
            shouldUpdateBadNums = true
        }

        info[vars.FS_AUCTION_ADD_DATE] = new Date()
        info[vars.FS_AUCTION_ITEM_LIST] = []
        info[vars.FS_AUCTION_ITEMS_CRAWLED] = false
        info[vars.FS_AUCTION_SANITIZED] = false
        goodInfos.push(info)
        console.log('auctionInfo set for', num)
    })

    if (shouldUpdateBadNums) fsFuncs.setUnusedAuctionNumbers(badAuctionNums)
    if (goodInfos.length) fsFuncs.addAuctions(goodInfos)
    else console.log('No good auctions!')
}

exports.findNewItems = async () => {
    console.log('Looking up items...')

    console.log('getting user session from firestore')
    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        const m = 'failed getting user session'
        console.log(m)
        throw new Error(m)
    }
    opts.db = db

    console.log('preparing crawl for items')
    const auction = await fsFuncs.findHighestNonItemCrawledAuction()
    const auctionId = auction[vars.FS_AUCTION_AUCTION_NUMBER]
    if (!auctionId) {
        return 'currently no auctions to crawl'
    }

    const numItems = auction[vars.FS_AUCTION_NUM_ITEMS]
    const itemList = auction[vars.FS_AUCTION_ITEM_LIST] || []
    const endDate = auction[vars.FS_AUCTION_END_DATE]
    const numCrawledItems = itemList.length
    const pageNum = Math.ceil((numCrawledItems + 1) / 24)
    const startIdx = numCrawledItems - 24 * (pageNum - 1)

    // if it's an old auction, no need to login; only reason to login is to get next bid amount (may change in future)
    opts.skipLogin = (endDate || {})._seconds * 1000 < new Date()

    // set auction as being crawled so another thread won't try it
    const auctionRef = await fsFuncs.fsGetDocById(vars.FS_COLLECTIONS_AUCTIONS.name, auctionId)
    await auctionRef.update({ [vars.FS_AUCTION_ITEMS_CRAWLED]: true })

    try {
        const actionResp = await puppetFuncs.crawlItemInfo(auctionId, pageNum, startIdx, opts)
        if (!Array.isArray(actionResp)) {
            throw actionResp
        }

        const goodInfos = []
        actionResp.forEach(info => {
            const itemId = info[vars.FS_ITEM_ID]
            itemList.push(itemId)

            info[vars.FS_ITEM_ADD_DATE] = new Date()
            info[vars.FS_ITEM_AUCTION_ID] = auctionId
            goodInfos.push(info) // todo figure out validation that would fail an item
        })

        await fsFuncs.addItems(goodInfos)

        auctionRef.update({
            [vars.FS_AUCTION_ITEM_LIST]: itemList,
            [vars.FS_AUCTION_ITEMS_CRAWLED]: itemList.length === numItems
        })
        return goodInfos
    } catch(e) {
        auctionRef.update({ [vars.FS_AUCTION_ITEMS_CRAWLED]: false })
        console.log(e)
        throw e
    }
}

/////////////////////////////////////////////////////////////////////
// dead code saved jic


// const allUserBids = {}
// const bidInfos = []
// goodInfos.forEach(info => {
//     const itemId = info[vars.FS_ITEM_ID]
//     itemList.push(itemId)
//
//     const bids = info[vars.FS_ITEM_BIDS]
//     bids.forEach(bid => {
//         const { bidAmount, bidderId, bidDate } = bid
//         bidInfos.push({
//             [vars.FS_BID_AMOUNT]: bidAmount,
//             [vars.FS_BID_BIDDER_ID]: bidderId,
//             [vars.FS_BID_DATE]: bidDate,
//             [vars.FS_BID_ITEM_ID]: itemId
//         })
//
//         if (!allUserBids.hasOwnProperty(bidderId)) allUserBids[bidderId] = { bids: [] }
//         allUserBids[bidderId].bids.push({
//             [vars.FS_USER_BIDS_AMOUNT]: bidAmount,
//             [vars.FS_USER_BIDS_DATE]: bidDate,
//             [vars.FS_USER_BIDS_ITEM_ID]: itemId
//         })
//     })
// })

// const userCollRef = await db.collection(vars.FS_COLLECTIONS_USERS.name)
// const userPromises = []
// Object.keys(allUserBids).forEach(bidderId => {
//     userPromises.push(new Promise(async resolve => {
//         const docRef = await userCollRef.where(vars.FS_USER_BIDNUM, '==', bidderId)
//         const docSnap = await docRef.get()
//         allUserBids[bidderId].docRef = docSnap.exists ? docRef : userCollRef.doc()
//         resolve()
//     }))
// })
// await Promise.all(userPromises)
// await db.transaction(t => {
//     Object.entries.forEach(([bidderId, val]) => {
//         const docRef = val.docRef
//         t.get(docRef)
//             .then(doc => {
//                 const newBidList = doc.data()[vars.FS_USER_BIDS]
//                 newBidList.concat(val.bids)
//                 t.update(docRef, { [vars.FS_USER_BIDS]: newBidList })
//             })
//     })
// }).then(result => { console.log('user bids updated', result) })
//     .catch(err => { console.log('error updating user bids', err) })