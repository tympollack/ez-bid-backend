const fsFuncs = require('../firestore/fsFuncs')
const psFuncs = require('../pubsub/psFuncs')
const utils = require('../utils')
const { db, vars} = module.parent.shareable

//    /admin/
const routes = require('express').Router()

// fix firestore data
routes.post('/badAuctionNumDedupe', badAuctionNumDedupe)
routes.get('/resetAuctionsNotYetFullyCrawled', resetAuctionsNotYetFullyCrawled)
routes.get('/initBidCollection', initBidCollection)
routes.get('/initLocationCollection', initLocationCollection)

// manage firestore
routes.get('/countFirestoreObjects', countFirestoreObjects)
routes.get('/clearStats', clearStats)
routes.get('/deleteCollections', deleteCollections)
routes.get('/generateStats', generateStats)
routes.get('/generateAdminSnapshot', generateAdminSnapshot)

routes.get('/geocodeAddress', geocodeAddress)

// puppeteer
routes.get('/findNewAuctions', findNewAuctions)
routes.get('/findNewItems', findNewItems)

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
    const snap = await db.collection(vars.FS_COLLECTIONS_AUCTIONS.name).get()
    const locations = {}
    snap.forEach(doc => {
        const d = doc.data()
        const locKey = d[vars.FS_AUCTION_LOCATION_ADDRESS]
        const endDate = d[vars.FS_AUCTION_END_DATE]
        if (!locations[locKey]) locations[locKey] = {
            // address: locKey,
            lastAuctionEnded: endDate,
            numAuctions: 0,
            auctions: []
        }
        const location = locations[locKey]
        location.auctions.push(doc.id)
        if (location.lastAuctionEnded._seconds < endDate._seconds) location.lastAuctionEnded = endDate
    })

    Object.values(locations).forEach(loc => {
        const list = loc.auctions
        loc.numAuctions = list.length
        loc.auctions = list.sort((a,b)=>b-a)
        loc.lastAuctionEnded = new Date(loc.lastAuctionEnded._seconds * 1000)
    })

    res.json(locations)
}

async function test(req, res) {
    const snap = await db.collection('items').get()
    const itemCount = snap.size
    await db.collection('info').doc('AUCTION_STATS').update({ auctionCount: itemCount })
    res.send(itemCount + '')
}

async function geocodeAddress(req, res) {
    const address = req.query.address
    try {
        const resp = await utils.geocodeAddress(address)
        res.json(resp.json)
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message)
    }
}

async function generateStats(req, res) {
    const shouldSave = req.query.save
    try {
        const info = await fsFuncs.generateFSReport(shouldSave)
        res.json(info)
    } catch(e) {
        console.log(e)
        res.status(500).send(e.message)
    }
}

async function clearStats(req, res) {
    const statDocIds = req.query.statDocIds ? JSON.parse(req.query.statDocIds) : []
    const deleteExistingReports = req.query.deleteExistingReports ? JSON.parse(req.query.deleteExistingReports) : false

    try {
        await fsFuncs.clearStats(statDocIds, deleteExistingReports)
        res.send('stats reset')
    } catch (e) {
        res.status(500).json(e)
    }
}

async function deleteCollections(req, res) {
    const collections = req.query.collections ? JSON.parse(req.query.collections) : []

    try {
        await fsFuncs.deleteCollections(collections)
        res.send('stats reset')
    } catch (e) {
        res.status(500).json(e)
    }
}

async function countFirestoreObjects(req, res) {
    const collectionName = req.query.collection
    fsFuncs.countFSObjects(collectionName)
        .then(resp => { res.json(resp) })
        .catch(err => { res.status(500).json(err)})
}

async function generateAdminSnapshot(req, res) {
    fsFuncs.generateFSReport(false)
        .then(resp => { res.json(resp) })
        .catch(err => { res.status(500).json(err)})
}

async function findNewAuctions(req, res) {
    psFuncs.findNewAuctions()
        .then(resp => {
            logIfString(resp)
            res.json(resp)
        })
        .catch(err => { res.json(err) })
}

async function findNewItems(req, res) {
    psFuncs.findNewItems()
        .then(resp => {
            logIfString(resp)
            res.json(resp)
        })
        .catch(err => { res.status(500).json(err) })
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

/////////////////////////////////////////////////////////////////////

async function initBidCollection(req, res) {
    await fsFuncs.initBidCollection()
    res.send('ok')
}

async function initLocationCollection(req, res) {
    await fsFuncs.initLocationCollection()
    res.send('ok')
}

async function resetAuctionsNotYetFullyCrawled(req, res) {
    try {
        const result = await fsFuncs.resetAuctionsNotYetFullyCrawled()
        res.json(result)
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message)
    }
}

/////////////////////////////////////////////////////////////////////

function logIfString(r) {
    if (typeof r === 'string') console.log(r)
}