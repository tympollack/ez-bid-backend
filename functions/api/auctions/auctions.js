const FieldValue = require('firebase-admin').firestore.FieldValue

const shareable = module.parent.shareable
const config = shareable.config
const db = shareable.db
const url = shareable.url + '/auctions'

const collectionConfig = config.firestore.collections.auctions
const collectionName = collectionConfig.name

//    /api/auctions/
const routes = require('express').Router()

routes.get('/', queryAuctions)
routes.post('/', addAuction)

routes.get('/:id', getAuction)
routes.put('/:id', addAuctionById)
routes.patch('/:id', updateAuction)
routes.delete('/:id', deleteAuction)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const getAuctionById = id => {
    return shareable.utils.fsGetObjectById(db, collectionName, id)
}

async function queryAuctions(req, res) {
    const query = req.query
    console.log('GET /auctions', query ? query : 'ALL')

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
    res.status(200).json(ret)
}

async function getAuction(req, res) {
    const id = req.params.id
    console.log('GET /auctions', id)

    const auction = await getAuctionById(id)
    if (auction) {
        console.log(auction)
        res.status(200).json(auction)
        return
    }

    console.error('auction not found for id', id)
    res.status(404).send()
}

async function addAuction(req, res) {
    const body = req.body
    const id = body.id
    console.log('POST /auctions', body)

    const doesExist = id && await getAuctionById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).add(body)
    res.status(200).send()
}

async function addAuctionById(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PUT /auctions', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collectionName).doc(id).set(body)
    res.status(200).send()
}

async function updateAuction(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /auctions', id, body)

    const doesExist = id && await getAuctionById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).doc(id).update(body)
    res.status(200).send()
}

// Warning: Deleting a document does not delete its subcollections!
async function deleteAuction(req, res) {
    const id = req.params.id
    console.log('DELETE /auctions', id)

    const doc = await db.collection(collectionName).doc(id)
    await doc.update({ [collectionConfig.fields.itemList.name]: FieldValue.delete() })
    await doc.delete()
    res.status(200).send()
}