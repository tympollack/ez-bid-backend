const shareable = module.parent.shareable
const db = shareable.db
const url = shareable.url + '/items'
const collectionName = shareable.config.firestore.collections.items.name

//    /api/items/
const routes = require('express').Router()

routes.get('/', queryItems)
routes.post('/', addItem)

routes.get('/:id', getItem)
routes.put('/:id', addItemById)
routes.patch('/:id', updateItem)
routes.delete('/:id', deleteItem)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const getItemById = id => {
    return shareable.utils.firestoreGetThingById(db, collectionName, id)
}

async function queryItems(req, res) {
    const query = req.query
    console.log('GET /items', query ? query : 'ALL')

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
            _rel: 'items',
            href: url
        }]
    }
    res.status(200).json(ret).send()
}

async function addItem(req, res) {
    const body = req.body
    const id = body.id
    console.log('POST /items', body)

    const doesExist = id && await getItemById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).add(body)
    res.status(200).send()
}

async function getItem(req, res) {
    const id = req.params.id
    console.log('GET /items', id)

    const item = await getItemById(id)
    if (item) {
        console.log(item)
        res.status(200).json(item)
        return
    }
    console.error('item not found for id', id)
    res.status(404).send()
}

async function addItemById(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PUT /items', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collectionName).doc(id).set(body)
    res.status(200).send()
}

async function updateItem(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /items', id, body)

    const doesExist = id && await getItemById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).doc(id).update(body)
    res.status(200).send()
}

// Warning: Deleting a document does not delete its subcollections!
async function deleteItem(req, res) {
    const id = req.params.id
    console.log('DELETE /items', id)

    await db.collection(collectionName).doc(id).delete()
    res.status(200).send()
}