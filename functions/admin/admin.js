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
routes.get('/setLastScanDatesOnAllItems', setLastScanDatesOnAllItems)
routes.get('/setItemsWithoutTitleToRescan', setItemsWithoutTitleToRescan)

// manage firestore
routes.get('/countFirestoreObjects', countFirestoreObjects)
routes.get('/clearStats', clearStats)
routes.get('/deleteCollections', deleteCollections)
routes.get('/generateStats', generateStats)
routes.get('/generateAdminSnapshot', generateAdminSnapshot)
routes.get('/fsBackup', fsBackup)

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
    // const snap = await db.collection('info').doc('RESCAN_ITEMS').collection('RESCAN_ITEMS').get()
    // const snap = await db.collection('items')
    //     .where(vars.FS_ITEM_ADD_DATE)
    //     .get()
    // res.send(snap.size + '')

    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        return new Error('failed getting user session')
    }
    opts.db = db

    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'cookie': opts.session.cookie,
            'x-csrf-token': opts.session.csrf
        },
        redirect: 'follow',
        body: JSON.stringify({idBidders: "5195", idItems: [1006466], idauctions: "9918"})
        // body: 'idItems=859554'
    }
    // const url = 'https://www.bidfta.com/itemDetails?idauctions=8843&idItems=859554&source=auctionItems'
    const url = 'https://www.bidfta.com/bidfta/getUpdateItems'
    // const url = 'https://www.bidfta.com/getBidHistoryListItem'
    fetch(url, params).then(response => response.text())
        .then(d => {
            // const auctionList = d.content
            // const len = auctionList.length
            // if (!len) return false

            res.send(d)
            // console.log('getAuctionList processing page', i)
        })
        .catch(error => {
            console.log('error:', error)
            res.send(error.message)
        })
}

async function test(req, res) {
    try {
        const testDocRef = db.collection('test').doc('test')
        const previousLastId = (await testDocRef.get()).data().lastId
        const limit = 1000
        const collRef = db.collection('info')
            .doc(vars.FS_IT_RESCAN_ITEMS)
            .collection(vars.FS_IT_RESCAN_ITEMS)

        const snap = await db.collection('items')
            .orderBy(vars.FS_ITEM_LAST_SCAN_DATE)
            // .startAfter(previousLastId)
            .limit(limit)
            .get()

        const promises = []
        const lastId = (snap.docs[snap.size - 1] || {}).id
        let count = 0, total = 0, batchData = []
        snap.forEach(doc => {
            total++
            const item = doc.data()
            const scanDate = item[vars.FS_ITEM_LAST_SCAN_DATE]
            const endDate = item[vars.FS_ITEM_END_DATE]
            if (scanDate._seconds < endDate._seconds) {
                count++
                const itemId = item[vars.FS_ITEM_ID]
                batchData.push({
                    docRef: collRef.doc(itemId),
                    data: {
                        [vars.FS_RI_SCAN_BY_DATE]: utils.nextRescan(endDate),
                        [vars.FS_RI_ITEM_ID]: itemId,
                        [vars.FS_RI_AUCTION_ID]: item[vars.FS_ITEM_AUCTION_ID]
                    }
                })
            }

            if (batchData.length === 500 || total === limit || lastId === doc.id) {
                promises.push(utils.batchPromise(batchData.slice()))
                batchData = []
            }
        })
        await Promise.all(promises)
        await testDocRef.update({ lastId: lastId })
        res.send(`${count} items need rescanned out of ${total}, ${previousLastId} - ${lastId}`)
    } catch (e) {
        console.log(e)
        res.send(e.message)
    }
}

async function bulkAddItemsToElasticsearch(req, res) {
    const elasticsearch = require('elasticsearch')
    const esClient = new elasticsearch.Client({
        host: `https://${vars.ES_USER}:${vars.ES_PASS}@${vars.ES_ADDRESS}`
    })

    try {
        const snap = await db.collection('items').limit(100).get()
        const items = []
        const body = []
        snap.forEach(doc => {
            const item = doc.data()
            items.push(item)

            body.push({
                create: {
                    _index: 'items',
                    _type: 'item',
                    _id: doc.id
                }
            })

            body.push({
                id: doc.id,
                title: item[vars.FS_ITEM_TITLE],
                desc: item[vars.FS_ITEM_DESC],
                model: item[vars.FS_ITEM_MODEL],
                status: item[vars.FS_ITEM_STATUS]
            })
        })

        esClient.bulk({ body: body }, (err) => {
            if (err) throw err
        })

        res.json(items)
    } catch (e) {
        console.log(e)
        res.send(e.message)
    }
}

