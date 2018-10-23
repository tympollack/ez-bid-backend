const express = require('express')
const cors = require('cors')({ origin: true })
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')
const vars = require('./vars')
const master = require('./index')
const bodyParser = require('body-parser')

const db = master.db

const userApp = express()
userApp.use(cors)
userApp.use(bodyParser.json())
userApp.use((req, res, next) => {
    try {
        next()
    } catch (e) {
        console.error(e)
        res.status(500).send(e)
    }
})

userApp.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET user', id)

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
    const id = req.body.id
    console.log('POST user', id, req.body.name, req.body)

    const doesExist = id && await getUserById(id)
    if (doesExist) {
        res.status(403).send()
        return
    }

    await db.collection(vars.firestore.collections.users.name)
        .doc().set(req.body)
    res.status(200).send()
})

const getUserById = id => {
    return new Promise(resolve => {
        db.collection(vars.firestore.collections.users.name)
            .doc(id)
            .onSnapshot(doc => {
                resolve(doc.data())
            })
    })
}

exports.user = functions.https.onRequest(userApp)