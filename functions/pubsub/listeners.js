const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const { config, db, functions, utils, vars } = module.parent.shareable

exports.findNewAuctions = functions.runWith(config.puppeteer.opts).pubsub.topic(vars.PS_TOPICS.findNewAuctions).onPublish(async message => {
    console.log('Finding new auctions...')

    // get session info
    console.log('getting user session from firestore')
    let opts = await await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
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
    const badAuctionNums = await fsFuncs.getUnusedAuctionNumbers()
    const highestBadAuctionNum = badAuctionNums.sort((a, b) => { return b - a })[0]
    const isHighestBadNumberTooHigh = highestBadAuctionNum >= highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT
    const isHighestGoodAuctionTooOld = (highestGoodAuction[vars.FS_AUCTION_END_DATE] || {})._seconds * 1000 < new Date()
    const startNum = (isHighestBadNumberTooHigh && isHighestGoodAuctionTooOld) ? highestBadAuctionNum : highestGoodAuctionNum

    const auctionNumsToGet = []
    for (let i = 1, len = vars.PS_FIND_AUCTIONS_AMOUNT; i <= len; i++) {
        let testNum = startNum + i
        if (badAuctionNums.indexOf(testNum === -1)) auctionNumsToGet.push(testNum)
    }

    const auctionInfos = await puppetFuncs.crawlAuctionInfo(auctionNumsToGet, opts)
    auctionInfos.forEach(info => {
        const num = info[vars.FS_AUCTION_AUCTION_NUMBER]
        if (info.error) {
            console.log('Unable to crawl auction at this time.', num || '', info.error)
            return
        }
        if (!info.name) {
            console.log('bad auction num', num)
            if (badAuctionNums.indexOf(num) === -1) {
                fsFuncs.addUnusedAuctionNumber(num)
                badAuctionNums.push(num)
            }
            return
        }

        info[vars.FS_AUCTION_ADD_DATE] = new Date()
        info[vars.FS_AUCTION_ITEM_LIST] = []
        info[vars.FS_AUCTION_ITEMS_CRAWLED] = false
        info[vars.FS_AUCTION_SANITIZED] = false
        fsFuncs.addAuction(info)
        console.log('auctionInfo set for', num)
    })
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(vars.PS_TOPICS.loginqueue).onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})