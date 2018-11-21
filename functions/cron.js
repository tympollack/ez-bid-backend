const pubsubVars = require('./vars/pubsub')

const master = require('./index')
const functions = master.shareable.functions
const db = master.shareable.db

exports.findNewAuctions = functions.pubsub.topic(pubsubVars.topics.findNewAuctions).onPublish(message => {
    console.log('Finding new auctions...')
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})