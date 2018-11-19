//    /api/users/

const master = require('../../index')
const db = master.shareable.db
const url = master.shareable.url + '/api/users/'

const utils = require('../../utils')
const vars = require('../../vars/vars')
const collectionName = vars.firestore.collections.users.name

const routes = require('express').Router()

routes.get('/', async (req, res) => {
    const query = req.query
    console.log('GET /users', query ? query : 'ALL')

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
                _rel: 'users',
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
    console.log('GET /users', id)

    const user = await getUserById(id)
    if (user) {
        console.log(user)
        res.status(200).send(JSON.stringify(user))
        return
    }
    console.error('user not found for id', id)
    res.status(404).send()
})

routes.post('/', async(req, res) => {
    const body = req.body
    const id = body.id
    console.log('POST /users', body)

    const doesExist = id && await getUserById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).add(body)
    res.status(200).send()
})

routes.put('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PUT /users', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collectionName).doc(id).set(body)
    res.status(200).send()
})

routes.patch('/:id', async(req, res) => {
    const body = req.body
    const id = req.params.id
    console.log('PATCH /users', id, body)

    const doesExist = id && await getUserById(id)
    if (!doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(collectionName).doc(id).update(body)
    res.status(200).send()
})

// Warning: Deleting a document does not delete its subcollections!
routes.delete('/:id', async(req, res) => {
    const id = req.params.id
    console.log('DELETE /users', id)

    await db.collection(collectionName).doc(id).delete()
    res.status(200).send()
})

const getUserById = id => {
    return utils.firestoreGetThingById(db, collectionName, id)
}

module.exports = routes