const { auth } = require('google-auth-library')
const moment = require('moment')
const db = require('../firestore/init')
const fsFuncs = require('../firestore/fsFuncs')
const puppetFuncs = require('../puppeteering/puppetFuncs')
const vars = require('../vars')
const utils = require('../utils')

exports.findNewAuctions = async () => {
    const highestGoodAuction = await fsFuncs.findHighestGoodAuction()
    const lastAuctionMoment = (highestGoodAuction[vars.FS_AUCTION_ADD_DATE] || {})._seconds * 1000

    const progModConfig = await fsFuncs.fsGetObjectById(vars.FS_COLLECTIONS_INFO.name, vars.FS_INFO_TYPES.progModConfig)
    const lastMinutesAgo = (progModConfig || {})[vars.FS_PMC_MINUTES_AGO] || vars.PS_BASE_MINUTES_AGO

    const lastMomentAgo = moment().subtract(lastMinutesAgo, 'minutes')
    const wasLastAuctionLongAgo = lastAuctionMoment < lastMomentAgo

    const newTestMinutesAgo = wasLastAuctionLongAgo ? lastMinutesAgo * 2 : vars.PS_BASE_MINUTES_AGO
    const docRef = await db.collection(vars.FS_COLLECTIONS_INFO.name).doc(vars.FS_INFO_TYPES.progModConfig)
    docRef.update({ [vars.FS_PMC_MINUTES_AGO]: newTestMinutesAgo })

    console.log('getting user session from firestore')
    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        return new Error('failed getting user session')
    }
    opts.db = db
    opts.skipLogin = true

    console.log('preparing crawl for auctions')
    const highestGoodAuctionNum = highestGoodAuction[vars.FS_AUCTION_AUCTION_NUMBER] || 0
    const badAuctionNums = await fsFuncs.getUnusedAuctionNumbers() || []
    const highestBadAuctionNum = badAuctionNums.sort((a, b) => { return b - a })[0]
    const isHighestBadNumberTooHigh = highestBadAuctionNum >= highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT
    const isHighestGoodAuctionTooOld = (highestGoodAuction[vars.FS_AUCTION_END_DATE] || {})._seconds * 1000 < new Date()

    let startNum
    if (wasLastAuctionLongAgo) {
        if (isHighestBadNumberTooHigh) {
            let x = 0
            if (newTestMinutesAgo !== vars.PS_BASE_MINUTES_AGO) {
                let r = 0
                while (r !== 2 && x < 20) {
                    x++
                    r = Math.pow(newTestMinutesAgo / vars.PS_BASE_MINUTES_AGO, 1 / x)
                }
                if (x === 20) x = 0
            }
            startNum = highestGoodAuctionNum + vars.PS_FIND_AUCTIONS_AMOUNT * x
        } else {
            return `last auction was added more than ${lastMinutesAgo} minutes ago`
        }
    }
    else if (isHighestBadNumberTooHigh && isHighestGoodAuctionTooOld) {
        startNum = highestBadAuctionNum
    } else {
        startNum = highestGoodAuctionNum
    }

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
    if (Array.isArray(auctionInfos)) {
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
    }

    if (shouldUpdateBadNums) fsFuncs.setUnusedAuctionNumbers(badAuctionNums)
    if (goodInfos.length) fsFuncs.addAuctions(goodInfos)
    else return 'No good auctions!'
}

exports.findNewItems = async () => {
    console.log('Looking up items...')

    console.log('getting user session from firestore')
    const opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        const m = 'failed getting user session'
        console.log(m)
        throw new Error(m)
    }
    opts.db = db

    console.log('preparing crawl for items')
    const auction = await fsFuncs.findHighestNonItemCrawledAuction()
    const auctionId = auction[vars.FS_AUCTION_AUCTION_NUMBER]
    if (!auctionId) return 'currently no auctions to crawl'

    const numItems = auction[vars.FS_AUCTION_NUM_ITEMS]
    const itemList = auction[vars.FS_AUCTION_ITEM_LIST] || []
    const endDate = auction[vars.FS_AUCTION_END_DATE]
    const numCrawledItems = itemList.length
    const pageNum = Math.ceil((numCrawledItems + 1) / 24)
    const startIdx = numCrawledItems - 24 * (pageNum - 1)

    // if it's an old auction, no need to login; only reason to login is to get next bid amount (may change in future)
    opts.skipLogin = (endDate || {})._seconds * 1000 < new Date()

    // set auction as being crawled so another thread won't try it
    const auctionRef = await fsFuncs.fsGetDocById(vars.FS_COLLECTIONS_AUCTIONS.name, auctionId)
    await auctionRef.update({ [vars.FS_AUCTION_ITEMS_CRAWLED]: true })

    try {
        const actionResp = await puppetFuncs.crawlItemInfo(auctionId, pageNum, startIdx, opts)
        if (!Array.isArray(actionResp)) throw actionResp

        const goodInfos = []
        actionResp.forEach(info => {
            const itemId = info[vars.FS_ITEM_ID]
            itemList.push(itemId)

            info[vars.FS_ITEM_ADD_DATE] = new Date()
            goodInfos.push(info) // todo figure out validation that would fail an item
        })

        await fsFuncs.addItems(goodInfos)

        auctionRef.update({
            [vars.FS_AUCTION_ITEM_LIST]: itemList,
            [vars.FS_AUCTION_ITEMS_CRAWLED]: itemList.length === numItems
        })
        return goodInfos
    } catch(e) {
        auctionRef.update({ [vars.FS_AUCTION_ITEMS_CRAWLED]: false })
        console.log(e)
        throw e
    }
}

