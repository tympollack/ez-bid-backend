const cloudTasks = require('@google-cloud/tasks')
const crypto = require('crypto')
const moment = require('moment')

const db = require('./firestore/init')
const gmc = require('./googleMapsClient')
const vars = require('./vars')

// @deprecated
exports.fsGetObjectById = (db, collection, id) => {
    return new Promise(async resolve => {
        const doc = await db.collection(collection).doc(id).get()
        resolve(doc.data())
    })
}

// @deprecated
exports.fsGetDocById = (db, collection, id) => {
    return new Promise(async resolve => {
        resolve(await db.collection(collection).doc(id))
    })
}

exports.nextRescan = itemEndDate => {
    if (itemEndDate < new Date()) return 0
    if (itemEndDate < this.dateFromNow(10, 'minutes')) return this.dateFromNow(2, 'minutes')
    if (itemEndDate < this.dateFromNow(1, 'hours')) return this.dateFromNow(5, 'minutes')
    if (itemEndDate < this.dateFromNow(1, 'days')) return this.dateFromNow(1, 'hours')
    else return this.dateFromNow(1, 'days')
}

exports.dateFromNow = (amt, type) => {
    const mo = moment().add(amt, type)
    return new Date(mo)
}

exports.geocodeAddress = address => {
    return gmc.geocode({ address: address }).asPromise()
}

exports.quickHash = data => {
    return crypto.createHash('sha1').update(data).digest('base64')
}

exports.newPromise = promise => {
    return new Promise((resolve, reject) => {
        promise().then(() => { resolve() }, e => { reject(e) })
    })
}

exports.batchPromise = (batchData, method = 'set') => {
    return this.newPromise(() => {
        const batch = db.batch()
        for (let i = 0, len = batchData.length; i < len; i++) {
            const d = batchData[i]
            batch[method](d.docRef, d.data)
        }
        return batch.commit()
    })
}

exports.roundTo = (n, digits = 0) => {
    let negative = false
    if (n < 0) {
        negative = true
        n *= -1
    }
    const multiplier = Math.pow(10, digits)
    n = parseFloat((n * multiplier).toFixed(11))
    n = (Math.round(n) / multiplier).toFixed(2)
    n = negative ? (n * -1).toFixed(digits) : n
    return parseFloat(n)
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

exports.sendHttpResponse = (res, httpResponse = { status:200, clean:'' }) => {
    res.status(httpResponse.status).send(httpResponse.clean)
}

exports.isValidSession = session => {
    return session
        && session[vars.FS_SESSION_COOKIE]
        && session[vars.FS_SESSION_CSRF]
        && session[vars.FS_SESSION_EXPIRATION]
        && session[vars.FS_SESSION_EXPIRATION]._seconds * 1000 > new Date()
}

// @deprecated
exports.getFsUserSession = async (db, userId) => {
    const user = await this.fsGetObjectById(db, vars.FS_COLLECTIONS_USERS.name, userId)
    if (!user) {
        return
    }

    return {
        userId: userId,
        bidnum: user[vars.FS_USER_BIDNUM],
        bidpw: user[vars.FS_USER_BIDPW],
        session: user[vars.FS_USER_SESSION]
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
    const parent = client.queuePath(vars.FB_PROJECTID, vars.FB_CLOUD_RESOURCE_LOCATION, queue)
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