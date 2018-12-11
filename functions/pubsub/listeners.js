const { config, functions, puppeteer } = module.parent.shareable
const topics = config.pubsub.topics

exports.findNewAuctions = functions.pubsub.topic(topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')

    // get service account session

    // get auction set = bad numbers + (last good auction number + 1000)

    // add auction info in firestore -> which will kick off getting items
})

exports.loginQueue = functions.runWith(config.puppeteer.opts).pubsub.topic(topics.loginqueue).onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})