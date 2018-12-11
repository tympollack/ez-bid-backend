const config = require('./config/config').get()
const cloudTasks = require('@google-cloud/tasks')

exports.fsGetObjectById = (db, collection, id) => {
    return new Promise(async resolve => {
        const doc = await db.collection(collection).doc(id).get()
        resolve(doc.data())
    })
}

exports.fsGetDocById = (db, collection, id) => {
    return new Promise(async resolve => {
        resolve(await db.collection(collection).doc(id))
    })
}

exports.pluralize = (noun, count) => {
    return count === 1 ? noun : (noun + 's')
}

exports.tryCatchAsync = async (req, res, next) => {
    try {
        await next()
    } catch (e) {
        const easter = '' + e
        console.error(easter)
        res.status(500).send(easter)
    }
}

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
exports.validateFirebaseIdToken = async (req, res, next) => {
    console.log('Check if request is authorized with Firebase ID token')

    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
        console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
            'Make sure you authorize your request by providing the following HTTP header:',
            'Authorization: Bearer <Firebase ID Token>',
            'or by passing a "__session" cookie.')
        res.status(403).send('Unauthorized')
        return
    }

    let idToken
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        console.log('Found "Authorization" header')
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else if(req.cookies) {
        console.log('Found "__session" cookie')
        // Read the ID Token from cookie.
        idToken = req.cookies.__session
    } else {
        // No cookie
        res.status(403).send('Unauthorized')
        return
    }

    try {
        const decodedIdToken = await module.parent.shareable.admin.auth().verifyIdToken(idToken)
        console.log('ID Token correctly decoded', decodedIdToken)
        req.user = decodedIdToken
        next()
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error)
        res.status(403).send('Unauthorized')
    }
}

exports.createTask = async (queue, payload) => {
    const client = new cloudTasks.CloudTasksClient()
    const { projectId, cloudResourceLocation } = config.firebase
    const parent = client.queuePath(projectId, cloudResourceLocation, queue)
    const options = { payload: payload }

    const task = {
        appEngineHttpRequest: {
            httpMethod: 'POST',
            relativeUri: `/publish/${queue}`,
        },
    }

    if (options.payload !== undefined) {
        task.appEngineHttpRequest.body = Buffer.from(options.payload).toString(
            'base64'
        )
    }

    if (options.inSeconds !== undefined) {
        task.scheduleTime = {
            seconds: options.inSeconds + Date.now() / 1000,
        }
    }

    const request = {
        parent: parent,
        task: task,
    }

    console.log('Sending task', task)
    try {
        const response = await client.createTask(request)
        const createdTask = response[0].name
        console.log('Created task', createdTask)
        return true
    } catch (e) {
        console.error(`Error in createTask: ${e.message || e}`)
        return false
    }
}