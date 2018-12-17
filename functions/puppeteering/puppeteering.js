const puppetFuncs = require('./puppetFuncs')
const { config, db, utils } = module.parent.shareable
const { firestore, httpResponses } = config

//    /puppeteering/puppeteering/
const routes = require('express').Router()

routes.get('/', (req, res) => { res.send('poop') })

routes.get('/auction/:auctionId', routeCrawlAuction)

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
    const auctionInfo = await puppetFuncs.crawlAuctionInfo([auctionId], opts)
    res.json(auctionInfo)
}

async function crawlWatchlist(req, res) {
    const error = await puppetFuncs.puppetAction(res.locals, async (page) => {

    })

    if (error) {
        return { error: error }
    }

}

/////////////////////////////////////////////////////////////////////

