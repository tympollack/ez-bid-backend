const express = require('express')
const PubSub = require('@google-cloud/pubsub')

const pubsubClient = new PubSub({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
})

const app = express()
app.use(async (req, res, next) => {
    try {
        await next()
    } catch (e) {
        const easter = '' + e
        console.error(easter)
        res.status(500).send(easter)
    }
})

app.get('/publish/:topic', publishTopic)
app.post('/publish/:topic', publishTopic)

app.get('/', (req, res) => {
    res.send('poop')
})

const PORT = process.env.PORT || 6060
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})

/////////////////////////////////////////////////////////////////////

async function publishTopic(req, res) {
    const topic = req.params.topic
    await pubsubClient.topic(topic).publisher().publish(Buffer.from('test'))
    res.send('Published to ' + topic).end()
}