exports.generateAdminReport = async () => {
    return fsFuncs.generateFSReport(true)
}

exports.removeOldEvents = () => {
    return fsFuncs.removeOldEvents()
}

exports.firestoreBackup = async (collectionIds) => {
    const authClient = await auth.getClient({
        keyFile: 'service-account-fsbackup.json',
        scopes: 'https://www.googleapis.com/auth/datastore'
    })
    const url = `https://firestore.googleapis.com/v1beta1/projects/${vars.FB_PROJECTID}/databases/(default):exportDocuments`
    try {
        const res = await authClient.request({
            url,
            method: 'POST',
            data: {
                collectionIds: collectionIds,
                outputUriPrefix: `gs://${vars.DS_FSBACKUPS_BUCKET}`
            }
        })
        console.log('firestore backed up at', new Date())
        return res.data
    } catch (e) {
        console.error(e)
        return e.message
    }
}

exports.rescanItems = async () => {
    console.log('Rescanning items...')

    console.log('getting user session from firestore')
    let opts = await fsFuncs.getFsUserSession(vars.FS_SERVICE_ACCOUNT_ID)
    if (!opts) {
        const m = 'failed getting user session'
        console.log(m)
        throw new Error(m)
    }
    opts.db = db

    console.log('getting next items to rescan')
    const collRef = db.collection(vars.FS_COLLECTIONS_INFO.name)
        .doc(vars.FS_IT_RESCAN_ITEMS)
        .collection(vars.FS_IT_RESCAN_ITEMS)
    const rescanSnap = await collRef
        .orderBy(vars.FS_RI_SCAN_BY_DATE)
        .limit(vars.PS_RESCAN_ITEMS_AMOUNT)
        .get()

    if (!rescanSnap.size) return 'No items scheduled to rescan.'

    console.log('preparing crawl for items')
    const rescanInfo = {}
    let skipLogin = true
    const updateBatch = db.batch()
    rescanSnap.forEach(doc => {
        const data = doc.data()
        const auctionId = data[vars.FS_RI_AUCTION_ID]
        const itemId = data[vars.FS_RI_ITEM_ID] || data.id

        if (rescanInfo.hasOwnProperty(auctionId)) rescanInfo[auctionId].push(itemId)
        else rescanInfo[auctionId] = [itemId]

        const endDate = (data[vars.FS_RI_END_DATE] || {})._seconds * 1000
        const isActiveItem = endDate > new Date()
        if (skipLogin) skipLogin = !isActiveItem

        const docRef = collRef.doc(doc.id)
        if (isActiveItem && data[vars.FS_RI_SCAN_ON_INTERVAL]) {
            updateBatch.update(docRef, { [vars.FS_RI_SCAN_BY_DATE]: utils.nextRescan(endDate) })
        } else {
            updateBatch.delete(docRef)
        }
    })
    await updateBatch.commit()

    try {
        const goodInfos = []

        const keys = Object.keys(rescanInfo)
        for (let i = 0, len = keys.length; i < len; i++) {
            const auctionId = keys[i]
            const actionResp = await puppetFuncs.crawlItems(auctionId, rescanInfo[auctionId], opts)
            if (!Array.isArray(actionResp)) throw actionResp
            actionResp.forEach(info => {
                info[vars.FS_ITEM_LAST_SCAN_DATE] = new Date()
                goodInfos.push(info) // todo figure out validation that would fail an item
            })
        }

        return fsFuncs.addItems(goodInfos)
    } catch(e) {
        console.log(e)
        throw e
    }
}