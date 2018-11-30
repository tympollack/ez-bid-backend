const shareable = module.parent.shareable
const topics = shareable.config.pubsub.topics
const pubsub = shareable.functions.pubsub

exports.findNewAuctions = pubsub.topic(topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})

// session needs renewed -> add to task queue -> handler calls puppeteer function ->
// todo - i dont think this needs to be here anymore
exports.getnewUserSession = pubsub.topic(topics.getNewUserSession).onPublish(message => {
    console.log('Getting user session...')
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})