const moment = require('moment')
const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const { config, db, functions, vars } = module.parent.shareable

exports.findNewAuctions = functions.runWith(config.puppeteer.opts).pubsub.topic(vars.PS_TOPICS.findNewAuctions).onPublish(async message => {
    console.log('Processing queue:', vars.PS_TOPICS.findNewAuctions)

    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
    const lastAuctionMoment = highestGoodAuction[vars.FS_AUCTION_ADD_DATE]._seconds * 1000

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
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(vars.PS_TOPICS.loginqueue).onPublish(async message => {
    console.log('Processing queue:', vars.PS_TOPICS.loginqueue)
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})