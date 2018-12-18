const { cors, config, db, utils } = module.parent.shareable

const { firestore, httpResponses, bidApiUrls } = config
const fsUsersCollection = firestore.collections.users
const sessionVars = fsUsersCollection.fields.session
const fsSession = sessionVars.name
const sessionFields = sessionVars.fields
const fsCookie = sessionFields.cookie.name
const fsCsrf = sessionFields.csrf.name
const fsExpiration = sessionFields.expiration.name

const routes = require('express').Router()
routes.param('userId', getSessionVars)
routes.post('/users/:userId/watchlist', saveItemToWatchlist)
routes.delete('/users/:userId/watchlist', deleteItemFromWatchlist)

routes.use('/auctions', getSessionVars)
routes.post('/auctions/:auctionId/items/:itemId/bid', placeAjaxBid)
routes.post('/auctions/:auctionId/items/:itemId/maxBid', placeAjaxMaxBid)

routes.use('/items', getSessionVars)
routes.get('/items/:itemId/bids', getBidHistoryList)

module.exports = routes

/////////////////////////////////////////////////////////////////////

async function getSessionVars(req, res, next) {
    const userId = req.params.userId || req.body.userId
    console.log(req.params.userId, req.body.userId, userId)
    if (!userId) {
        utils.sendHttpResponse(res, httpResponses.noUserId)
        return
    }

    const user = await getUserById(userId)
    if (!user) {
        utils.sendHttpResponse(res, httpResponses.notFound)
        return
    }

    const timestamp = Date.now()
    const session = user[fsSession]
    if (!session || !session[fsCookie] || !session[fsCsrf] || !session[fsExpiration] || session[fsExpiration] < timestamp) {
        const e = await utils.createTask('loginqueue', user.id) ? httpResponses.networkAuthenticationRequired : httpResponses.failedDependency
        res.status(e.status).send(e.clean)
        return
    }

    res.locals.user = user
    res.locals.cookie = session[fsCookie]
    res.locals.csrf = session[fsCsrf]
    next()
}

async function deleteItemFromWatchlist(req, res) {
    const { auctionId, itemId } = req.body
    if (!auctionId || !itemId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    const user = res.locals.user
    const userId = user[fsUsersCollection.fields.id.name]
    const bidnum = user[fsUsersCollection.fields.bidnum.name]
    const body = {
        idBidders: bidnum,
        idItems: itemId,
        idAuctions: auctionId
    }

    console.log('Removing item from watchlist', userId, bidnum, itemId, auctionId)
    await callBidApi(req, res, bidApiUrls.deleteItemFromWatchlist, body)
}

async function saveItemToWatchlist(req, res) {
    const { auctionId, itemId } = req.body
    if (!auctionId || !itemId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    const user = res.locals.user
    const userId = user[fsUsersCollection.fields.id.name]
    const bidnum = user[fsUsersCollection.fields.bidnum.name]
    const body = {
        idBidders: bidnum,
        idItems: itemId,
        idAuctions: auctionId
    }

    console.log('Adding item to watchlist', userId, bidnum, itemId, auctionId)
    await callBidApi(req, res, bidApiUrls.saveItemToWatchlist, body)
}

async function placeAjaxBid(req, res) {
    const { auctionId, itemId } = req.params
    const { currentBid, maxBid } = req.body
    if (!auctionId || !itemId || !currentBid || !maxBid) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    const user = res.locals.user
    const userId = user[fsUsersCollection.fields.id.name]
    const bidnum = user[fsUsersCollection.fields.bidnum.name]
    const body = {
        idBidders: bidnum,
        idItems: itemId,
        idAuctions: auctionId,
        currentBid: currentBid,
        maxBid: maxBid
    }

    console.log('Placing bid on item', userId, bidnum, itemId, auctionId, currentBid, maxBid)
    await callBidApi(req, res, bidApiUrls.placeAjaxBid, body)
}

// todo not quite sure of the difference in api currently
async function placeAjaxMaxBid(req, res) {
    const { auctionId, itemId } = req.params
    const { currentBid, maxBid } = req.body
    if (!auctionId || !itemId || !currentBid || !maxBid) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    const user = res.locals.user
    const userId = user[fsUsersCollection.fields.id.name]
    const bidnum = user[fsUsersCollection.fields.bidnum.name]
    const body = {
        idBidders: bidnum,
        idItems: itemId,
        idAuctions: auctionId,
        currentBid: currentBid,
        maxBid: maxBid
    }

    console.log('Placing max bid on item', userId, bidnum, itemId, auctionId, currentBid, maxBid)
    await callBidApi(req, res, bidApiUrls.placeAjaxMaxBid, body)
}

async function getBidHistoryList(req, res) {
    const { itemId } = req.params
    if (!itemId) {
        utils.sendHttpResponse(res, httpResponses.missingInformation)
        return
    }

    const user = res.locals.user
    const userId = user[fsUsersCollection.fields.id.name]
    const bidnum = user[fsUsersCollection.fields.bidnum.name]
    const body = { idItems: itemId }
    console.log(user)

    console.log('Getting bid history for item', userId, bidnum, itemId)
    await callBidApi(req, res, bidApiUrls.getBidHistoryList, body)
}

/////////////////////////////////////////////////////////////////////

function getUserById(id) {
    return utils.fsGetObjectById(db, fsUsersCollection.name, id)
}

function getUserDoc(id) {
    return utils.fsGetDocById(db, fsUsersCollection.name, id)
}

function callBidApi(req, res, url, body = {}) {
    const { cookie, csrf } = res.locals
    cors(req, res, () => {
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
            body: JSON.stringify(body)
        }

        fetch(url, params)
            .then(response => response.json().then(r => {
                res.send(r)
            }))
            .catch(error => {
                res.status(400).json(error)
            })
    })
}