const shareable = module.parent.shareable
const topics = shareable.config.pubsub.topics
const pubsub = shareable.functions.pubsub

exports.findNewAuctions = pubsub.topic(topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')

    // get service account session

    // get auction set = bad numbers + (last good auction number + 1000)

    // add auction info in firestore -> which will kick off getting items
})