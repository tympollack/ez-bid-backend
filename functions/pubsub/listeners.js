const puppetFuncs = require('../puppeteering/puppetFuncs')
const { config, db, functions } = module.parent.shareable
const { findAuctionsAmount, topics } = config.pubsub
const fsCollections = config.firestore.collections
const fsInfoCollection = fsCollections.info
const fsAuctionsCollection = fsCollections.auctions
const fsAuctionFields = fsAuctionsCollection.fields
const auctionDetailsConfig = config.bidApiUrls.auctionDetails
const goodNums = fsInfoCollection.docs.goodAuctionNumbers.fields.nums.name
const badNums = fsInfoCollection.docs.badAuctionNumbers.fields.nums.name

exports.findNewAuctions = functions.runWith(config.puppeteer.opts).pubsub.topic(topics.findNewAuctions).onPublish(async message => {
    console.log('Finding new auctions...')

    // get highest auction number
    let auctionStart = 0
    const snap = await db.collection(fsAuctionsCollection.name)
        .orderBy(fsAuctionFields.auctionNumber.name, 'desc')
        .limit(1)
        .get()

    snap.forEach(doc => {
        auctionStart = doc.data().auctionNumber || 0
    })

    // get session info
    let opts = await puppetFuncs.getFsUserSession(db, config.firestore.serviceAccount.userId)
    if (!opts) return

    opts.db = db
    if (!puppetFuncs.isValidSession(opts.session)) {
        await puppetFuncs.puppetAction(opts)
        Object.assign(opts, await puppetFuncs.getFsUserSession(db, config.firestore.serviceAccount.userId))
    }

    // call out to find valid auctions
    const baseUrl = `${auctionDetailsConfig.url}?${auctionDetailsConfig.params.auctionId}=`
    const params = {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'cookie': opts.cookie,
            'x-csrf-token': opts.csrf
        },
        redirect: 'follow',
    }

    const oops = 'Oops Something went wrong.'
    const goodNumbers = []
    const badNumbers = []

    const promises = []
    for (let i = 0, max = findAuctionsAmount; i < max; i++) {
        const promise = new Promise(resolve => {
            cors(req, res, async () => {
                const auctionNumber = auctionStart + i
                const url = baseUrl + auctionNumber
                console.log('Calling auction', auctionNumber)
                await fetch(url, params)
                    .then(response => response.text().then(r => {
                        if (r.indexOf(oops) > -1) badNumbers.push(auctionNumber)
                        else goodNumbers.push(auctionNumber)
                    }))
                    .catch(error => {
                        console.log(error)
                    })
                resolve()
            })
        })
        promises.push(promise)
    }
    await Promise.all(promises)

    // save
    const goodSaveDoc = db.collection(fsInfoCollection.name).doc(fsInfoCollection.docs.goodAuctionNumbers.name)
    const badSaveDoc = db.collection(fsInfoCollection.name).doc(fsInfoCollection.docs.badAuctionNumbers.name)
    goodSaveDoc.set({ [goodNums]: doc.get()[goodNums].concat(goodNumbers) })
    badSaveDoc.set({ [badNums]: doc.get()[badNums].concat(badNumbers) })

    // crawl auctions
    const now = new Date()
    goodNums.forEach(async num => {
        const auctionInfo = await puppetFuncs.crawlAuctionInfo(num, opts)
        if (!auctionInfo.hasOwnProperty('name')) {
            console.log('Unable to crawl auction at this time.', num)
            return
        }
        auctionInfo[fsAuctionFields.addDate] = now
        auctionInfo[fsAuctionFields.auctionNumber] = num
        auctionInfo[fsAuctionFields.itemList] = []
        auctionInfo[fsAuctionFields.itemsCrawled] = false
        auctionInfo[fsAuctionFields.sanitized] = false
        await db.collection(fsAuctionsCollection.name).doc(num).set(auctionInfo)
    })
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(topics.loginqueue).onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})