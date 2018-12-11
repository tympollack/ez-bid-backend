const functions = require('firebase-functions')
const shareable = module.parent.shareable
const topics = shareable.config.pubsub.topics
const pubsub = shareable.functions.pubsub

exports.findNewAuctions = functions.pubsub.topic('find-new-auctions').onPublish(message => {
    console.log('Finding new auctions...')

    // get service account session

    // get auction set = bad numbers + (last good auction number + 1000)

    // add auction info in firestore -> which will kick off getting items
})

exports.loginQueue = pubsub.topic('loginqueue').onPublish(message => {
    console.log('Processing queue: loginqueue')
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})