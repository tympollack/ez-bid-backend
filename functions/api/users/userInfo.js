const shareable = module.parent.parent.shareable
const db = shareable.db
const url = shareable.url + '/users'
const collectionName = shareable.config.firestore.collections.users.name

//    /api/users/
const routes = require('express').Router()

routes.get('/', queryUsers)
routes.post('/', addUser)

routes.get('/:id', getUser)
routes.put('/:id', addUserById)
routes.patch('/:id', updateUser)
routes.delete('/:id', deleteUser)

module.exports = routes

/////////////////////////////////////////////////////////////////////

const getUserById = id => {
    return shareable.utils.firestoreGetThingById(db, collectionName, id)
}

async function queryUsers(req, res) {
    const query = req.query
    console.log('GET /users', query ? query : 'ALL')

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
}

async function addUser(req, res) {
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
}

async function getUser(req, res) {
    const id = req.params.id
    console.log('GET /users', id)

    const user = await getUserById(id)
    if (user) {
        console.log(user)
        res.status(200).json(user)
        return
    }
    console.error('user not found for id', id)
    res.status(404).send()
}

async function addUserById(req, res) {
    const body = req.body
    const id = req.params.id
    console.log('PUT /users', id, body)

    if (!id) {
        res.status(400).send()
        return
    }

    await db.collection(collectionName).doc(id).set(body)
    res.status(200).send()
}

async function updateUser(req, res) {
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
}

// Warning: Deleting a document does not delete its subcollections!
async function deleteUser(req, res) {
    const id = req.params.id
    console.log('DELETE /users', id)

    await db.collection(collectionName).doc(id).delete()
    res.status(200).send()
}