async function setLastScanDatesOnAllItems(req, res) {
    const testDocRef = db.collection('test').doc('test')
    const testDoc = await testDocRef.get()
    const previousLastId = testDoc.data().lastId
    const limit = 10000

    const collRef = db.collection('items')
    const snap = await collRef
        .orderBy('id')
        .startAfter(previousLastId)
        .limit(limit)
        .get()

    const promises = []
    const lastId = snap.docs[snap.size - 1].id
    let total = 0, batchData = []
    snap.forEach(doc => {
        total++
        const item = doc.data()
        const itemId = item[vars.FS_ITEM_ID]
        batchData.push({
            docRef: collRef.doc(itemId),
            data: {
                [vars.FS_ITEM_LAST_SCAN_DATE]: item[vars.FS_ITEM_ADD_DATE],
            }
        })

        if (batchData.length === 500 || total === limit || lastId === doc.id) {
            promises.push(utils.batchPromise(batchData.slice(), 'update'))
            batchData = []
        }
    })
    await Promise.all(promises)
    await testDocRef.update({ lastId: lastId })
    res.send(`${total} items updated, ${previousLastId} - ${lastId}`)
}

async function setItemsWithoutTitleToRescan(req, res) {
    const testDocRef = db.collection('test').doc('test')
    const previousLastId = (await testDocRef.get()).data().lastId
    const limit = 10000
    const oneYear = utils.dateFromNow(1, 'years')
    const collRef = db.collection('info')
        .doc(vars.FS_IT_RESCAN_ITEMS)
        .collection(vars.FS_IT_RESCAN_ITEMS)

    const snap = await db.collection('items')
        .orderBy('id')
        .startAfter(previousLastId)
        .limit(limit)
        .get()

    const promises = []
    const lastId = snap.docs[snap.size - 1].id
    let count = 0, total = 0, batchData = []
    snap.forEach(doc => {
        const item = doc.data()
        total++
        if (!item[vars.FS_ITEM_TITLE]) {
            count++
            const itemId = item[vars.FS_ITEM_ID]
            batchData.push({
                docRef: collRef.doc(itemId),
                data: {
                    [vars.FS_RI_SCAN_BY_DATE]: oneYear,
                    [vars.FS_RI_ITEM_ID]: itemId,
                    [vars.FS_RI_AUCTION_ID]: item[vars.FS_ITEM_AUCTION_ID]
                }
            })
        }

        if (batchData.length === 500 || total === limit || lastId === doc.id) {
            promises.push(utils.batchPromise(batchData.slice()))
            batchData = []
        }
    })
    await Promise.all(promises)
    await testDocRef.update({ lastId: lastId })
    res.send(`${count} items without titles out of ${total}, ${previousLastId} - ${lastId}`)
}

async function setItemsWithScanDateBeforeEndDateToRescan(req, res) {
    const limit = 10
    const oneYear = utils.dateFromNow(1, 'years')
    const collRef = db.collection('info')
        .doc(vars.FS_IT_RESCAN_ITEMS)
        .collection(vars.FS_IT_RESCAN_ITEMS)
    const snap = await db.collection('items')
        .orderBy('id')
        .startAfter('873662')
        .limit(limit)
        .get()

    const promises = []
    const lastId = snap.docs[snap.size - 1].id
    let count = 0, total = 0, batchData = []
    snap.forEach(doc => {
        const item = doc.data()
        total++
        if (!item[vars.FS_ITEM_TITLE]) {
            count++
            const itemId = item[vars.FS_ITEM_ID]
            batchData.push({
                docRef: collRef.doc(itemId),
                data: {
                    [vars.FS_RI_SCAN_BY_DATE]: oneYear,
                    [vars.FS_RI_ITEM_ID]: itemId,
                    [vars.FS_RI_AUCTION_ID]: item[vars.FS_ITEM_AUCTION_ID]
                }
            })
        }

        if (batchData.length === 500 || total === limit || lastId === doc.id) {
            promises.push(batchPromise(batchData.slice()))
            batchData = []
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

async function fsBackup(req, res) {
    const { collectionIds } = req.query
    const r = await psFuncs.firestoreBackup(collectionIds ? JSON.parse(collectionIds) : null)
    r instanceof Error ? res.send(r.message) : res.json(r)
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