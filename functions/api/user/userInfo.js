const express = require('express')
const cors = require('cors')({ origin: true })
const bodyParser = require('body-parser')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const master = require('../../index')
const db = master.db

const utils = require('../../utils')
const vars = require('../../vars/vars')
const collection = vars.firestore.collections.users.name

const userApp = express()
userApp.use(cors)
userApp.use(bodyParser.json())

userApp.get('/', async (req, res) => {
    console.log('GET /user ALL')

    const ret = {}
    const collection = await db.collection(collection).get()
    collection.forEach(doc => ret[doc.id] = doc.data())
    res.status(200).send(JSON.stringify(ret))
})

userApp.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET /user', id)

    const user = await getUserById(id)
    if (user) {
        console.log(user)
        res.status(200).send(JSON.stringify(user))
        return
    }
    console.error('user not found for id', id)
    res.status(404).send()
})

userApp.post('/', async(req, res) => {
    const body = req.body
    const id = body.id
    console.log('POST /user', body)

    const doesExist = id && await getUserById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collection).add(body)
    res.status(200).send()
})

userApp.put('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PUT /user', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collection).doc(id).set(body)
    res.status(200).send()
})

userApp.patch('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /user', id, body)

    const doesExist = id && await getUserById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collection).doc(id).update(body)
    res.status(200).send()
})

// Warning: Deleting a document does not delete its subcollections!
userApp.delete('/:id', async(req, res) => {
    const id = req.params.id
    console.log('DELETE /user', id)

    await db.collection(collection).doc(id).delete()
    res.status(200).send()
})

const getUserById = id => {
    return utils.firestoreGetThingById(db, collection, id)
}

exports = functions.https.onRequest(userApp)