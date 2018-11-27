const shareable = module.parent.shareable
const config = shareable.config
const pubsub = shareable.functions.pubsub

exports.findNewAuctions = pubsub.topic(config.pubsub.topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})