const { config, db, functions, puppeteer } = module.parent.shareable
const topics = config.pubsub.topics
const fsAuctionsCollection = config.firestore.collections.auctions
const fsAuctionFields = fsAuctionsCollection.fields

exports.findNewAuctions = functions.pubsub.topic(topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')

    db.collections(fsAuctionsCollection.name).orderBy(fsAuctionFields.id.name, 'desc').limit(1)
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(topics.loginqueue).onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})