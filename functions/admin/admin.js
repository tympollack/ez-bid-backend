const moment = require('moment')
const fsFuncs = require('../firestore/fsFuncs')
const psFuncs = require('../pubsub/psFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const { db, vars} = module.parent.shareable

//    /admin/
const routes = require('express').Router()

routes.post('/badAuctionNumDedupe', badAuctionNumDedupe)
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

}

async function test(req, res) {

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

function logIfString(r) {
    if (typeof r === 'string') console.log(r)
}