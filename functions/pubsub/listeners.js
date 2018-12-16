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
        res.json(opts)
        return
    }

    opts.db = db
    opts.skipLogin = true
    if (!utils.isValidSession(opts.session)) {
        console.log('invalid session, renewing session')
        await puppetFuncs.puppetAction(opts)
        Object.assign(opts, await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID))
    }

    console.log('preparing crawl for auctions')
    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
    const highestGoodAuctionNum = highestGoodAuction[vars.FS_AUCTION_AUCTION_NUMBER_NAME]
    const badAuctionNums = await fsFuncs.getUnusedAuctionNumbers()
    const highestBadAuctionNum = badAuctionNums.sort((a, b) => { return b - a })[0]
    const isHighestBadNumberTooHigh = highestBadAuctionNum > highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT
    const isHighestGoodAuctionTooOld = highestGoodAuction[vars.FS_AUCTION_END_DATE]._seconds * 1000 < new Date()
    const startNum = (isHighestBadNumberTooHigh && isHighestGoodAuctionTooOld) ? highestBadAuctionNum : highestGoodAuctionNum

    let auctionInfo
    for (let i = 1, len = vars.PS_FIND_AUCTIONS_AMOUNT; i <= len; i++) {
        const num = startNum + i
        auctionInfo = await puppetFuncs.crawlAuctionInfo(num, opts)

        if (auctionInfo.error) {
            console.log('Unable to crawl auction at this time.', num, auctionInfo.error)
        } else if (!auctionInfo.name) {
            console.log('bad auction num', num)
            if (badAuctionNums.indexOf(num) === -1) {
                fsFuncs.addUnusedAuctionNumber(num)
                badAuctionNums.push(num)
            }
        } else {
            auctionInfo[vars.FS_AUCTION_ADD_DATE_NAME] = new Date()
            auctionInfo[vars.FS_AUCTION_AUCTION_NUMBER_NAME] = num
            auctionInfo[vars.FS_AUCTION_ITEM_LIST_NAME] = []
            auctionInfo[vars.FS_AUCTION_ITEMS_CRAWLED_NAME] = false
            auctionInfo[vars.FS_AUCTION_SANITIZED_NAME] = false
            fsFuncs.addNewAuction(auctionInfo)
            console.log('auctionInfo set for', num)
        }
    }
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(vars.PS_TOPICS.loginqueue).onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})