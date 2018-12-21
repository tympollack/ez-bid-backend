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
    auctionRef.set({ [vars.FS_AUCTION_ITEMS_CRAWLED]: true }, { merge: true })

    try {
        const itemInfos = await puppetFuncs.crawlItemInfo(auctionId, pageNum, startIdx, opts)

        const goodInfos = []
        itemInfos.forEach(info => {
            itemList.push(info[vars.FS_ITEM_ID])
            goodInfos.push(info) // todo figure out validation, if an item fails, etc.
        })
    } catch(e) {
        console.log(e)
    } finally { // make sure crawl gets properly reset
        auctionRef.set({
            [vars.FS_AUCTION_ITEM_LIST]: itemList,
            [vars.FS_AUCTION_ITEMS_CRAWLED]: itemList.numItems === numItems
        }, { merge: true })
    }

    // const auctionNumsToGet = []
    // let i = 1
    // while (auctionNumsToGet.length < vars.PS_FIND_AUCTIONS_AMOUNT) {
    //     const testNum = startNum + i
    //     if (badAuctionNums.indexOf(testNum) === -1) auctionNumsToGet.push(testNum)
    //     i++
    // }
    //
    // const auctionInfos = await puppetFuncs.crawlAuctionInfo(auctionNumsToGet, opts)
    // const goodInfos = []
    // let shouldUpdateBadNums = false
    // auctionInfos.forEach(info => {
    //     const num = info[vars.FS_AUCTION_AUCTION_NUMBER]
    //     if (info.error) {
    //         console.log('Unable to crawl auction at this time.', num || '', info.error)
    //         return
    //     }
    //     if (!info.name) {
    //         console.log('bad auction num', num)
    //         if (badAuctionNums.indexOf(num) === -1) {
    //             badAuctionNums.push(num)
    //             shouldUpdateBadNums = true
    //         }
    //         return
    //     }
    //
    //     info[vars.FS_AUCTION_ADD_DATE] = new Date()
    //     info[vars.FS_AUCTION_ITEM_LIST] = []
    //     info[vars.FS_AUCTION_ITEMS_CRAWLED] = false
    //     info[vars.FS_AUCTION_SANITIZED] = false
    //     goodInfos.push(info)
    //     console.log('auctionInfo set for', num)
    // })
    //
    // if (shouldUpdateBadNums) fsFuncs.setUnusedAuctionNumbers(badAuctionNums)
    // if (goodInfos.length) fsFuncs.addAuctions(goodInfos)

    res.json(itemInfos)
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