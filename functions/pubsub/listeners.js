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

exports.userNeedsNewSession = pubsub.topic(topics.findNewAuctions).onPublish(message => {
    console.log('Getting user session...')
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})