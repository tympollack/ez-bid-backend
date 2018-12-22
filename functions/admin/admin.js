const moment = require('moment')
const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const { db, vars} = module.parent.shareable

//    /admin/
const routes = require('express').Router()

routes.post('/badAuctionNumDedupe', badAuctionNumDedupe)
routes.get('/findNewAuctions', findNewAuctions)
routes.get('/test', test)
routes.get('/otherTest', otherTest)
routes.get('/testFindAuctions', testFindAuctions)

module.exports = routes

/////////////////////////////////////////////////////////////////////

async function badAuctionNumDedupe(req, res) {
    const collRef = await db.collection(vars.FS_COLLECTIONS_INFO.name)
    const badSnap = await collRef
        .where(vars.FS_INFO_TYPE, '==', vars.FS_INFO_TYPES.badAuctionNum)
        .get()

    const nums = []
    badSnap.forEach(doc => {
        const num = doc.data()[vars.FS_INFO_VALUE]
        nums.indexOf(num) === -1 ? nums.push(num) : collRef.doc(doc.id).delete()
    })

    res.send('')
}

async function otherTest(req, res) {
    const collRef = await db.collection(vars.FS_COLLECTIONS_USERS.name)
    const tomRef = await collRef.doc('6u4wqYuw4Ho0iBq5DSuY')
    const harryRef = await collRef.doc('GeDXrTB4CXCQsWLWDLeg')

    try {
        db.runTransaction(async t => {
            t.update(tomRef, {age: 100})
            t.update(harryRef, {age: 100, bids: []})
        })
    } catch (e) {
        res.status(500).send(e)
    }
}

async function test(req, res) {
    console.log('Looking up items...')

    console.log('getting user session from firestore')
    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        console.log('failed getting user session')
        res.status(500).json(opts)
        return
    }
    opts.db = db

    console.log('preparing crawl for items')
    const auction = await fsFuncs.findHighestNonItemCrawledAuction()
    const auctionId = auction[vars.FS_AUCTION_AUCTION_NUMBER]
    if (!auctionId) {
        console.log('currently no auctions to crawl')
        return
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
            res.json(actionResp)
            return
        }

        const goodInfos = []
        actionResp.forEach(info => {
            info[vars.FS_ITEM_ADD_DATE] = new Date()
            goodInfos.push(info) // todo figure out validation that would fail an item
        })

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

        await fsFuncs.addItems(goodInfos)
        // await fsFuncs.addBids(bidInfos)

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

        res.json(goodInfos)
    } catch(e) {
        console.log(e)
        auctionRef.update({
            [vars.FS_AUCTION_ITEM_LIST]: itemList,
            [vars.FS_AUCTION_ITEMS_CRAWLED]: itemList.length === numItems
        })
        res.send(e)
    }
}

async function findNewAuctions(req, res) {
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
    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
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
        if (badAuctionNums.indexOf(testNum) === -1) auctionNumsToGet.push(testNum)
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
        if (!info.name) {
            console.log('bad auction num', num)
            if (badAuctionNums.indexOf(num) === -1) {
                badAuctionNums.push(num)
                shouldUpdateBadNums = true
            }
            return
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

    res.json(auctionInfos)
}

async function testFindAuctions(req, res) {
    const csrf = 'eb382da8-7bdc-4e10-b965-b1e9d6a228bb'
    const cookie = 'JSESSIONID=BE52D99BE751BAEA92EEABFAD33AAEC2;' +
        'AWSALB=8Y4ir7TWFwf52HTLO5M4tpufLr/wlkj8lcVqr/JdNc9/dBuUc2QdGEFCsO0IeoMPWs8IcJa3qbffVHSTNecETV4TGlM5kz8zVl+jZsgMvJifSqciCXkSUWpZ9Rll'

    const baseUrl = 'https://www.bidfta.com/auctionDetails?idauctions='
    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'cookie': cookie,
            'x-csrf-token': csrf
        },
        redirect: 'follow',
    }

    const oops = 'Oops Something went wrong.'
    const ret = {
        goodNumbers: [],
        badNumbers: [],
        httpResponses: {}
    }

    const promises = []

    const auctionStart = 6000
    for (let i = 0, max = 100; i < max; i++) {
        const promise = new Promise(resolve => {
            cors(req, res, async () => {
                const auctionNumber = auctionStart + i
                const url = baseUrl + auctionNumber
                console.log('Calling auction', auctionNumber)
                await fetch(url, params)
                    .then(response => response.text().then(r => {
                        if (r.indexOf(oops) > -1) ret.badNumbers.push(auctionNumber)
                        else ret.goodNumbers.push(auctionNumber)
                    }))
                    .catch(error => {
                        ret.httpResponses[auctionNumber] = error
                    })
                resolve()
            })
        })
        promises.push(promise)
    }
    await Promise.all(promises)

    ret.goodNumbers.sort()
    ret.badNumbers.sort()

    res.status(200).json(ret)
}