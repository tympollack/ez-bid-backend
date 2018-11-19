//    /api/auctions

const FieldValue = require('firebase-admin').firestore.FieldValue

const master = require('../../index')
const db = master.shareable.db
const url = master.shareable.url + '/api/auctions/'

const utils = require('../../utils')
const vars = require('../../vars/vars')
const collectionName = vars.firestore.collections.auctions.name

const routes = require('express').Router()

routes.get('/', async (req, res) => {
    const query = req.query
    console.log('GET /auctions', query ? query : 'ALL')

    try {
        const content = []
        const collection = await db.collection(collectionName).get()
        collection.forEach(doc => {
            const item = doc.data()
            item._links = [{
                self: {
                    href: url + doc.id
                }
            }]
            content.push(item)
        })

        const ret = {
            content: content,
            _links: [{
                _rel: 'auctions',
                href: url
            }]
        }
        res.status(200).json(ret).send()
    } catch (e) {
        const easter = e.toString()
        console.error(easter)
        res.status(500).send(easter)
    }
})

routes.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET /auctions', id)

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

routes.post('/', async(req, res) => {
    const body = req.body
    const id = body.id
    console.log('POST /auctions', body)

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

routes.put('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PUT /auctions', id, body)

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

routes.patch('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /auctions', id, body)

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
routes.delete('/:id', async(req, res) => {
    const id = req.params.id
    console.log('DELETE /auctions', id)

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

module.exports = routes