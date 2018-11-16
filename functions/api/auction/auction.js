const express = require('express')
const cors = require('cors')({ origin: true })
const bodyParser = require('body-parser')
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')
const FieldValue = require('firebase-admin').firestore.FieldValue

const master = require('../../index')
const db = master.db

const utils = require('../../utils')
const vars = require('../../vars/vars')
const collectionName = vars.firestore.collections.auctions.name

const auctionApp = express()
auctionApp.use(cors)
auctionApp.use(bodyParser.json())

// /auction/auctionid

auctionApp.get('/', async (req, res) => {
    const query = req.query
    console.log('GET /auction', query ? query : 'ALL')

    try {
        const ret = {}
        const auctions = await db.collection(collectionName).get()
        auctions.forEach(doc => ret[doc.id] = doc.data())
        res.status(200).send(JSON.stringify(ret))
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

auctionApp.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET /auction', id)

    try {
        const auction = await getAuctionById(id)
        if (auction) {
            console.log(auction)
            res.status(200).send(JSON.stringify(auction))
            return
        }

        console.error('auction not found for id', id)
        res.status(404).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

auctionApp.post('/', async(req, res) => {
    const body = req.body
    const id = body.id
    console.log('POST /auction', body)

    try {
        const doesExist = id && await getAuctionById(id)
        if (doesExist) {
            res.status(403).send()
            return
        }

        await db.collection(collectionName).add(body)
        res.status(200).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

auctionApp.put('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PUT /auction', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    try {
        await db.collection(collectionName).doc(id).set(body)
        res.status(200).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

auctionApp.patch('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /auction', id, body)

    try {
        const doesExist = id && await getAuctionById(id)
        if (!doesExist) {
            res.status(403).send()
            return
        }

        await db.collection(collectionName).doc(id).update(body)
        res.status(200).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

// Warning: Deleting a document does not delete its subcollections!
auctionApp.delete('/:id', async(req, res) => {
    const id = req.params.id
    console.log('DELETE /auction', id)

    try {
        const doc = await db.collection(collectionName).doc(id)
        await doc.update({ [firestore.collections[collectionName].fields.itemList.name]: FieldValue.delete() })
        await doc.delete()
        res.status(200).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

const getAuctionById = id => {
    return utils.firestoreGetThingById(db, collectionName, id)
}

exports.auction = functions.https.onRequest(auctionApp)