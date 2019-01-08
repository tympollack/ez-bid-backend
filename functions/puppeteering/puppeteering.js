const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('./puppetFuncs')
const { config, db, utils, vars } = module.parent.shareable
const { firestore, httpResponses } = config

//    /puppeteering/
const routes = require('express').Router()

routes.get('/', (req, res) => { res.send('poop') })

routes.get('/auction/:auctionId', routeCrawlAuction)
routes.get('/auction/:auctionId/item/:itemId', routeCrawlAuctionItem)

routes.use('/users', verifyUserId)
routes.post('/users/session', routeUsersSession)

module.exports = routes

/////////////////////////////////////////////////////////////////////

async function verifyUserId(req, res, next) {
    const userId = req.body.userId || res.locals.userId
    if (!userId) {
        utils.sendHttpResponse(res, httpResponses.noUserId)
        return
    }

    const userSession = await utils.getFsUserSession(db, userId)
    if (!userSession) {
        console.error('user not found for id', id)
        utils.sendHttpResponse(res, httpResponses.notFound)
        return
    }
    Object.assign(res.locals, userSession)
    if (next) next()
}

async function routeUsersSession(req, res) {
    res.locals.forceLogin = true
    const opts = Object.assign({ db: db }, res.locals)
    const userSession = await puppetFuncs.puppetAction(opts)
    const error = userSession.error
    if (error) {
        res.status(error.status || 500).send(error.clean)
        return
    }
    res.json(userSession.session)
}

/*
    req.params = auctionId
    req.query = save
 */
async function routeCrawlAuction(req, res) {
    const auctionId = req.params.auctionId
    if (!auctionId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    res.locals.userId = firestore.serviceAccount.userId
    res.locals.skipLogin = true
    await verifyUserId(req, res)

    const opts = Object.assign({ db: db }, res.locals)
    const auctionInfos = await puppetFuncs.crawlAuctionInfo([auctionId], opts)

    const goodInfos = []
    auctionInfos.forEach(info => {
        const num = info[vars.FS_AUCTION_AUCTION_NUMBER]
        if (info.error) {
            console.log('Unable to crawl auction at this time.', num || '', info.error)
            return
        }
        if (!info.name) {
            console.log('bad auction num', num)
            return
        }

        info[vars.FS_AUCTION_ADD_DATE] = new Date()
        info[vars.FS_AUCTION_ITEM_LIST] = []
        info[vars.FS_AUCTION_ITEMS_CRAWLED] = false
        info[vars.FS_AUCTION_SANITIZED] = false
        goodInfos.push(info)
        console.log('auctionInfo set for', num)
    })

    if (goodInfos.length && req.query.save) await fsFuncs.addAuctions(goodInfos)

    res.json(auctionInfos)
}

/*
    req.params = auctionId
    req.params = itemId
    req.query = save
 */
async function routeCrawlAuctionItem(req, res) {
    const { auctionId, itemId } = req.params
    if (!auctionId || !itemId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    res.locals.userId = firestore.serviceAccount.userId
    await verifyUserId(req, res)

    const opts = Object.assign({ db: db }, res.locals)
    const actionResp = await puppetFuncs.crawlItems(auctionId, [itemId], opts)
    if (!Array.isArray(actionResp)) throw actionResp

    const goodInfos = []
    actionResp.forEach(info => {
        info[vars.FS_ITEM_ADD_DATE] = new Date()
        goodInfos.push(info) // todo figure out validation that would fail an item
    })

    if (goodInfos.length && req.query.save) await fsFuncs.addItems(goodInfos)

    res.json(actionResp)
}

async function crawlWatchlist(req, res) {
    const error = await puppetFuncs.puppetAction(res.locals, async (page) => {

    })

    if (error) {
        return { error: error }
    }

}

/////////////////////////////////////////////////////////////////////

