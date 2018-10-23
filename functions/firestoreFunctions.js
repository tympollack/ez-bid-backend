const express = require('express')
const cors = require('cors')({ origin: true })
const functions = require('firebase-functions')
const firebase = require('firebase')
require('firebase/firestore')
const vars = require('./vars')
const master = require('./index')

const db = master.db

const userApp = express()
userApp.use(cors)

userApp.get('/:id', async (req, res) => {
    const id = req.params.id
    console.log('GET user', id)

    try {
        const user = await getUserById(id)
        if (user) {
            console.log(user)
            res.status(200).send(JSON.stringify(user))
            return
        }
        console.error('user not found for id', id)
        res.status(404).send()
    } catch (e) {
        console.error(e)
        res.status(500).send(e)
    }
})
userApp.post('/', (req, res) => res.send('posted'))

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