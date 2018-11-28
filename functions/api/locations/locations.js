const shareable = module.parent.shareable
const config = shareable.config
const db = shareable.db
const url = shareable.url + '/locations'

const collectionConfig = config.firestore.collections.locations
const collectionName = collectionConfig.name

//    /api/auctions/
const routes = require('express').Router()

routes.get('/', queryLocations)
routes.post('/', addLocation)

routes.get('/:id', getLocation)
routes.put('/:id', addLocationById)
routes.patch('/:id', updateLocation)
routes.delete('/:id', deleteLocation)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const getLocationById = id => {
    return shareable.utils.firestoreGetThingById(db, collectionName, id)
}

async function queryLocations(req, res) {
    const query = req.query
    console.log('GET /locations', query ? query : 'ALL')

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
            _rel: 'locations',
            href: url
        }]
    }
    res.status(200).json(ret)
}

async function getLocation(req, res) {
    const id = req.params.id
    console.log('GET /locations', id)

    const auction = await getLocationById(id)
    if (auction) {
        console.log(auction)
        res.status(200).json(auction)
        return
    }

    console.error('location not found for id', id)
    res.status(404).send()
}

async function addLocation(req, res) {
    const body = req.body
    const id = body.id
    console.log('POST /locations', body)

    const doesExist = id && await getLocationById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).add(body)
    res.status(200).send()
}

async function addLocationById(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PUT /locations', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collectionName).doc(id).set(body)
    res.status(200).send()
}

async function updateLocation(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /locations', id, body)

    const doesExist = id && await getLocationById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).doc(id).update(body)
    res.status(200).send()
}

// Warning: Deleting a document does not delete its subcollections!
async function deleteLocation(req, res) {
    const id = req.params.id
    console.log('DELETE /locations', id)

    const doc = await db.collection(collectionName).doc(id)
    await doc.delete()
    res.status(200).send()
}