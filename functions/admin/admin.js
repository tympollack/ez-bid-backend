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
routes.get('/changeAllBidAmountsToNumbers', changeAllBidAmountsToNumbers)
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
    const snap = await db.collection('info').doc('RESCAN_ITEMS').collection('RESCAN_ITEMS').get()
    res.send(snap.size + '')
}

async function test(req, res) {
    const limit = 10000
    const oneYear = utils.dateFromNow(1, 'years')
    const collRef = db.collection('info')
        .doc(vars.FS_IT_RESCAN_ITEMS)
        .collection(vars.FS_IT_RESCAN_ITEMS)
    const snap = await db.collection('items')
        .orderBy('id')
        .limit(limit)
        .get()

    const batchData = [[]]
    const promises = []
    const lastId = snap.docs[snap.size - 1].id
    let count = 0, total = 0, currentBatchNum = 0, currentBatchCount = 0
    snap.forEach(doc => {
        const item = doc.data()
        total++
        if (!item[vars.FS_ITEM_TITLE]) {
            count++
            currentBatchCount++
            batchData[currentBatchNum].push({
                docRef: collRef.doc(),
                data: {
                    [vars.FS_RI_SCAN_BY_DATE]: oneYear,
                    [vars.FS_ITEM_ID]: item[vars.FS_ITEM_ID],
                    [vars.FS_ITEM_AUCTION_ID]: item[vars.FS_ITEM_AUCTION_ID]
                }
            })

            if (currentBatchCount === 500 || total === limit || lastId === doc.id) {
                // todo - fix here
                promises.push(utils.newPromise(() => {
                    const batch = db.batch()
                    const thisBatchData = batchData[currentBatchNum]
                    for (let i = 0; i < currentBatchCount; i++) {
                        const d = thisBatchData[i]
                        batch.set(d.docRef, d.data)
                    }
                    return batch.commit()
                }))
                currentBatchNum++
                batchData.push([])
            }
        }
    })
    await Promise.all(promises)
    res.send(count + ' items without titles out of ' + total + ', last item ' + lastId)
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
    try {
        const result = await fsFuncs.initBidCollection()
        res.json(result)
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message)
    }
}

async function changeAllBidAmountsToNumbers(req, res) {
    try {
        const result = await fsFuncs.changeAllBidAmountsToNumbers()
        res.json(result)
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message)
    }
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