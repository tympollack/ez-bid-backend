const express = require('express')
const cors = require('cors')({ origin: true })
const bodyParser = require('body-parser')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')

const master = require('../index')
const db = master.db

const utils = require('../utils')
const vars = require('../vars')
const collection = vars.firestore.collections.items.name

const itemApp = express()
itemApp.use(cors)
itemApp.use(bodyParser.json())
itemApp.use(utils.reqWrapper)

// /item/itemid

// todo - idk if this would be useful
// itemApp.get('/', async (req, res) => {
//     console.log('GET /item ALL')
//
//     const ret = {}
//     const collection = await db.collection(collection).get()
//     collection.forEach(doc => ret[doc.id] = doc.data())
//     res.status(200).send(JSON.stringify(ret))
// })

itemApp.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET /item', id)

    const item = await getItemById(id)
    if (item) {
        console.log(item)
        res.status(200).send(JSON.stringify(item))
        return
    }
    console.error('item not found for id', id)
    res.status(404).send()
})

itemApp.post('/', async(req, res) => {
    const body = req.body
    const id = body.id
    console.log('POST /item', body)

    const doesExist = id && await getItemById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collection).add(body)
    res.status(200).send()
})

itemApp.put('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PUT /item', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collection).doc(id).set(body)
    res.status(200).send()
})

itemApp.patch('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /item', id, body)

    const doesExist = id && await getItemById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collection).doc(id).update(body)
    res.status(200).send()
})

// Warning: Deleting a document does not delete its subcollections!
itemApp.delete('/:id', async(req, res) => {
    const id = req.params.id
    console.log('DELETE /item', id)

    await db.collection(collection).doc(id).delete()
    res.status(200).send()
})

const getItemById = id => {
    return utils.firestoreGetThingById(db, collection, id)
}

exports.item = functions.https.onRequest(itemApp)