const psFuncs = require('./psFuncs')
const { functions, vars } = module.parent.shareable

exports.findNewAuctions = functions.runWith(vars.PUPPETEER_OPTS).pubsub.topic(vars.PS_TOPICS.findNewAuctions).onPublish(message => {
    console.log('Processing queue:', vars.PS_TOPICS.findNewAuctions)
    psFuncs.findNewAuctions().catch(err => { console.log(err) })
})

exports.loginQueue = functions.runWith(vars.PUPPETEER_OPTS).pubsub.topic(vars.PS_TOPICS.loginqueue).onPublish(message => {
    console.log('Processing queue:', vars.PS_TOPICS.loginqueue)
    console.log(message)
    if (message.data) {
        const dataString = Buffer.from(message.data, 'base64').toString()
        console.log(`Message Data: ${dataString}`)
    }
})