const psFuncs = require('./psFuncs')
const { functions, vars } = module.parent.shareable

exports.findNewAuctions = functions.runWith(vars.PUPPETEER_OPTS).pubsub.topic(vars.PS_TOPICS.findNewAuctions).onPublish(message => {
    console.log('Processing queue:', vars.PS_TOPICS.findNewAuctions)
    psFuncs.findNewAuctions()
        .then(resp => { logIfString(resp) })
        .catch(err => { console.log(err) })
})

exports.loginQueue = functions.runWith(vars.PUPPETEER_OPTS).pubsub.topic(vars.PS_TOPICS.loginqueue).onPublish(message => {
    console.log('Processing queue:', vars.PS_TOPICS.loginqueue)
    psFuncs.findNewItems()
        .then(resp => { logIfString(resp) })
        .catch(err => { console.log(err) })
})

/////////////////////////////////////////////////////////////////////

function logIfString(r) {
    if (typeof r === 'string') console.log(r)
}